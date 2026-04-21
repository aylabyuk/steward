---
name: release-to-main
description: Promote develop → main for a Steward production release. Handles the PR, the correct merge strategy, the post-merge develop realignment, and the Firestore deploys. Use when the user says "ship to prod", "publish to production", "release", or similar.
---

# Release develop → main (Steward)

This skill encodes the release workflow for Steward. It exists because
the release path touches three systems (GitHub, Vercel auto-deploy off
`main`, Firebase rules/indexes on `steward-prod-65a36`) and the
previous release drifted the branches ("N commits ahead, N commits
behind") due to the wrong merge strategy.

## Branch topology

- `main` → production (Vercel auto-deploys from here)
- `develop` → staging / CI target
- Feature branches → PR into `develop`
- Release → PR from `develop` → `main`

## Merge strategy matters

- Feature PRs into `develop`: **"Rebase and merge"** is fine.
- Release PRs (`develop` → `main`): **"Create a merge commit"** — NOT
  rebase-and-merge. Rebase-and-merge creates new SHAs on `main` and
  leaves `develop` and `main` permanently divergent ("N ahead, N
  behind") even though they contain the same changes.

If the repo's default merge button is still "Rebase and merge", either
change it in GitHub Settings → General → Pull Requests, or pick
"Create a merge commit" manually when merging the release PR.

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

Use **"Create a merge commit"** on the GitHub UI. Confirm with the
user before the click — this is a high-severity production action.

## Post-merge realignment (CRITICAL — do this every time)

Even with a merge commit, staying strictly aligned is cleaner if the
release PR used rebase-and-merge (legacy). After every release,
realign `develop` so future `develop ↔ main` diffs are clean:

```bash
git fetch origin main
git checkout develop
git reset --hard origin/main
git push origin develop --force-with-lease
```

Safe here because `develop` doesn't carry commits that `main` doesn't
have after the release merge — `main` is the superset.

Also sync local `version-2` or any other long-running branches to the
new `main`:
```bash
git checkout version-2 && git merge --ff-only origin/main
```

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

- Never force-push to `main`.
- Never merge a red PR into `main`.
- Firebase deploys target `prod` explicitly via `--project=prod`; never
  omit the flag (the default project is `steward-dev-5e4dc`).
- When in doubt, open an extra PR rather than fix-in-main.
