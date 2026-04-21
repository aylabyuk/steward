---
name: log-issue
description: Create a GitHub issue for a discovered bug, feature request, or tech-debt item. Use when the user says "log this", "file a bug", "create an issue", "add to backlog", or when you proactively surface a mid-session discovery worth tracking. Skip for fixes you're about to do right now.
---

# Log a GitHub issue

Turn a mid-session discovery into a trackable backlog item instead of
losing it in chat history. The repo has issue templates at
`.github/ISSUE_TEMPLATE/` — follow the shape so UI-filed issues and
CLI-filed issues read the same.

## When to use

- User explicitly asks: "log this", "file a bug", "create an issue".
- **Proactive surface**: you discover something that WON'T be fixed in
  the next step — a bug you're documenting but not fixing, a feature
  idea mentioned in passing, a known shortcut you're taking, a flaky
  test, a TODO you're intentionally leaving. Ask the user once:
  > "Log this as an issue, or skip?"

## When NOT to use

- Trivial fixes you're about to do in the next 5–10 minutes (commit
  message is enough).
- Code review feedback you're about to address in the same session.
- Design preferences that belong in `CLAUDE.md` or design docs, not
  the issue tracker.

## Category → template → labels

| Kind | Template | Labels |
| --- | --- | --- |
| Something is broken | Bug report | `bug`, `needs-triage` |
| New capability / workflow | Feature request | `enhancement`, `needs-triage` |
| Refactor, shortcut to unwind | Tech debt / cleanup | `tech-debt`, `needs-triage` |
| Rules / data exposure / auth | Bug report | add `security` on top of `bug` |

The issue templates already apply the primary + `needs-triage` labels
automatically when a user files from the GitHub UI. When you file via
the CLI (below), pass the same labels explicitly with `--label`.

## Steps

1. **De-dupe first.** Search open issues for keywords from the title:
   ```bash
   gh issue list --state open --search "<2-3 keywords>"
   ```
   If a close match exists, reference it instead of filing a duplicate
   (add a comment on the existing issue with `gh issue comment`).

2. **Write a title under 70 chars.** Describe the problem, not the
   fix. Good: "Couldn't save toast persists after successful retry".
   Bad: "Fix toast".

3. **Write the body to match the template shape**:
   - *Bug*: summary · steps to reproduce · context · screenshots/logs
   - *Feature*: problem · proposed behavior · done-when checklist
   - *Tech debt*: what's the shortcut · why fix · rough plan · refs

4. **Create**:
   ```bash
   gh issue create \
     --title "<title>" \
     --label "bug,needs-triage" \
     --body "$(cat <<'EOF'
     ## Summary
     ...

     ## Steps to reproduce
     1. ...
     2. ...

     ## Context
     ...
     EOF
     )"
   ```
   For feature / tech-debt, use the matching section headings from
   the template.

5. **Return the URL** to the user and (if mid-session) note what
   you're doing next.

## Linking

- In a commit that fixes an issue: use `Fixes #N` or `Closes #N` in
  the message body so GitHub auto-closes on merge to `main`.
- In the `CHANGELOG.md` entry: reference the issue inline as `(#N)`.

## Guardrails

- Never assign issues to yourself or anyone else — default unassigned.
- Never add priority labels (`p0`, `p1`…) without explicit user
  direction. `needs-triage` is the default.
- Security issues: if the content is sensitive (an actively exploitable
  bug), ask before filing publicly. Otherwise file with the `security`
  label so it stands out in triage.
- If the de-dupe search turns up 2+ close matches, stop and ask the
  user which to reference rather than guessing.
