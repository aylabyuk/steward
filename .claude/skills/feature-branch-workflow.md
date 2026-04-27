---
name: feature-branch-workflow
description: Start a non-trivial change on a feature branch off develop and open a PR into develop when done — never commit directly to develop or main. Use when the user says "let's add X", "let's fix X", "implement Y", "work on Z", or any similar start-of-task phrase that implies code or non-trivial docs changes.
---

# Feature-branch workflow

Every non-trivial change — feature, bugfix, refactor, docs sprint —
lands on its own branch, ships as a PR into `develop`, and merges with
a merge commit. Nothing goes directly onto `develop` or `main` except
via a PR. The `log-issue` skill files the ticket; this skill does the
implementation side.

## When this applies

- User says "let's add X", "let's fix X", "implement Y", "work on Z".
- The task will produce one or more commits.
- The change is non-trivial — i.e. not a one-line typo fix or a
  session-local experiment.

## When to skip

- One-line typo / comment fix in a doc file (commit directly via a
  short-lived branch still preferable, but judgment call).
- Exploration / spike work that won't be kept.
- A release PR (use the `release-to-main` skill instead — that one
  targets `main`).

## Branch naming

Prefix by change kind, then a kebab-case slug. Match the commit
prefix so the branch and first commit line up:

| Prefix | For |
| --- | --- |
| `feat/…` | New user-facing capability |
| `fix/…` | Bugfix |
| `chore/…` | Tooling, CI, deps, non-user-facing |
| `docs/…` | README / CHANGELOG / in-code docs |
| `refactor/…` | Internal restructuring, no behavior change |
| `test/…` | Coverage-only changes |
| `ci/…` | GitHub Actions / workflow changes |

Examples:
- `feat/invite-email-preview`
- `fix/offline-banner-flicker-on-reload`
- `chore/bump-firebase-admin`
- `docs/clarify-approval-lifecycle`

Keep it under 50 chars. Reference an issue if one exists:
`fix/42-offline-banner-flicker`.

## Steps

### 1. At task start, propose + create the branch

Before writing any code, tell the user the branch name you're about
to create. Ask once if it's not obvious:

> "I'll do this on `feat/invite-email-preview` — OK?"

Then create + switch:
```bash
git fetch origin develop
git checkout -b feat/invite-email-preview origin/develop
```

If the user is already on a feature branch from a prior session
(something other than `develop` / `main`), stay on that branch rather
than branching-off-a-branch unless it's clearly a separate task.

### 2. Work in small atomic commits

Same conventions as the rest of the repo — short imperative subject
lines prefixed by type:
```
feat(invites): preview the mailto body before sending
fix(offline): don't flash "back online" on first load
```

Reference issues with `Refs #N` while in progress; save `Fixes #N` for
the commit that actually resolves it (auto-closes on merge).

### 3. Push the branch on first commit

```bash
git push -u origin feat/invite-email-preview
```

### 4. When the work is ready, open a PR into develop

```bash
gh pr create --base develop --head feat/invite-email-preview \
  --title "feat(invites): preview the mailto body before sending" \
  --body "<summary · approach · test plan · screenshots if UI · Fixes #N>"
```

Wait for CI green.

### 5. Merge

Merge-commit is the only method enabled at the repo level, so there's
no "which button" question. Click Merge. GitHub auto-deletes the
branch; if not, delete it manually.

### 6. Post-merge cleanup

```bash
git checkout develop
git pull --ff-only origin develop
git branch -d feat/invite-email-preview   # local cleanup
git fetch --prune origin                   # drops the remote-tracking ref
```

## What NOT to do

- **Don't commit directly to `develop`** — even for a one-line doc
  fix. GitHub isn't enforcing this on the free tier; discipline is.
- **Don't commit directly to `main`** — ever.
- **Don't stack PRs.** Every PR's base must be `develop` (or `main`
  for a release PR), never another feature branch. Stacked PRs become
  orphans the moment the parent branch is deleted post-merge — see
  PR #173, which was based on `feat/prayer-chat-parity`, sat dirty
  when that base was deleted, and stranded 13 commits of finished
  work (including the merged-but-stranded #175 plan-prayers wizard)
  outside of `develop` for a full release cycle. If a feature
  naturally splits into multiple PRs, ship the foundational PR first,
  wait for it to merge into `develop`, then branch the next slice off
  the new `develop`. The cost of waiting one CI cycle is far less
  than the cost of an orphaned stack.
- **Don't force-push to `develop` or `main`**, even with
  `--force-with-lease`. (The `release-to-main` skill used to, for
  drift cleanup. It no longer does, because merge-commit-only is now
  enforced repo-wide — the drift that necessitated the force-push
  can't recur.)
- **Don't squash or rebase on merge** — the repo settings hide those
  buttons for a reason.

## Escape hatch

Admin bypass is on (solo dev, free tier). If a direct push or
force-push is genuinely the right move (e.g. recovering from a
mistake), ask the user explicitly and log what was done in a follow-up
issue so the trail isn't silent.
