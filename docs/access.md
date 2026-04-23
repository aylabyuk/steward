# Access, roles, ward bootstrap

## Roles & permissions

Two permission groups (`role`), mapped from specific `calling`:

| Calling | Role | Approve | Edit | View |
|---|---|---|---|---|
| Bishop, 1st Counselor, 2nd Counselor | `bishopric` | ✓ | ✓ | ✓ |
| Executive Secretary (+ asst), Ward Clerk (+ asst) | `clerk` | — | ✓ | ✓ |

Only `bishopric` can approve programs (enables the 2-of-3 bishopric approval rule). Everyone listed can read, create, edit. Firestore rules enforce.

## Sign-in allowlist

Firebase Auth (Google) will accept any Google account — we can't gate that directly. Enforcement happens in the app + rules.

**App enforcement** (on sign-in):
1. Query `collectionGroup('members').where('email', '==', user.email).where('active', '==', true)`.
2. No match → "Access required" screen, sign out.
3. One match → set `currentWardId`, proceed.
4. Multiple matches (rare — e.g., stake auditor) → ward picker.

**Firestore rules**: every read/write path checks `request.auth.uid` has an active member doc in the target `wardId`. Defense in depth.

**Bootstrap prereq**: create the composite index for the collection-group query. Without it, unauthorized sign-ins appear stuck in "loading" (rules still block data, but UX breaks).

## Ward bootstrap (manual, v1)

No self-serve ward creation in v1.

Steps (admin in Firebase Console):
1. Create `wards/{wardId}` doc: `name`, default `settings`.
2. Create first `wards/{wardId}/members/{uid}` — the bishop:
   - `email` (their Google account)
   - `calling` in (`bishop` | `first_counselor` | `second_counselor`)
   - `role: "bishopric"`
   - `active: true`
3. Share sign-in URL with the bishop.

**Invariant**: the first member must be `bishopric`. Firestore rules reject in-app member creation if the ward has zero existing bishopric members — only the console (admin SDK) can seed the first one.

**Once seeded**: bishop signs in and adds other members (counselors, clerks, secretaries) from within the app.

**v1.1**: self-serve via a claim-token flow.

## Speaker identity (capability-token auth)

Speakers don't sign in with Google or a phone OTP. Instead, `sendSpeakerInvitation` embeds a one-time capability token in the invitation URL (SMS/email), and Firestore stores only its SHA-256 hash. The `issueSpeakerSession` callable verifies the presented token against that hash and mints a Firebase custom token with `{invitationId, wardId, role: "speaker"}` claims. Firestore rules key the speaker-response write path on those claims.

Rotation is automatic: a consumed or expired token that hashes to the stored value triggers a fresh SMS with a new token (capped at 3 rotations/invitation/UTC day, and prior sessions are revoked via `revokeRefreshTokens` so a leaked link has a ~1 hour max lifetime after rotation).

The invite landing page runs on a second named Firebase app (`inviteApp` / `inviteAuth`) so speaker sign-in never touches the bishopric Google session on the same device — the two persist independently under separate IndexedDB keys.

## Audience

Steward is built for the **bishopric** (bishop + counselors) and **secretaries** (executive secretary, assistants) who plan sacrament meetings. **Clerks** can use it but it's peripheral to their calling — they don't plan the meeting themselves. Schema-wise, bishopric is its own `role`; secretaries and clerks share `role: "clerk"` but show as distinct `calling` values on the roster.

## Email CC policy

Speaker-invitation emails (sent server-side by the `sendSpeakerInvitation` / `onInvitationWrite` Cloud Functions via SendGrid) CC every **active** member whose **`ccOnEmails`** flag is true — bishopric, secretary, or clerk alike. The toggle lives on each member row in Ward settings → Members & callings; default is `true` for back-compat with pre-toggle member docs.

- Bishopric is not auto-included anymore — if a bishopric member turns their toggle off, they opt out of the thread and miss both the speaker's response and the bishopric-side acknowledgement receipt. Intentional: the toggle has to mean something.
- Client-side `mailto:` flows (when they land) reuse the same rule via `src/features/speakers/computeCc.ts`.

Applies to all email fan-outs: speaker invitation, speaker-response receipts, and any future ward email feature.
