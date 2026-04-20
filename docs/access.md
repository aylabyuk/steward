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

## Email CC policy

Every `mailto:` link auto-populates the CC field with the ward's team.

- **Always CC** (non-negotiable): bishopric (bishop + 2 counselors) with `active: true`. Bishopric visibility on speaker invitations is the whole point.
- **CC by default** (per-member toggle `ccOnEmails`): clerks + secretaries.
- **How**: build the mailto URL with `cc=` from the computed list. Users can still edit CC in their mail client — we don't try to prevent that.
- **Ward settings screen** toggles `ccOnEmails` for clerks/secretaries (bishopric is always on; not togglable).
- **Sanity cap**: mailto URLs have a ~2000-char limit in most clients. Ward team sizes never approach that, but code should handle truncation gracefully.

Applies to all `mailto:` flows: speaker invitations + any future email feature.
