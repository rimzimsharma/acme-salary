# ACME Salary Management

Web software for an HR Manager to maintain salary data for ~10,000 employees across countries and to answer
"how do we pay people?" without spreadsheets.

- **Requirements (written before building):** [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)
- **Design, trade-offs, performance:** [docs/DESIGN.md](docs/DESIGN.md)
- **Architecture diagrams:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **How AI was used (and where it was wrong):** [docs/AI_USAGE.md](docs/AI_USAGE.md)

## What it does

| Screen | Capabilities |
|---|---|
| **Employees** | Search by name/email; filter by country, department, seniority, status; sort; paginate (10k rows); add, edit, deactivate (soft delete) |
| **Insights** | Headcount, total payroll, median pay; pay by country / department / job title / seniority (min, median, max, in USD and local currency); outliers versus peers |

## Stack

- **Backend:** Ruby on Rails 7.2 (API-only), SQLite
- **Frontend:** Next.js 16 (App Router, TypeScript), Mantine UI, Recharts
- **Tests:** Minitest (backend), Vitest + Testing Library (frontend)

## Run it locally

Prerequisites: Ruby 3.3, Node 20+.

```bash
# 1. API (http://localhost:3001)
cd backend
bundle install
bin/rails db:setup          # creates the database and seeds 10,000 employees (~1s)
bin/rails server -p 3001

# 2. UI (http://localhost:3000) - in a second terminal
cd frontend
npm install
npm run dev
```

Useful variants:

```bash
EMPLOYEE_COUNT=500 bin/rails db:seed        # smaller data set; re-running replaces existing employees
NEXT_PUBLIC_API_URL=https://api.example.com npm run build   # point the UI at another API
FRONTEND_ORIGINS=https://ui.example.com bin/rails server    # allowed browser origins (CORS)
```

## Tests

```bash
cd backend  && bin/rails test      # 110 tests, runs in about a second
cd frontend && npm test            # 66 tests
cd frontend && npx tsc --noEmit && npx eslint .
cd backend  && bundle exec rubocop        # Ruby style (Rails omakase); add -a to auto-fix safe offenses

# Coverage reports
cd backend  && COVERAGE=1 bin/rails test     # line + branch, HTML in backend/coverage (99.6% line / 97.4% branch)
cd frontend && npm run test:coverage         # HTML in frontend/coverage (97.8% line / 94.9% branch)
```

## API

All under `/api/v1`. JSON in, JSON out.

| Method and path | Purpose |
|---|---|
| `GET /employees` | List. Params: `q`, `status` (active/inactive/all), `country`, `department`, `job_title`, `seniority`, `sort`, `dir`, `page`, `per_page` (max 100) |
| `GET /employees/:id` | One employee (404 if missing) |
| `POST /employees` | Create (201, or 422 with per-field errors) |
| `PATCH /employees/:id` | Update (cannot change the active flag) |
| `DELETE /employees/:id` | Deactivate (soft delete) |
| `GET /employees/filter_options` | Values for the filter dropdowns |
| `GET /insights/summary` | Headline figures |
| `GET /insights/breakdown?by=country\|department\|job_title\|seniority` | Pay statistics per group; optional drill-down filters |
| `GET /insights/outliers?limit=` | People paid far from their peers |

## Repository layout

```
backend/    Rails API: models, query objects (app/queries), insights (app/services/insights), seeding
frontend/   Next.js app: components, API client (lib/), tests alongside the code
docs/       Requirements, design notes, AI usage
```
