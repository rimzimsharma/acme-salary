# Design notes

How the system is built and why. Scope decisions live in [REQUIREMENTS.md](REQUIREMENTS.md).

## Architecture

```
Browser ── Next.js UI (client components) ──fetch/JSON──▶ Rails API ──▶ SQLite
                                                           │
                          controllers (thin) ──▶ EmployeeSearch   (list: filter, search, sort, page)
                                             ──▶ Insights::*      (summary, breakdown, outliers)
                                             ──▶ Employee         (validation, soft delete)
```

- **Thin controllers, logic in plain objects.** `EmployeeSearch` and `Insights::*` take plain inputs and
  return plain data, so they are tested without HTTP. Controllers only translate params, status codes and JSON.
- **The API owns the numbers.** The UI never recomputes pay statistics; it formats what the API returns.
- **Separate API and UI** (as the brief requires a React/Next UI), connected by a small typed client in
  `frontend/lib/api.ts` with explicit error classes (`ApiError`, `ValidationError`).

## Data model

One table, `employees`: name, unique email, job title, department, country, currency, annual salary,
seniority, hire date, `active`.

| Decision | Why |
|---|---|
| Salary is an **integer in whole currency units** | No float rounding; no cents needed for annual base pay; avoids JPY's zero-decimal edge case that "minor units" would raise |
| `active` flag instead of deleting | HR keeps records of people who have left; insights count active staff only |
| Email stored lowercase, unique case-insensitively | Prevents duplicates differing only by case |
| Composite indexes on `(active, country)`, `(active, department)`, `(active, seniority)`, `(active, country, job_title)` | The default view is "active staff" plus one filter; the last one serves "title within a country" |

## Multiple currencies

Averaging INR with USD is meaningless, so every salary keeps its own currency and insights offer two views:

- **USD view** using **fixed reference rates** (`CurrencyRates::PER_USD`), for comparing across countries.
- **Local view** when a group is single-currency (for example, a country).

Fixed rates are a deliberate trade-off: live rates add a network dependency and make results change between
runs and tests. The UI states that USD figures use reference rates. Sorting the employee list by salary is only
offered within one country, because raw local amounts are not comparable.

## Insights

- **Median as well as average.** A few very high salaries drag an average away from "typical" pay.
  `Insights::Statistics` rounds halves up and is tested on odd, even, single and empty inputs.
- **Outliers** compare each person to the median of peers sharing country, job title and seniority:
  flagged below 0.7x or above 1.4x, groups smaller than 5 skipped. Thresholds are constants, easy to tune.
  They are a prompt to look, not a verdict.
- Statistics are computed in Ruby over a plucked slice of columns for active employees; at 10,000 rows this is
  fast (see below) and keeps median logic simple and testable, since SQLite has no median function.

## API behaviours worth knowing

- Sort columns are **whitelisted** before reaching SQL; `%` and `_` in search text are escaped; `per_page` is
  capped at 100; bad page values fall back to defaults; a page past the end is empty, not an error.
- `PATCH` cannot change `active`; only `DELETE` deactivates. Unpermitted attributes (such as `id`) are ignored.
- Validation errors return 422 with errors per field; the UI shows each next to its input and keeps what the
  user typed. Unknown insight groupings return 400.

## Frontend choices

- **Mantine** for accessible, well-tested components; **Recharts** (through Mantine Charts) for one bar chart,
  with the table as its text equivalent.
- Search is **debounced** (300 ms). Responses that arrive after a newer request started are ignored, so a slow
  old request cannot overwrite newer data.
- Page number, loading and error state are **derived** from the request they belong to rather than reset in
  effects (ESLint's React rules flagged the earlier version; see the refactor commit).

## Testing approach

Built test-first in small red/green steps; each commit is one step and the suite is green at every commit.

| Layer | Tests | Notes |
|---|---|---|
| Model, query objects, insights, seeding | Minitest, 107 tests | Run in about a second against a file-based SQLite test database |
| API | Integration tests per endpoint | Status codes, payloads, strong params, CORS |
| Frontend logic | Vitest | Formatters, query builder, API client with mocked `fetch` |
| Frontend components | Testing Library | Behaviour by role and label: loading, empty, error, search, filters, paging, sorting, add/edit/deactivate, insights |

The pay-model tests were first too weak (passing against a constant salary); they were tightened and checked by
**mutation** (deliberately breaking the model and confirming the suite fails). See [AI_USAGE.md](AI_USAGE.md).

## Performance

Measured on a laptop against the 10,000 seeded employees (development server):

| Operation | Time |
|---|---|
| `bin/rails db:seed` (10,000 rows, bulk insert in batches of 1,000) | about 0.3 s |
| List with filters, text search, sort, deep paging | 11 to 20 ms |
| Insights summary and breakdowns | 9 to 20 ms |
| Outliers | about 83 ms |
| First request after boot | about 220 ms (code loading) |

All are inside the requirements targets (lists under 300 ms, insights under 1 s). The list query is paged in
SQL (`LIMIT/OFFSET`), counts use the same filtered relation, and filters hit composite indexes.

## Known limitations and next steps

- **No authentication or roles.** Salary data is sensitive; this is the first thing to add before real use.
- **No salary history or audit trail** (single current salary). Planned first follow-up.
- `OFFSET` paging slows on very deep pages; keyset paging would help at much larger scale.
- Insights are computed on request; at far larger scale, cache or pre-aggregate.
- Reference exchange rates are static and would need an owner and a refresh process.
- SQLite is right for this scope; a multi-user deployment would move to PostgreSQL.
