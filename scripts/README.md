# Scripts

Admin-only, one-off utilities. Run from repo root.

## bootstrap-ward

Creates a ward and seeds the first bishopric member + default letter template.
Required because Firestore rules reject in-app member creation when the ward
has zero existing bishopric members — only the Admin SDK can break the chicken
-and-egg.

### Against the local emulator

The `bootstrap-ward:emulator` script is the same as `bootstrap-ward`
but bakes in the `FIRESTORE_EMULATOR_HOST` / `FIREBASE_AUTH_EMULATOR_HOST` /
`GCLOUD_PROJECT=steward-dev-5e4dc` env vars so the Admin SDK routes to
the local emulator instead of the real Firebase project. Without them
the Admin SDK falls through to Application Default Credentials and
tries to hit production `identitytoolkit.googleapis.com`. The project
id matches `.firebaserc`'s `default` and the iOS app's
`GoogleService-Info.plist` so all three surfaces share one namespace.

```sh
# In one terminal
pnpm emulators

# In another
pnpm bootstrap-ward:emulator \
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

## _reset-ward

Destructive: recursively deletes `wards/{wardId}` (doc + every subcollection).
Meant for dev only — the underscore prefix marks it as privileged. Pair with
`bootstrap-ward` to reset test state:

```sh
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
GCLOUD_PROJECT=steward-dev-5e4dc \
pnpm tsx scripts/_reset-ward.ts stv1
```

Positional arg is the ward id; defaults to `stv1`. **Never run this against
a real production project.**

## sweep-orphan-invitations

Each `sendSpeakerInvitation` call creates a brand-new
`speakerInvitations/{autoId}` doc and rewires the speaker / prayer's
`invitationId`. Prior invitation docs become orphans whose old SMS/email
links keep resolving to stale content. This sweep deletes every
`speakerInvitations/*` doc that no speaker / prayer currently references.

Dry-run by default; pass `--commit` to actually delete.

```sh
# Dry-run against the local emulator
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
GCLOUD_PROJECT=demo-steward \
pnpm sweep-orphan-invitations --ward stv1

# Commit against prod
pnpm sweep-orphan-invitations --ward stv1 --project steward-prod-65a36 --commit
```

## configure-conversation-roles (functions workspace)

One-off Twilio admin: grants the default "channel user" conversation
role the `editAnyMessage` permission so any participant can update the
attributes of any message in a conversation. The chat UI persists emoji
reactions as message attributes; without this permission, reacting to
someone else's message silently fails with a Twilio 403.

Lives inside the functions workspace because it uses the `twilio` SDK
which is only declared as a functions dependency:

```sh
TWILIO_ACCOUNT_SID=AC... \
TWILIO_AUTH_TOKEN=... \
TWILIO_CONVERSATIONS_SERVICE_SID=IS... \
pnpm --filter @steward/functions configure-conversation-roles
```

Idempotent. Run once per Twilio service (dev + prod each have their own
Conversations service SID).

## sweep-sms-only-participants (functions workspace)

One-time migration: removes every SMS-only participant
(`messagingBinding` set, `identity` null) from every conversation in
the configured Conversations service. Required at the v0.20.2 deploy
step — older invitations (pre-c9dc4a9) still carry SMS-only participants
that Twilio's auto-bridge keeps routing inbound to. After v0.20.2 the
inbound path is the messaging-service `inboundRequestUrl` →
`onTwilioWebhook` → `inboundSmsRelay`. Without this sweep, Twilio
double-routes inbound SMS (auto-bridge to the old conversation AND
the relay to the new one), so the bishop sees the same message in
two different chatboxes.

Dry-run by default. Pass `--commit` to actually remove.

```sh
# Dry-run against prod
TWILIO_ACCOUNT_SID=AC... \
TWILIO_AUTH_TOKEN=... \
TWILIO_CONVERSATIONS_SERVICE_SID=IS4f27eebffb094603938ad543cfb280d8 \
pnpm --filter @steward/functions sweep-sms-only-participants

# Commit
TWILIO_ACCOUNT_SID=AC... \
TWILIO_AUTH_TOKEN=... \
TWILIO_CONVERSATIONS_SERVICE_SID=IS4f27eebffb094603938ad543cfb280d8 \
pnpm --filter @steward/functions sweep-sms-only-participants --commit
```

Idempotent: a second run finds nothing to remove.
