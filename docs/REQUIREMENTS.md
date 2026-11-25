# Salary Management: Requirements (v1)

## Goal
Replace the HR team's Excel files with a web app where the HR Manager can maintain salary data for ~10,000 employees across multiple countries and answer "how do we pay people?" in seconds, without building pivot tables.

**Persona:** one HR Manager of ACME. They are non-technical, work with the data daily, and need to trust the numbers.

## Success criteria
- Find any employee in under 5 seconds (search + filters) on 10,000 records.
- Add, edit, and deactivate an employee in under 1 minute, with bad data rejected at entry.
- Answer these questions from one screen, no export needed:
  1. What is the pay range (min / median / max) for a job title in a country?
  2. Which countries and departments cost the most, and how many people are in each?
  3. How does pay progress by seniority level?
  4. Who is paid unusually high or low relative to peers (same country, title and seniority)?
- List pages respond in under 300 ms and insights in under 1 s at 10,000 rows.

## In scope (v1)
| Area | Features | Why |
|---|---|---|
| Employee records | Create, view, edit, deactivate (soft delete); validations; unique email | Core replacement for the spreadsheet |
| Browse | Server-side pagination, search by name/email, filter by country, department, title, seniority, status, sort | 10k rows cannot load into one page |
| Multi-country pay | Salary stored with its own currency; insights show per-currency figures and a USD-normalised view using fixed, labelled reference rates | Averaging INR with USD is meaningless; the HR Manager needs both views |
| Insights | Headcount, total payroll, min/median/avg/max by country, department, title, seniority; outlier list | Directly answers the problem statement. Median matters more than average for pay data |
| Data | Seed script producing 10,000 realistic employees; fast, deterministic tests | Required by the brief |

## Deliberately left out (and why)
| Not in v1 | Reason |
|---|---|
| Login, roles, permissions | Single persona and a demo scope. **Real risk:** salary data is sensitive, so auth is the first thing to add before production use |
| Salary history / audit trail | Valuable, but it doubles the data model. Planned as the first follow-up; v1 keeps a single current salary |
| Live exchange rates | External dependency, non-deterministic tests. Fixed reference rates are shown in the UI instead |
| Payroll, tax, benefits, bonus, equity | A different product (payroll). v1 covers base salary only |
| Bulk CSV import | Seeding covers initial data. Import needs error reporting and dedupe rules, which is real scope |
| Gender or demographic pay-equity analysis | Needs sensitive fields and legal review. Better to leave out than do badly |
| Multi-tenancy, i18n, mobile-first layout | The org is a single company and the user is an HR desktop user |

## Key assumptions
- Salary means annual base pay in the employee's local currency.
- A country maps to one currency in the seed data, but the model does not enforce this.
- "Delete" means deactivate, because HR needs to keep records of past employees. Insights count active employees only.
