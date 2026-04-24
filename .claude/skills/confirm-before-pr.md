---
name: confirm-before-pr
description: Before opening a feature or enhancement PR, pause and check with the user about scope, whether to file an issue instead, or whether to plan first. Use when you're about to kick off a new feature branch from a user's request — i.e. before invoking the feature-branch-workflow skill's PR-creation step. Skip only for live production incidents (see "When to skip" below).
---

# Pause before creating a feature PR

The user wants a confirmation checkpoint before any new feature or enhancement PR is created. Too often we end up with a narrowly-scoped PR shipped before the user has had a chance to fold in adjacent work, reframe the change as a tracked issue, or think through the approach.

## When to apply

You are about to **start implementation or open a PR** for a new piece of work the user just described. Symptoms:

- User described a feature, improvement, or non-urgent fix.
- No existing plan file or in-flight branch covers it yet.
- The normal next step would be to start coding / branch off / invoke the `feature-branch-workflow` skill's PR step.

This skill gates that step.

## When to skip

- **Live production incident** — users affected right now, broken push delivery, a deploy that 403'd, a security issue. Ship first, reflect later. The stop-the-bleeding mindset wins over process.
- **Continuation of an already-agreed task** — we already went through this checkpoint earlier in the session, the user gave direction, and you're finishing the same piece of work.
- **Mechanical housekeeping the user explicitly kicked off** — "cut a release", "update the changelog", "re-dispatch the workflow". These are known commands, not new features.
- **Trivial docs / comment fixes** — a typo, a stale reference. Pre-decide nothing, just do it.

## The checkpoint

After you've *understood* what the user wants (and possibly sketched what you'd change, without actually writing it), ask something shaped like:

> Before I start — a few options:
>
> 1. **Proceed with PR.** I'll branch off develop, implement [specific scope], and open the PR.
> 2. **Expand scope.** Anything else you want folded in while I'm in this area? Related fixes, adjacent features, refactors?
> 3. **File as a GitHub issue first.** I'll log it to the backlog without implementing yet.
> 4. **Plan first.** I'll outline the approach (affected files, tradeoffs, test plan) and we review before writing code.
>
> Which one?

Adapt the wording — the four options are the mandatory shape, not the copy. Be concrete about the proposed scope in option 1 so the user can see exactly what they'd be approving.

## After the user answers

- **1 — Proceed**: continue via `feature-branch-workflow` (or whichever flow fits).
- **2 — Expand scope**: take the extra asks, re-summarise the bundled scope, then optionally re-checkpoint if the shape changed substantially. Otherwise roll straight in.
- **3 — File issue**: hand off to the `log-issue` skill. Don't open a PR this session unless the user separately asks.
- **4 — Plan first**: produce a written plan (files touched, approach, tradeoffs, test plan, out-of-scope items). Wait for approval before implementing.

## Announcing readiness

Separate signal the user cares about: when you've finished implementing and are about to open the PR, **tell them before pushing to origin**, not after the `gh pr create` call. One sentence like:

> Changes are ready. Files: [list]. Tests: [summary]. About to push branch `feat/foo` and open the PR into `develop` — OK to proceed, or want to review the diff first?

This gives the user a last-pass chance to amend, especially for anything that will trigger auto-merge via the release-title filter or kick off Vercel preview deploys.

## Guardrails

- **One checkpoint per task**, not a gate on every tool call. Once the user says "proceed", execute freely until the PR is ready to announce.
- **Don't re-ask a question the user already answered** in the same turn. If they said "just do it" or gave an explicit direction ("add X and Y, open the PR"), honor that.
- **Don't turn this into a planning-mode veto.** The user can override any of the four options with "go" at any time.
- Pair this with the `log-issue` + `feature-branch-workflow` skills; none of them are obsolete. This skill fires *before* you'd normally branch.
