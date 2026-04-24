---
name: release-to-main
description: Promote develop → main for a Steward production release. Handles the PR, the changelog + version bump, and the release-PR auto-merge setup. Tagging + GitHub Release + Firebase deploys run automatically via .github/workflows/release.yml after main merges. Use when the user says "ship to prod", "publish to production", "release", or similar.
---

# Release develop → main (Steward)

This skill encodes the release workflow for Steward. Most of the
release path is automated now — see
[docs/release-automation.md](../../docs/release-automation.md) for
setup. The human still writes the changelog and opens the release PRs;
everything post-main-merge is automatic.

**Automation split:**

- **Manual** (via this skill): changelog entry, version bump, opening
  the `chore(release)` PR and the `develop → main` PR with auto-merge
  enabled.
- **Automatic** (`.github/workflows/release.yml`, on push to `main`):
  tag, GitHub Release, Firestore rules + indexes deploy, Cloud
  Functions deploy.

## Branch topology

- `main` → production (Vercel auto-deploys from here)
- `develop` → staging / CI target
- Feature branches → PR into `develop` (see `feature-branch-workflow`)
- Release → PR from `develop` → `main`

## Merge strategy

Merge-commit is the **only** method enabled at the repo level (squash
and rebase are disabled). This is by design: rebase-and-merge and
squash-merge both rewrite commit SHAs on the merge target, which
historically left `develop` and `main` divergent ("N ahead / N
behind") even though they contained the same changes. With
merge-commit-only enforced repo-wide, the GitHub UI only offers one
button and `develop` stays in sync with `main` automatically after
the release merge — no post-merge realignment needed.

## Versioning

Steward follows [SemVer](https://semver.org/). Pre-1.0 interpretation:

| Bump | Trigger |
| --- | --- |
| **Major** (`1.0.0+`) | Breaking Firestore schema changes, destructive migrations, or major UX pivots |
| **Minor** (`0.x.0`) | New user-facing features |
| **Patch** (`0.0.x`) | Bug fixes, non-functional tweaks only |

The current version lives in `package.json`. It MUST be bumped — and
`CHANGELOG.md` updated — before opening the release PR.

## Pre-flight (before touching anything)

1. Confirm `develop` CI is green:
   ```bash
   gh run list --branch develop --limit 3
   ```
   If red, fix before proceeding. Do NOT release on top of a red CI.

2. Confirm `main` is in sync with `origin/main`:
   ```bash
   git fetch origin main
   git log --oneline main..origin/main   # empty = in sync
   git log --oneline origin/main..main   # empty = no local-only
   ```

3. Inspect the release contents — use this to decide the bump and to
   seed the changelog entries:
   ```bash
   git log --oneline main..develop
   ```

## Update version + CHANGELOG (commit on `develop` before the PR)

Do this as a single commit titled `chore(release): vX.Y.Z`:

1. Pick the next version per the bump table above.

2. Bump `package.json`:
   ```bash
   npm version <patch|minor|major> --no-git-tag-version
   ```
   (Tagging happens post-merge — see the Tag step below.)

3. Update `CHANGELOG.md`:
   - Move the `[Unreleased]` section into a new
     `## [X.Y.Z] — YYYY-MM-DD` heading.
   - Group entries under **Added / Changed / Fixed / Security /
     Infrastructure** subheads. Commit subjects are a starting point,
     not the final copy — rewrite for the end reader.
   - **Pull closed-issue references** for the release window so the
     changelog links back to the backlog that drove the work:
     ```bash
     LAST_TAG=$(git describe --tags --abbrev=0 origin/main)
     LAST_DATE=$(git log -1 --format=%aI "$LAST_TAG" | cut -d'T' -f1)
     gh issue list --state closed --limit 100 \
       --search "closed:>=$LAST_DATE" --json number,title,labels
     ```
     Attach `(#N)` references inline where a bullet corresponds to a
     closed issue.
   - Re-add an empty `## [Unreleased]` at the top of the file.
   - Update the compare links at the bottom:
     ```
     [Unreleased]: https://github.com/aylabyuk/steward/compare/vX.Y.Z...HEAD
     [X.Y.Z]: https://github.com/aylabyuk/steward/releases/tag/vX.Y.Z
     ```

4. Commit both files on a `chore/release-vX.Y.Z` branch and open a PR
   into `develop` with auto-merge enabled. Direct pushes to `develop`
   are blocked by the project's PR-only rule:
   ```bash
   git checkout -b chore/release-vX.Y.Z
   git add package.json CHANGELOG.md
   git commit -m "chore(release): vX.Y.Z"
   git push -u origin chore/release-vX.Y.Z
   gh pr create --base develop --head chore/release-vX.Y.Z \
     --title "chore(release): vX.Y.Z" \
     --body "Release-prep commit for vX.Y.Z. Merge this, then the develop → main PR auto-merges on CI pass."
   gh pr merge --auto --merge  # auto-merges once CI goes green
   ```

5. Wait for the PR to auto-merge. Sync develop:
   ```bash
   git checkout develop && git pull --ff-only
   ```

## Open the release PR (develop → main)

Do NOT fast-forward `main` locally. Open a PR so CI runs on the merge
ref and GitHub enforces the branch's merge strategy.

```bash
gh pr create --base main --head develop \
  --title "Release: <short summary>" \
  --body "<markdown checklist — features, fixes, test plan>"
gh pr merge --auto --merge   # auto-merges once CI is green
```

Auto-merge requires **Settings → Pull Requests → Allow auto-merge** to
be enabled in the repo. If it's disabled, the command errors — flip
the checkbox and retry.

## What happens after merge

**Zero human steps** — the
[.github/workflows/release.yml](../../.github/workflows/release.yml)
workflow runs on every push to `main`:

1. Reads `package.json` version
2. Creates + pushes `vX.Y.Z` tag (skips if it already exists)
3. Creates GitHub Release with the matching CHANGELOG section
4. Deploys Firestore rules + indexes to `steward-prod-65a36`
5. Deploys Cloud Functions to `steward-prod-65a36`

Vercel handles the frontend redeploy via its own GitHub integration.

Watch the Actions tab (**Actions → Release**) to confirm. Typical
run-time is 3–5 minutes. If any step fails, the workflow surfaces the
error and the tag/release may or may not exist depending on where it
failed — rerun after fixing.

Local post-merge sync:

```bash
git fetch origin
git checkout develop && git pull --ff-only origin develop
```

If you maintain any long-running local branches (e.g. `version-2`),
fast-forward them too:
```bash
git checkout version-2 && git merge --ff-only origin/develop
```

Never force-push to `develop` or `main` as part of this flow. The
legacy `git reset --hard && git push --force-with-lease` dance is no
longer needed and is explicitly forbidden — see Guardrails.

## Tag + Firebase deploy — automated

All of this is handled by
[.github/workflows/release.yml](../../.github/workflows/release.yml)
when the `develop → main` PR merges. See
[docs/release-automation.md](../../docs/release-automation.md) for
the full pipeline.

The workflow:

1. Creates the `vX.Y.Z` tag on the merge commit (skips if already there).
2. Publishes a GitHub Release with the matching CHANGELOG section.
3. Deploys Firestore rules + indexes to `steward-prod-65a36`.
4. Deploys Cloud Functions to `steward-prod-65a36`.

Vercel handles the frontend via its own integration — nothing for us
to run.

If the workflow fails, the Actions tab surfaces the error. Common
failure modes and their fixes are documented in
`docs/release-automation.md § Smoke-test the pipeline`.

### Firestore index caveat

Index changes take effect asynchronously. A single-field
collectionGroup query needs a **field override**, not a composite
index. If a deploy rejects with "this index is not necessary,
configure using single field index controls", move the entry from
`indexes` to `fieldOverrides` in `firestore.indexes.json`:

```json
{
  "collectionGroup": "invites",
  "fieldPath": "email",
  "indexes": [
    { "order": "ASCENDING", "queryScope": "COLLECTION" },
    { "arrayConfig": "CONTAINS", "queryScope": "COLLECTION" },
    { "order": "ASCENDING", "queryScope": "COLLECTION_GROUP" }
  ]
}
```

Indexes build async — expect minutes for small collections, longer
for millions of docs. Queries may return partial results until the
build completes.

## Verify

After the Release workflow finishes and the Vercel prod build lands:

- Hit the production URL, sign in, confirm the Schedule loads
- Try one write (e.g. edit a meeting field) to confirm rules accept
  legitimate writes
- Check Firestore Console → Indexes tab: any new indexes should show
  "Building" → "Enabled" within a few minutes

## Guardrails

- **Never direct-push to `develop` or `main`** — everything flows
  through PRs. GitHub's free tier doesn't enforce this, so it's on
  discipline + this skill.
- **Never force-push to `develop` or `main`** under any circumstance.
  The legacy realignment step that used `--force-with-lease` is
  removed; merge-commit-only prevents the drift that required it.
- **Never merge a red PR into `main`.**
- Firebase deploys target `prod` explicitly via `--project=prod`;
  never omit the flag (the default project is `steward-dev-5e4dc`).
- When in doubt, open an extra PR rather than fix-in-main.

## Escape hatch

Admin bypass is on (solo dev, free tier). If a direct push or
force-push is genuinely the right move (emergency rollback, say),
ask the user explicitly and log what was done in a follow-up issue.
