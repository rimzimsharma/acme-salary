# How AI was used

The brief asks to see how AI tools were used, not just the result. This is an honest account, including where
the AI was wrong and how that was caught.

**Tool:** Claude Code (Anthropic) in the terminal/VS Code, working in this repository. The person building this
steered the work step by step and reviewed it; the AI wrote code, tests, commits and these notes.

## How the work was directed

1. **Requirements first.** A one-page requirements document (goal, scope, deliberate exclusions with reasons)
   was written and reviewed before any code ([REQUIREMENTS.md](REQUIREMENTS.md)).
2. **A fresh project.** An earlier, partly generated attempt existed (two UIs, uncommitted changes, many
   overlapping docs). It was set aside in favour of a clean repo so the history shows real evolution.
3. **Two explicit course corrections from the human** during the build, both followed from then on:
   - *"it should be more focused on TDD focused"*: from that point every behaviour was built as one failing
     test, the minimum code to pass, then a commit; larger batches were split up.
   - *"do incremental commits"*: one behaviour per commit, suite green at every commit.
4. **The loop used for each behaviour:** write one failing test, run it and see it fail for the right reason,
   write the minimum code, run the whole suite, commit. Tests that passed on first run are labelled as
   *guards* in their commit messages rather than presented as red/green.

## Where the AI made mistakes (and how they were caught)

| Mistake | How it was caught | Fix |
|---|---|---|
| A test file was missing its closing `end`, so it never loaded and the first "red/green" report for it was meaningless | The test run printed no result line; the output was inspected instead of trusted | Discarded and redone one behaviour at a time |
| Pay-model tests passed too easily against a constant salary (an ordering check accepted equal values; a country check was too loose) | Reviewing why only 1 of 3 new tests failed in the red step | Tightened the assertions and verified them by **mutation**: flattening seniority or ignoring country now fails the suite |
| A half-installed frontend scaffold was swept into an unrelated commit (`git add -A` while a background install ran) | Reading the commit's file list | Reset the unpushed commit and recommitted in two clean commits |
| One commit was made while a test was failing (a mock replaced the real `ApiError` class) | Reading the test output after the commit | Fixed the mock to keep real error classes, amended the unpushed commit, and gated commits on a green suite afterwards |
| Several backend behaviours were first batched into one commit | The human's incremental-commits instruction | Later work was one behaviour per commit |
| New ESLint React rules rejected effects that set state synchronously | Running ESLint (not just the tests) before declaring the frontend done | Refactored to derived state with all tests unchanged |
| Two commands piped `git commit` output through `head`, which the organisation's commit tooling forbids | The tooling blocked them | Re-ran without the pipe |

## What the human decided

Scope and exclusions, the TDD and commit-granularity requirements, the choice to start fresh, and review of each
step. Design choices (integer salaries, fixed reference rates, median alongside average, salary sorting only
within one country, soft delete) are recorded with reasons in [DESIGN.md](DESIGN.md).

## What was verified by running, not assumed

- Backend 107 tests and frontend 60 tests pass (about 99.5% and 97.8% line coverage); TypeScript and ESLint are clean; the production build succeeds.
- End to end against 10,000 seeded employees: pages load, CORS works from the UI origin, and
  create, update, invalid create (422) and deactivate behave as designed.
- Latencies in [DESIGN.md](DESIGN.md) were measured, not estimated.
