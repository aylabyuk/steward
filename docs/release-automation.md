# Release automation

After `develop → main` merges, the [`.github/workflows/release.yml`](../.github/workflows/release.yml) workflow:

1. Reads `package.json` version
2. Creates + pushes the `vX.Y.Z` tag (skips if it already exists)
3. Creates a GitHub Release with the matching `CHANGELOG.md` section
4. Writes `functions/.env.steward-prod-65a36` from the `STEWARD_ORIGIN_PROD` variable
5. Authenticates to GCP with a service-account key
6. Deploys Firestore rules + indexes + Cloud Functions to `steward-prod-65a36`

Vercel handles the frontend redeploy via its own GitHub integration — nothing in this workflow touches it.

## One-time setup

### 1. Repo settings — enable auto-merge

**Settings → General → Pull Requests → ✅ Allow auto-merge → Save.**

Lets me (or anyone opening a release PR) set `--auto --merge` on `gh pr create`. The PR merges automatically once CI goes green; no human click required for the mechanical release PRs (`chore(release): vX.Y.Z` and the `develop → main` one).

Feature PR review stays manual — those still need a human eyes + merge click.

### 2. GCP service account for deploys

Create a dedicated service account in the prod project with only the permissions needed to deploy.

**In [Google Cloud Console](https://console.cloud.google.com/iam-admin/serviceaccounts?project=steward-prod-65a36):**

1. **Create Service Account**
   - Name: `github-actions-release`
   - Description: `Used by .github/workflows/release.yml to deploy Firestore rules/indexes + Cloud Functions.`
2. **Grant these roles** (narrow-as-possible; don't use `Owner`):
   - `Cloud Functions Admin` — deploy functions
   - `Cloud Datastore Index Admin` — deploy Firestore indexes
   - `Firebase Rules Admin` — deploy Firestore rules
   - `Service Account User` — act as the default Cloud Functions runtime SA
   - `Cloud Build Editor` — trigger the build step for function deploys
   - `Artifact Registry Writer` — push the function container image
   - `Logs Writer` — emit deploy-time logs
3. **Create key → JSON → download.** Store the downloaded file safely; you'll paste its contents into the GitHub secret below, then **delete the local copy**.
4. Rotate the key yearly. Calendar reminder helps.

> **Migration target — Workload Identity Federation (WIF)**: same permissions, no long-lived key, GitHub uses OIDC tokens to impersonate the SA. Better security posture. Worth doing once the project is stable enough that the extra 20 min of IAM config is cheap. See [google-github-actions/auth WIF setup](https://github.com/google-github-actions/auth#setting-up-workload-identity-federation).

### 3. GitHub Actions secrets + variables

**Settings → Secrets and variables → Actions.**

| Kind | Name | Value |
| --- | --- | --- |
| Secret | `FIREBASE_SERVICE_ACCOUNT_JSON` | Paste the full JSON file contents from step 2.3 |
| Variable | `STEWARD_ORIGIN_PROD` | `https://steward-ten.vercel.app` |

The JSON content is multi-line; GitHub handles newlines correctly when pasted into the secret value field.

### 4. Smoke-test the pipeline

1. Merge a trivial no-op release (e.g., bump patch, add a CHANGELOG note).
2. Watch the **Actions** tab for the `Release` workflow.
3. Expected outcome:
   - Tag `vX.Y.Z` pushed
   - GitHub Release appears with the changelog section as its body
   - `firestore:rules,indexes` deploy succeeds (check Firebase Console)
   - `functions` deploy succeeds

If any step fails, the workflow logs will show the exact error. Common issues:
- **SA missing a role** → re-read the permission list above
- **`CHANGELOG.md` section not found** → the awk regex expects `## [X.Y.Z]` with literal brackets. Match that shape.
- **Vercel env variable missing** → set `STEWARD_ORIGIN_PROD` as a **Variable**, not a **Secret** (the workflow reads `vars.`, not `secrets.`)

## What the new release flow looks like

Before:

1. Open `chore(release): vX.Y.Z` PR → CI → **manually merge**
2. Open `develop → main` PR → CI → **manually merge + pause for prod approval**
3. Sync main → tag → push tag → GitHub release
4. `firebase deploy --only firestore:rules,firestore:indexes --project=prod` ← you paste output
5. `firebase deploy --only functions --project=prod` ← you paste output

After:

1. Open `chore(release): vX.Y.Z` PR with `--auto --merge` → CI → **auto-merges**
2. Open `develop → main` PR with `--auto --merge` → CI → **auto-merges**
3. GHA workflow does steps 3–5 automatically

You only need to:
- Review + merge feature PRs (as always)
- Watch the Release workflow run after each release PR lands on main
- Respond to Actions failure notifications if anything breaks

## Rollback

If a release ships a bug:

1. Revert the offending PR on `develop`, open a release PR immediately.
2. Or, for an emergency: deploy the previous functions revision from the Firebase Console (**Cloud Functions → [function] → Source → Redeploy**).

The GHA workflow does not delete anything, so a rollback by re-deploy is safe. It also won't overwrite a manually-deployed newer version unless someone pushes a newer version tag — the `concurrency: release` + `cancel-in-progress: false` settings queue workflow runs rather than interleave them.
