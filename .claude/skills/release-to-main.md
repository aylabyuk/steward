---
name: release-to-main
description: Promote develop → main for a Steward production release. Handles the PR, the changelog + version bump, tagging, and the Firebase rules/indexes deploys. Use when the user says "ship to prod", "publish to production", "release", or similar.
---

# Release develop → main (Steward)

This skill encodes the release workflow for Steward. It exists
because the release path touches three systems: GitHub (PR merge),
Vercel (auto-deploy off `main`), and Firebase (rules + indexes on
`steward-prod-65a36`, deployed by hand).

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

4. Commit both files together and push `develop`:
   ```bash
   git add package.json CHANGELOG.md
   git commit -m "chore(release): vX.Y.Z"
   git push origin develop
   ```

5. Wait for develop CI to go green on this commit.

## Open the release PR

Do NOT fast-forward `main` locally. Open a PR so CI runs on the merge
ref and GitHub enforces the branch's merge strategy.

```bash
gh pr create --base main --head develop \
  --title "Release: <short summary>" \
  --body "<markdown checklist — features, fixes, test plan>"
```

Wait for CI to go green on the PR before merging.

## Merge

Click Merge on the GitHub UI — the only available method is "Create
a merge commit" (enforced at the repo level). Confirm with the user
before the click — this is a high-severity production action.

## Post-merge sync

Merge-commit preserves develop's SHAs on main, so the post-merge
state is: `main == develop + one merge commit`. Pull the merge
commit down onto develop with a fast-forward:

```bash
git fetch origin
git checkout develop
git pull --ff-only origin develop    # picks up the merge commit
```

If you maintain any long-running local branches (e.g. `version-2`),
fast-forward them too:
```bash
git checkout version-2 && git merge --ff-only origin/develop
```

Never force-push to `develop` or `main` as part of this flow. The
legacy `git reset --hard && git push --force-with-lease` dance is no
longer needed and is explicitly forbidden — see Guardrails.

## Tag the release

Tag the merge commit on `main` with the version from `package.json`.
Tags drive the compare links in `CHANGELOG.md` and become the source
of truth for "what's in production right now".

```bash
git checkout main
git pull --ff-only origin main
VERSION=$(node -p "require('./package.json').version")
git tag -a "v$VERSION" -m "Release v$VERSION"
git push origin "v$VERSION"
```

Optionally, create a GitHub Release from the tag with the changelog
section as the body:

```bash
gh release create "v$VERSION" --title "v$VERSION" \
  --notes-file <(awk "/## \[$VERSION\]/,/## \[/{print}" CHANGELOG.md | sed '$d')
```

## Deploy Firebase (prod project: steward-prod-65a36)

Only the frontend deploys via Vercel automatically. Firestore rules
and indexes must be deployed manually. Pause for explicit user
confirmation before each command.

### 1. Rules

```bash
firebase deploy --only firestore:rules --project=prod
```

Expect: "rules file firestore.rules compiled successfully" +
"Rules published successfully". Takes seconds.

### 2. Indexes

```bash
firebase deploy --only firestore:indexes --project=prod
```

Caveat: a single-field collectionGroup query needs a **field
override**, not a composite index. If deploy rejects with "this index
is not necessary, configure using single field index controls", move
the entry from `indexes` to `fieldOverrides`:

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
for millions of docs. Queries may return partial results until
build completes.

### 3. Cloud Functions (only if functions/ changed)

```bash
firebase deploy --only functions --project=prod
```

Check first:
```bash
git diff origin/main~N..origin/main -- functions/ | head -5
```
where N is the release size. Skip if empty.

## Verify

After rules + indexes deploy + the Vercel prod build lands:

- Hit the production URL, sign in, confirm the Schedule loads
- Try one write (e.g. edit a meeting field) to confirm rules accept
  legitimate writes
- Check Firestore console → Indexes tab: any new indexes should show
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
