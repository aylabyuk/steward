# Scripts

Admin-only, one-off utilities. Run from repo root.

## bootstrap-ward

Creates a ward and seeds the first bishopric member + default letter template.
Required because Firestore rules reject in-app member creation when the ward
has zero existing bishopric members — only the Admin SDK can break the chicken
-and-egg.

### Against the local emulator

```sh
# In one terminal
pnpm emulators

# In another
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
GCLOUD_PROJECT=demo-steward \
pnpm bootstrap-ward \
  --ward-id stv1 \
  --ward-name "Steve's Ward" \
  --bishop-email bishop@example.com \
  --bishop-name "Ben Bishop" \
  --bishop-calling bishop \
  --timezone America/Denver
```

### Against a real Firebase project

```sh
# Authenticate once
gcloud auth application-default login

# Run against dev
pnpm bootstrap-ward \
  --project steward-dev-5e4dc \
  --ward-id stv1 \
  --ward-name "Steve's Ward" \
  --bishop-email bishop@example.com \
  --bishop-name "Ben Bishop" \
  --bishop-calling bishop \
  --timezone America/Denver
```

### Arguments

| Flag | Required | Description |
|---|---|---|
| `--ward-id` | yes | Short slug used as the doc id under `wards/`. |
| `--ward-name` | yes | Human-readable ward name. |
| `--bishop-email` | yes | Google email of the first bishopric member. |
| `--bishop-name` | yes | Display name stored on the member doc. |
| `--bishop-calling` | no | `bishop` \| `first_counselor` \| `second_counselor`. Default `bishop`. |
| `--timezone` | no | IANA timezone for the ward's `settings.timezone`. Default `UTC`. |
| `--project` | no | GCP project id. Defaults to `GCLOUD_PROJECT` env or `steward-dev-5e4dc`. |

### Invariants enforced

- First member must be `bishopric` (calling must be bishop or a counselor).
- Refuses to run if `wards/{wardId}` already exists; use the in-app settings
  flow to add additional members.
- Creates a Firebase Auth user if one does not already exist for the email.
