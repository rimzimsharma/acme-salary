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
   - *"do incremental commits"*: one behaviour per commit, suite run before each commit.
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
| A second review found more unpinned behaviour: five of seven currency rates, the rounding of the outlier percentage, tie order for equal outliers, the stale-response guard on the employee list, and the zero-salary rule | The `quality-reviewer` agent again, mutating copies of the code | Added a test for each and confirmed each mutation now fails. Writing the zero-salary test exposed a real bug: the form silently turned a salary of 0 into 1 and saved it |
| The hire-date check compared the user's local date with the UTC date, so early-morning users east of UTC could be told today was in the future | The same review | Added `todayLocal()`; its tests pin the time zone and fail against the old UTC version |
| Outlier thresholds, the dollar rounding, the `limit` cap and the paging tie-break could each be changed without a single test failing, despite ~99% coverage | An independent review by the `quality-reviewer` agent, which applied one-line mutations to a copy of the code | Added boundary tests (exactly 5 peers, exactly 1.4x / 0.7x, rounding, tie-break, limit clamp) and re-ran all seven mutations: every one now fails the suite |

## What the human decided

Scope and exclusions, the TDD and commit-granularity requirements, the choice to start fresh, and review of each
step. Design choices (integer salaries, fixed reference rates, median alongside average, salary sorting only
within one country, soft delete) are recorded with reasons in [DESIGN.md](DESIGN.md).

## What was verified by running, not assumed

- Backend 110 tests and frontend 66 tests pass (99.6% and 97.8% line coverage); RuboCop reports no offenses; TypeScript and ESLint are clean; the production build succeeds.
- End to end against 10,000 seeded employees: pages load, CORS works from the UI origin, and
  create, update, invalid create (422) and deactivate behave as designed.
- Latencies in [DESIGN.md](DESIGN.md) were measured, not estimated.

## Instructions that steered the AI

These are the actual directions given during the build (the rest of the work followed from the brief itself).

- **The brief**, supplied as a document: build employee salary management for 10,000 employees as an HR-manager
  tool, test-first and with incremental commits, and write a one-page requirements document before building.
- **Order of work:** "give me a requirement document before building software, outlining the goal, scope,
  features, what we are deliberately leaving out, and the reasoning". Only after it was confirmed did the build start.
- **Starting point:** "it's up to you whether the previous one is good to proceed with, or we start from scratch".
  The AI recommended a fresh start, and the human agreed.
- **Working style, mid-build:** "it should be more focused on TDD" and "do incremental commits".
- **The loop the AI followed for each behaviour:** write one failing test, run it and confirm it fails for the
  right reason, write the minimum code to pass, run the whole suite, commit one behaviour. Tests that passed on
  first run are labelled as guards.
- **Reviewing the result:** the project ships a read-only reviewer agent,
  [`.claude/agents/quality-reviewer.md`](../.claude/agents/quality-reviewer.md), written from the brief's own
  criteria. Anyone can run it in Claude Code to audit the repo. Its first run found the weak tests listed above.
