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

### 1. Auto-merge for release PRs — self-hosted

GitHub's built-in auto-merge is gated behind Pro on private repos, so we roll our own. [`.github/workflows/auto-merge-release.yml`](../.github/workflows/auto-merge-release.yml) triggers on CI completion: if the PR's title starts with `chore(release):` or `Release:` AND CI succeeded, it merges via `gh pr merge`. After merging a PR that targets `main`, it then **explicitly dispatches** the Release workflow via `gh workflow run` (necessary because GitHub suppresses downstream `push` triggers for events driven by the default `GITHUB_TOKEN` — a `push: branches: [main]` trigger alone would never fire on an auto-merge).

**Nothing to configure** — the workflow uses the default `GITHUB_TOKEN` so it ships working. Feature PRs are untouched by the title filter; they still need a human review + click.

If GitHub ever flips auto-merge into the free plan, this workflow can be deleted + release-to-main skill reverts to `gh pr merge --auto`. Until then, the self-host is cheaper than $4/mo for Pro.

### 2. Enable required APIs on the prod project

The deploy SA can only act on APIs that are actually enabled on `steward-prod-65a36`. Some of these were enabled when the Firebase project was first provisioned; `cloudbilling.googleapis.com` in particular is often disabled on hobby-tier projects and has to be turned on explicitly before the first GHA-driven deploy.

```bash
gcloud services enable \
  cloudbilling.googleapis.com \
  cloudfunctions.googleapis.com \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  firebaseextensions.googleapis.com \
  --project=steward-prod-65a36
```

Firebase CLI will auto-enable most of these on first use when invoked by an Owner, but the SA-driven path can't — it'll 403 with "Cloud Billing API has not been used in project 308185652610 before or it is disabled" on the billing check that runs before function upload.

### 3. GCP service account for deploys

Create a dedicated service account in the prod project with only the permissions needed to deploy.

**In [Google Cloud Console](https://console.cloud.google.com/iam-admin/serviceaccounts?project=steward-prod-65a36):**

1. **Create Service Account**
   - Name: `github-actions-release`
   - Description: `Used by .github/workflows/release.yml to deploy Firestore rules/indexes + Cloud Functions.`
2. **Grant these roles** (narrow-as-possible; don't use `Owner`):
   - `Cloud Functions Admin` — deploy functions
   - `Cloud Run Admin` — update the underlying Cloud Run services (Gen2 functions run on Cloud Run)
   - `Cloud Datastore Index Admin` — deploy Firestore indexes
   - `Firebase Rules Admin` — deploy Firestore rules
   - `Firebase Admin` — read the Firebase Admin SDK config
     (`firebase.googleapis.com/.../adminSdkConfig`) during functions
     deploy. Without it, deploy fails with `403 The caller does not
     have permission` before any function is updated.
   - `Secret Manager Viewer` — read metadata on the Twilio secrets
     (`TWILIO_ACCOUNT_SID`, etc.) that the Cloud Functions declare
     via `defineSecret`. The Firebase CLI calls `secrets.get` during
     deploy to verify each secret exists + is versioned; that
     permission is in **Viewer**, *not* `Secret Manager Secret
     Accessor` (Accessor only grants `versions.access` — the
     permission the function's own runtime SA uses to read the
     value at invoke time, which is a separate binding). Without
     Viewer, deploy fails with `403 Permission
     'secretmanager.secrets.get' denied`.
   - `Cloud Scheduler Admin` — create / update the Cloud Scheduler
     jobs that back `scheduledNudges` + `drainNotificationQueue`.
     Without it, deploy fails near the end with `403 lacks IAM
     permission "cloudscheduler.jobs.update"` and Firebase skips
     subsequent deletes.
   - `Eventarc Admin` — create / update the Eventarc triggers that
     back Firestore-event functions (`onMeetingWrite`,
     `onCommentCreate`, `onInvitationWrite`). Gen2 Firestore
     triggers are Eventarc under the hood.
   - `Service Account User` — act as the default Cloud Functions runtime SA
   - `Cloud Build Editor` — trigger the build step for function deploys
   - `Artifact Registry Writer` — push the function container image
   - `Logs Writer` — emit deploy-time logs
3. **Create key → JSON → download.** Store the downloaded file safely; you'll paste its contents into the GitHub secret below, then **delete the local copy**.
4. Rotate the key yearly. Calendar reminder helps.

> **Migration target — Workload Identity Federation (WIF)**: same permissions, no long-lived key, GitHub uses OIDC tokens to impersonate the SA. Better security posture. Worth doing once the project is stable enough that the extra 20 min of IAM config is cheap. See [google-github-actions/auth WIF setup](https://github.com/google-github-actions/auth#setting-up-workload-identity-federation).

### 4. GitHub Actions secrets + variables

**Settings → Secrets and variables → Actions.**

| Kind | Name | Value |
| --- | --- | --- |
| Secret | `FIREBASE_SERVICE_ACCOUNT_JSON` | Paste the full JSON file contents from step 3.3 |
| Variable | `STEWARD_ORIGIN_PROD` | `https://steward-ten.vercel.app` |

The JSON content is multi-line; GitHub handles newlines correctly when pasted into the secret value field.

### 5. Smoke-test the pipeline

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
