# Plan and decision log

How the work was planned and sequenced, and what was decided along the way. For the reasoning behind the
design itself see [DESIGN.md](DESIGN.md); for scope see [REQUIREMENTS.md](REQUIREMENTS.md).

## Approach

1. **Frame the product before writing code.** One-page requirements for a single persona (the HR Manager): goal,
   success criteria, what is in scope, and what is deliberately left out and why.
2. **Thin vertical slices, test-first.** Each behaviour: one failing test, the minimum code to pass, a refactor
   if needed, one commit. Backend first (the numbers HR relies on), then the UI on top of a stable API.
3. **Make the risky parts provable.** Money maths, outlier detection, and search safety get boundary tests,
   and key tests are checked by deliberately breaking the code (mutation) to prove they can fail.
4. **Measure, do not assume.** Performance is timed against the full 10,000-row data set; coverage is measured;
   an independent reviewer agent audits the result against the brief.

## Sequence

| # | Step | What it delivered | Status |
|---|---|---|---|
| 1 | Requirements document | Goal, scope, exclusions with reasons | Done |
| 2 | Stack and project setup | Rails API + Next.js in one repo; a fresh start rather than extending an earlier partly generated attempt | Done |
| 3 | Data model | `Employee` with validation, soft delete, composite indexes | Done |
| 4 | Seed script | 10,000 deterministic, realistic employees in about 0.3 s, with planted outliers | Done |
| 5 | Employee API | List (search, filter, sort, page), show, create, update, deactivate, filter options | Done |
| 6 | Insights API | Summary, breakdown by four dimensions (USD and local), outliers | Done |
| 7 | Frontend | Employees page (list, add, edit, deactivate) and Insights dashboard | Done |
| 8 | Quality gates | Coverage reports, ESLint, TypeScript, RuboCop, two independent audits and their fixes | Done |
| 9 | Documentation | README, design, diagrams, AI usage, this plan, artifacts index | Done |
| 10 | Deployment | A public URL for the hiring team | **Not done yet** |
| 11 | Demo video | Short walkthrough of both screens | **Not done yet** |

## Decision log

| Decision | Alternatives considered | Why |
|---|---|---|
| Start a new project | Build on the earlier attempt | The earlier code had two UIs for one job, uncommitted changes and overlapping generated docs; the brief grades how the solution evolves commit by commit |
| Rails API-only + Next.js | Rails with server-rendered views | The brief asks for a React or Next UI; a clear API boundary also makes the logic easy to test |
| SQLite | PostgreSQL | Enough for one org and 10,000 rows; zero setup for reviewers. Noted as the first thing to change for multi-user deployment |
| Salary as an integer in whole currency units | Decimal or minor units (cents) | No float error; no cents needed for annual pay; avoids JPY's zero-decimal case |
| Fixed reference exchange rates | Live rates | No network dependency; results are reproducible and testable. The UI states that USD figures use reference rates |
| Median alongside average | Average only | A few very high salaries distort averages of pay |
| Outliers vs peers (country, title, seniority; 0.7x to 1.4x; at least 5 peers) | Global standard deviation | Peers make the comparison fair; thresholds are constants that are easy to tune |
| Soft delete (`active` flag) | Hard delete | HR keeps records of people who have left; insights count active staff only |
| Statistics in Ruby over a plucked column slice | SQL aggregates | SQLite has no median; simple and fast at this size (insights 9 to 83 ms) |
| Salary sorting only within one country | Always sortable | Raw INR and USD amounts are not comparable |
| Mantine and Recharts | Hand-rolled components | Accessible, tested components; less custom UI code to maintain |
| Derived state instead of state-resetting effects | Reset in `useEffect` | ESLint's React rules flagged the effects; derived values are simpler and avoid extra renders |
| Reviewer agents and a `/rubocop` command committed to the repo | Ad hoc checks | Anyone can re-run the audits; they are also an instructions artifact |

## Risks and how they were handled

| Risk | Handling |
|---|---|
| Tests that pass but prove little | Boundary tests plus mutation checks; two independent audits found and closed gaps (see [AI_USAGE.md](AI_USAGE.md)) |
| Salary data is sensitive | No authentication in v1 (out of scope, stated openly); listed as the first follow-up |
| Different currencies compared incorrectly | USD view with fixed rates; local view only when a group has one currency; salary sort limited to one country |
| Search input reaching SQL | Sort columns whitelisted, LIKE wildcards escaped, strong params, page size capped |
| Slow lists at 10,000 rows | Paging in SQL, composite indexes, measured timings in [DESIGN.md](DESIGN.md) |

## Deferred, with reasons

Authentication and roles; salary history and audit trail; bulk CSV import; live exchange rates; demographic
pay-equity analysis; keyset paging and pre-aggregated insights for much larger data. See the exclusions table in
[REQUIREMENTS.md](REQUIREMENTS.md) and the limitations list in [DESIGN.md](DESIGN.md).
