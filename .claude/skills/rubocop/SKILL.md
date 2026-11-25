---
name: rubocop
description: Run RuboCop (Rails omakase style) on the Ruby backend and report the result. Use "/rubocop" to check, or "/rubocop fix" to auto-fix safe offenses.
argument-hint: "[fix]"
disable-model-invocation: true
allowed-tools: Bash(bundle exec rubocop:*), Bash(export PATH=*), Bash(cd backend*), Read
---

Check the Ruby style of the backend with RuboCop. The standard is the Rails omakase rule set configured in
`backend/.rubocop.yml`.

Arguments: `$ARGUMENTS`

## Steps

1. Work from the `backend/` directory. If `bundle` is not found, run
   `export PATH=/opt/homebrew/opt/ruby@3.3/bin:/opt/homebrew/lib/ruby/gems/3.3.0/bin:$PATH` first.
2. **If the arguments are empty (check only):**
   - Run `bundle exec rubocop` and show the summary line (files inspected, offenses).
   - If there are offenses, also run `bundle exec rubocop --format offenses` and present a short table of
     rule, count, and whether it is safe to auto-fix. List the files most affected.
   - Do not change any file. Tell the user they can run `/rubocop fix` to fix the safe offenses.
3. **If the arguments are exactly `fix`:**
   - Run `bundle exec rubocop -a` (safe corrections only; never use `-A`).
   - Run `bundle exec rubocop` again and report what is left, if anything. Offenses that remain need a human
     decision; explain each briefly.
   - Run the test suite (`bin/rails test`) to confirm nothing broke, and report the result.
   - Do not commit. Show `git diff --stat` so the user can review the change.
4. **Any other argument:** explain that the only supported argument is `fix`, and do nothing else.

Keep the report short: the result first, details only if there are offenses.
