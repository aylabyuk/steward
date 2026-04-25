# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning
follows [SemVer](https://semver.org/) with the pre-1.0 interpretation
documented in [README.md](README.md#versioning--releases).

## [Unreleased]

## [0.10.0] — 2026-04-25

The big invitation-flow polish release: profile avatars + read
receipts in chat, a redesigned plain-English status pane, edit +
delete on chat bubbles via long-press, status-change events as
centred system notices, rollback-aware status changes, plain-English
meeting dates everywhere, and dozens of smaller polish moves across
the Assign-Speakers and Prepare-Invitation flows. Plus a fix for a
duplicate-speaker bug surfaced by stepping back-and-forth in the
Assign modal.

### Added

- **Profile avatars in speaker-invitation chat** (#122). Bishopric
  peers now render with their Google `photoURL` on both the
  speaker-side and bishop-side chat panes — initials fallback only
  when no photo is on file.

- **Plain-English status banner with clickable pills** (#123). The
  bishop-side chat opens with a sentence-shaped status line
  ("Awaiting reply from Sister Reeves", "Reeves accepted on Mar 2…")
  rather than a raw status pill. Each status word is itself a
  clickable pill that opens the status switcher. The thread also
  renders a "Read" receipt under the speaker's most recently
  read-by-other bubble.

- **Resend-SMS / Resend-email confirm modal** (#124). Re-firing an
  invitation now goes through a confirm dialog so a misclick
  doesn't accidentally re-send the original SMS or email body.

- **Long-press to edit / delete chat bubbles** (#125). Holding a
  message bubble for 500 ms surfaces an Edit + Delete menu — the
  bubble shrinks slightly + grows a brass halo during the press so
  the gesture is discoverable. Speakers can edit/delete only their
  own; bishopric can delete any bishopric peer's message.
  Affordance is gated by a 5-message recency window AND a 30-minute
  cutoff so older context stays stable. Edited messages render an
  "Edited" tag.

- **Status-change events render as centred system notices** (#125).
  When a bishop confirms or declines an invitation, the
  conversation shows a single centred italic line ("Assignment
  confirmed — thank you for speaking on Sun May 4.") with a
  coloured rule on each side, rather than an authored bubble. The
  speaker's banner pivots automatically.

- **Rollback-aware confirm dialog on status flips** (#125). Moving
  from Confirmed or Declined back to Planned/Invited goes through a
  friction dialog ("Clear confirmed status?" / "Undo decline?") so
  a misclick doesn't silently erase a real commitment. Forward
  moves stay direct. Honours the project rule that nothing is ever
  hard-locked.

- **Plain-English meeting dates** (#125). Speaker-facing chat copy
  + status banner now read "Sun May 4" instead of the ambiguous
  "this Sunday".

- **Per-row chat launcher in the week view** (#125). Every speaker
  row in the week-meeting program (`/week/:date`) now hosts the
  same chat icon that already lives on the schedule view, so a
  bishop can jump straight into a single speaker's conversation.
  Powered by a new shared `SpeakerChatLauncher` component used by
  both views.

- **Per-card status pill in the Assign-Speakers dialog** (#125).
  Each speaker card inside the modal now shows its current status
  pill (planned / invited / confirmed / declined) in the card
  header, so a bishop can scan invitation state without reading
  each card.

- **Pending-invitations caption in the Assign-Speakers header**
  (#125). Beside the date, e.g. "1 of 2 speakers has not been
  invited yet" — singular/plural agreement covered for the empty,
  none-invited, partial, and all-invited cases.

- **NoInvitationPlaceholder polish bundle** (#125). Status-aware
  copy, always-shown status switcher, always-enabled
  Send-Email/Send-SMS buttons backed by an inline contact-edit
  dialog that persists changes to the speaker doc, and an
  "Already X — open conversation" affordance for non-planned
  speakers.

- **X-icon cancel on the bubble edit form** (#125). Replaces a
  low-contrast text Cancel button with a small close icon at the
  textarea's top-right that's always visible.

### Fixed

- **Duplicate speaker bug in the Assign-Speakers modal** (#125).
  Add → Save → Next → Back → Save would create a duplicate row,
  because the local draft kept `id: null` after the first
  `createSpeaker` call. `createSpeaker` now returns the new doc id
  and `SpeakerEditList` patches the draft + originals snapshot
  inline so subsequent saves see the speaker as already persisted.

- **`useTwilioChat` provider missing in the week view** (#125).
  Adding the per-row chat launcher exposed the gap — only
  `ScheduleView` had established `TwilioChatProvider`. `WeekEditor`
  now wraps its body the same way (with `TwilioAutoConnect`), so
  unread badges populate without the bishop having to open the
  dialog first.

- **Hide the "Already X — open edit mode" band on Step 1** (#125).

- **Open Prepare-Invitation page in a new tab** (#125) so the
  Cancel button on that page can still close the tab cleanly.

- **Keep the Assign modal open when opening a chat from Step 2**
  (#125), so a bishop flipping between conversation threads doesn't
  lose the speaker-overview context behind them.

### Changed

- **Drop the Manage-speakers link in the week view** (#125). The
  link duplicated an entry point already on the schedule's Sunday
  card. Speakers are now added / edited from the schedule, and
  each row in the week view hosts its own chat icon.

- **Replace the kebab menu on chat bubbles with long-press** (#125).
  The kebab was hover-only — invisible on mobile. Long-press is
  always-available and discoverable via the press animation.

- **Move the status gradient from Sunday card pill → status strip
  background** (#125), so the active gradient sits behind the
  whole status row in `NoInvitationPlaceholder` rather than on a
  single pill.

## [0.9.13] — 2026-04-24

### Added

- **Bishop-to-bishop push in speaker-invitation chat** (#119). When one
  bishopric member posts a message in a speaker invitation conversation,
  peer active bishopric members of the ward now receive an FCM push —
  the sender is filtered out. Closes a fanout gap where only the
  speaker was notified (via SMS + email) when a bishop posted.
  Speaker-authored messages continue to push all active bishopric as
  before. Speaker-side push delivery is unchanged (still SMS + email
  only — browser push isn't wired on the invite page).

  Implementation: [pushToBishopric()](functions/src/invitationReplyPush.ts)
  gains an optional `senderBishopUid` param that flows through
  [filterRecipients()](functions/src/recipients.ts#L21)'s existing
  `excludeUid` plumbing. The push title is `{senderDisplayName}
  replied` for bishop-authored messages; the speaker-authored path
  still titles with `{speakerName} replied`.

## [0.9.12] — 2026-04-24

The real fix for #106. v0.9.9/.10/.11 closed the ghost SW path
progressively; v0.9.11 verified via DevTools that the ghost is fully
gone. But FCM tokens kept dying with
`messaging/registration-token-not-registered` after 2–4 sends — so the
ghost was necessary-but-insufficient. The remaining loop is a VAPID key
mismatch inside Firebase's own token cache.

### Fixed

- **Prime `messaging.vapidKey` on boot** (#116). Tracing Firebase's
  `mke()` (getTokenInternal) revealed the full bug: when
  `messaging.getToken()` is called with no args (the pattern used by
  Firebase Functions' shared `contextProvider.getMessagingToken()` on
  every callable invocation), `Cke(messaging, undefined)` defaults
  `messaging.vapidKey` to Firebase's built-in sample key (`uee`). The
  downstream token-lookup builds `subscriptionOptions` with the
  default VAPID, compares against the IDB-stored token (whose stored
  `subscriptionOptions.vapidKey` is ours), detects the mismatch in
  `bke()`, and calls `hee()` to **DELETE our stored token from the FCM
  backend** before minting a replacement against the default key. The
  Firestore-persisted token is now dangling; the next server-side push
  returns `messaging/registration-token-not-registered`; the token
  gets pruned; the banner reappears.

  Fix is a one-line addition to [src/lib/registerSw.ts](src/lib/registerSw.ts)'s
  sync prime: assign `messaging.vapidKey = VITE_FIREBASE_VAPID_KEY`
  alongside the `swRegistration` stub. `Cke`'s default-assignment
  branch never runs; stored token and live messaging state agree;
  no `hee()` delete loop.

## [0.9.11] — 2026-04-24

Third time's the fix for #106. v0.9.10 landed the right idea — prime
`messaging.swRegistration` to short-circuit Firebase's internal
`registerDefaultSw` — but did so from a `window.addEventListener("load", …)`
callback, which runs *after* React component effects mount. On the
affected browsers, `TwilioAutoConnect`'s `useEffect` fires a Firebase
callable in the same tick as hydration, losing the race: the callable's
internal `messaging.getToken()` call sees `swRegistration` unset,
auto-registers the ghost, and the defensive cleanup from v0.9.9 then
catches it on the *next* load.

### Fixed

- **Synchronous stub prime at module-import time** (#113). Instead of
  waiting for a real `ServiceWorkerRegistration` — which only arrives
  after the async `serviceWorker.register()` call — we assign a stub
  (`{ scope: "/", __stewardStub: true }`) to `messaging.swRegistration`
  synchronously before React renders. That satisfies
  `Tke(messaging, undefined)`'s `!e.swRegistration` guard, which is the
  only thing that matters for blocking `registerDefaultSw`. Firebase
  Functions' callable path already wraps `messaging.getToken()` in a
  `try/catch` and returns undefined on throw — so a stub that lacks
  `pushManager` causes the callable to proceed without the
  `Firebase-Instance-ID-Token` header (optional). Our own
  `subscribeDevice` explicitly passes a real `ServiceWorkerRegistration`
  to `getToken`, which replaces the stub via Firebase's `Tke`
  `e.swRegistration = t` branch — first-subscribe flow unchanged.
  The actual `serviceWorker.register()` + stub→real swap still runs on
  `load` as before, but past the sync prime it's purely cosmetic.

## [0.9.10] — 2026-04-24

Root-cause fix for #106. v0.9.9 shipped a defensive boot cleanup;
this release stops the ghost SW from ever being created in the
first place.

### Fixed

- **Prime `messaging.swRegistration` on boot** (#110). The ghost
  service worker at `/firebase-cloud-messaging-push-scope` was being
  registered by Firebase's own SDK during every callable invocation.
  Trace: `TwilioAutoConnect` (active on `/schedule` for any signed-in
  bishop) → `callIssueSpeakerSession` → Firebase Functions' shared
  `contextProvider.getContext()` → `getMessagingToken()` →
  `messaging.getToken()` with no args → `Tke(messaging, undefined)` →
  `registerDefaultSw(messaging)` →
  `navigator.serviceWorker.register("/firebase-messaging-sw.js",
  { scope: "/firebase-cloud-messaging-push-scope" })`.

  Critically, `getMessagingToken()`'s guard only bails when
  `Notification.permission !== 'granted'` — and that permission
  survives "Clear site data" in Chrome. Any user who ever granted
  notification permission hit the ghost path every time they
  visited `/schedule`. Two concurrent push subscriptions (one on our
  scope-`/` SW, one on the ghost) then contended; FCM invalidated
  one of them and emitted
  `messaging/registration-token-not-registered` after 2–4 sends.
  That matches the server-side diagnostic logs captured from v0.9.5
  onward.

  The fix is a one-liner: after registering our SW on boot,
  construct the messaging singleton and assign
  `messaging.swRegistration = swReg` directly. That short-circuits
  Firebase's internal `registerDefaultSw` call for every future
  callable-triggered token lookup. No permission prompt, no extra
  network traffic, no push-subscription churn.

  The defensive boot-time unregister of any existing
  `/firebase-cloud-messaging-push-scope` registration from v0.9.9
  stays in place as a backstop for users who already had the ghost
  on their profile before this release.

## [0.9.9] — 2026-04-24

Defensive fix targeting the unsubscribe-on-chat bug (#106). Diagnostic
logs from v0.9.5 and v0.9.6 proved the server side is healthy — FCM
rejects the affected user's tokens with
`messaging/registration-token-not-registered` after only 2–4 successful
sends per fresh subscription. DevTools on that user's browser shows a
ghost service worker registered at `/firebase-cloud-messaging-push-scope`
alongside the legitimate one at `/`, both pointing at
`firebase-messaging-sw.js`.

Static analysis of the deployed bundle ruled out any current code path
as the ghost's creator; it's almost certainly a persistent leftover
from pre-v0.9.3 builds (when the SW imported the Firebase compat SDK).
The ghost's presence correlates with FCM invalidating the active token
(the newer-subscription-supersedes-older rule).

### Fixed

- **Unregister leftover FCM push-scope SW on boot** (#107). On every
  app load, [src/lib/registerSw.ts](src/lib/registerSw.ts) now
  enumerates existing service-worker registrations and unregisters any
  at scope ending in `/firebase-cloud-messaging-push-scope` before
  registering our own. Idempotent; safe for users who never had the
  old SW. Logs each removal at `console.info` — the next clean-slate
  test on the affected browser will tell us whether the ghost is
  purely persistent (log fires once, never again) or being actively
  re-created by something we haven't found (log fires every reload).
  Either way we get a definitive next signal for #106.

## [0.9.8] — 2026-04-24

Infrastructure-only release. No user-visible change — this is the
clean-slate smoke test of the now-fully-automated release pipeline
after v0.9.7's staged permission rollout, plus a CI-time
optimization for docs-only changes.

### Infrastructure

- **CI path filter** (#100). A new `changes` gate job uses
  `dorny/paths-filter` to decide whether the expensive lint +
  format + typecheck + Vitest + rules + Playwright cycle and the
  functions build/test job actually need to run. Docs-only PRs
  (e.g. edits to `docs/**`, `CLAUDE.md`, `.claude/**`, CHANGELOG
  prose) now finish CI in under ten seconds instead of ~3 minutes.
  The gate job always runs and always succeeds, so required status
  checks stay green and `auto-merge-release`'s `workflow_run`
  trigger still fires — no behaviour change for release flows.
- **Release pipeline IAM + API documentation completed**
  (#99, #101, #102, #103). The release service account's role list
  in `docs/release-automation.md` now reflects what v0.9.7's
  empirical smoke test actually needed: `Cloud Run Admin` (Gen2
  functions on Cloud Run), `Secret Manager Viewer` (read metadata
  on `defineSecret`-declared Twilio creds during deploy — *not*
  `Secret Manager Secret Accessor`, which is a runtime-SA concern),
  `Cloud Scheduler Admin` (for `scheduledNudges` +
  `drainNotificationQueue`), and `Eventarc Admin` (for Firestore-
  triggered functions). A new setup step also enumerates the
  `gcloud services enable` list so the Cloud Billing API pre-check
  doesn't 403 on a fresh SA-driven deploy.

## [0.9.7] — 2026-04-24

Release-pipeline smoke-test follow-up. v0.9.6 merged to main but the
Release workflow never fired — GitHub suppresses downstream workflow
triggers for events driven by the default `GITHUB_TOKEN`, so the
auto-merge's push to main didn't cascade into `release.yml`. This
release carries the fix and is the re-test.

### Fixed

- **Release workflow dispatches explicitly from auto-merge** (#95).
  `release.yml` gains a `workflow_dispatch` trigger; the
  auto-merge-release workflow calls `gh workflow run` after merging
  a `main`-bound PR. The existing `push: branches: [main]` trigger
  stays as a fallback for human-driven merges. Both paths are
  idempotent via the tag-exists check.

## [0.9.6] — 2026-04-24

Infrastructure-only release. No user-visible change — this is the
smoke-test release for the new automated release pipeline (#92) and
also ships diagnostic logs around the push-unsubscribe bug still
under investigation.

### Infrastructure

- **Automated release pipeline.** Two new GitHub Actions workflows
  take over the post-merge steps that were being run by hand:
  - `.github/workflows/auto-merge-release.yml` — self-hosted
    replacement for GitHub's built-in auto-merge (gated behind Pro
    on private repos). Merges PRs whose title starts with
    `chore(release):` or `Release:` once CI goes green.
  - `.github/workflows/release.yml` — on push to `main`, creates the
    `vX.Y.Z` tag + GitHub Release, then deploys Firestore rules +
    indexes + Cloud Functions to `steward-prod-65a36`.

  The `release-to-main` skill is updated accordingly. Feature PRs
  still require human review + merge; only the two mechanical
  release PRs auto-merge.
- **Diagnostic logs** in `pushToBishopric` (bishop-reply FCM path)
  and `sendAndPrune` (every FCM failure, pruning events with
  dead/remaining counts). Lets us trace unsubscribe-on-chat-reply
  bug reports against the actual server behavior without guessing.

## [0.9.5] — 2026-04-24

Two fixes surfaced from prod log inspection while chasing the ongoing
push-delivery issue.

### Fixed

- **Missing Firestore indexes** for two collection-group queries that
  were failing every execution with `9 FAILED_PRECONDITION`:
  - `notificationQueue.dispatchAt` — used by `drainNotificationQueue`'s
    minute-tick scheduled run. Meeting-change push fan-out had been
    dead silently since the collection-group rewrite.
  - `speakerInvitations.conversationSid` — used by
    `onTwilioWebhook.findInvitationByConversation`. Bishop-reply →
    speaker SMS had been dead too.

  Both added as `fieldOverrides` (the same pattern as the existing
  `invites.email` override).

### Infrastructure

- **Structured diagnostic logs** in `notifyBishopricOfResponse` so
  we can see exactly where a response push drops: trigger entry,
  candidate + recipient counts, token total, and `sendAndPrune`
  outcome (`successCount` / `failureCount` / `deadTokenCount`).
  Kept permanently — cheap to run, saves the next debug cycle.

## [0.9.4] — 2026-04-24

Third push-delivery hotfix in a row. Prod Cloud Function logs revealed
`onInvitationWrite` was throwing `SENDGRID_API_KEY missing.` on every
speaker response — prod has no SendGrid configured. The throw rejected
the `Promise.all` wrapping the email receipt and the FCM push, and
when the outer try/catch caught, the container tore down and killed
the in-flight push fan-out. Net effect: speaker responded → no email
AND no push.

### Fixed

- **`sendEmail` degrades gracefully on missing config** in
  `functions/src/sendgrid/client.ts`. Missing `SENDGRID_API_KEY` or
  `INVITATION_FROM_EMAIL` now logs a warning and returns `null`
  instead of throwing. Real send-time API errors (bad key, bounced
  recipient) still throw — those are genuine errors worth escalating.
  Rationale: a missing config shouldn't cascade into killing
  unrelated side effects (FCM, SMS, status writes) that share the
  same Cloud Function invocation.
- **`Promise.all` → `Promise.allSettled`** in `onInvitationWrite`'s
  speaker-response path. Each side effect (speaker receipt email,
  bishopric FCM push) now runs independently; one failing no longer
  short-circuits the other. Rejected entries are logged individually.
  Defense in depth on top of the fix above.

### Known follow-up

Email receipts still won't send in prod until SendGrid is configured.
Set `SENDGRID_API_KEY` and `INVITATION_FROM_EMAIL` in
`functions/.env.steward-prod-65a36` (or declare via `defineSecret`)
when email is in scope.

## [0.9.3] — 2026-04-24

Second hotfix for push-notification delivery. v0.9.2 moved payloads to
data-only so iOS would accept them, but kept the Firebase JS SDK's
`onBackgroundMessage` as the SW handler — and that handler is gated by
the SDK's FCM-detection filter. DevTools Push tests silently dropped,
and in some iOS contexts real FCM pushes also dropped. A secondary SW
registration at `/firebase-cloud-messaging-push-scope` (auto-created
when `firebase.messaging()` runs inside the SW) was compounding the
problem.

### Fixed

- **Raw `push` event listener in the SW** replaces
  `messaging.onBackgroundMessage`. Fires for every push regardless of
  source (FCM, DevTools Push, direct Web Push), parses the payload
  itself, and always calls `showNotification()` inside
  `event.waitUntil` — the exact shape iOS Safari requires.
- **Firebase SDK imports removed from the SW.** `firebase.messaging()`
  inside the SW was auto-registering a secondary SW at
  `/firebase-cloud-messaging-push-scope`. Dropping the SDK entirely
  means a single SW registration at scope `/`; push subscriptions
  bind unambiguously.

### Changed

- **`scripts/generate-sw.mjs` simplified** to a direct file copy. The
  SW no longer needs `VITE_FIREBASE_*` placeholders since it doesn't
  initialize Firebase anymore. Kept as a pre-build step so the
  template → output relationship stays explicit for future additions.

### Known follow-up

Anyone subscribed to push before this release needs to re-subscribe
once so their push subscription binds to the new single-scope SW.
Path: `/settings/profile` → toggle **Push on this device** off → on.

## [0.9.2] — 2026-04-23

Hotfix for silently-dropped push notifications on iOS PWAs installed to
the home screen. Every v0.9.x push payload included a top-level `notification`
field, which triggers the Firebase JS SDK's auto-display path and
bypasses the SW's `onBackgroundMessage` handler. On iOS Safari 16.4+
that auto-display doesn't reliably call `showNotification()` inside
the service-worker push event, so iOS drops the push (and eventually
revokes the subscription entirely).

### Fixed

- **Data-only FCM payloads** across all five push call sites
  (`invitationReplyNotify`, `invitationResponseNotify`, `onCommentCreate`,
  `drainNotificationQueue`, `scheduledNudges`). Title/body move into
  `data.title` / `data.body`; the SW's `onBackgroundMessage` now reads
  them from there and always calls `showNotification()`. Works the
  same on iOS, Android, and desktop.
- **`webpush.headers.Urgency: high`** on every payload so APNs treats
  the data-only message as user-visible. Without the urgency hint iOS
  can delay or coalesce the push.

### Changed

- **`sendDisplayPush()` helper** in `functions/src/fcm.ts` centralizes
  the iOS-safe payload shape. All five push call sites delegate to it
  rather than constructing the FCM message inline.
- **`webpush.fcmOptions.link` removed** from the payload — only the
  auto-display path honors it, and auto-display is no longer in play.
  The SW's `notificationclick` handler routes by `data.kind` (unchanged
  since v0.9.0), so taps still deep-link to the right surface.

## [0.9.1] — 2026-04-23

Hotfix for a regression v0.9.0 inherited from #46: eagerly rotating
the capability token when a speaker submitted Yes/No broke the
speaker's original SMS link. Reopening it showed "link has expired"
because the stored hash had been overwritten by the receipt-email's
fresh token. Real bishops testing prod hit this on the first
end-to-end run.

### Fixed

- **Speaker receipt no longer rotates the capability token** (#73).
  `onInvitationWrite` stops calling `rotateInviteUrl` in the
  `fireSpeaker` branch; the receipt email goes out without an invite
  URL. The speaker's SMS stays the canonical entry point — if they
  consume it and come back, `decideTokenAction`'s pre-existing
  rotate branch self-heals with a fresh SMS, which was the v0.8.0
  behavior and the one that actually works.

### Removed

- `rotateInviteUrl` helper in `onInvitationWrite.helpers.ts` and the
  `inviteUrl` arg on `buildSpeakerReceipt`. Dead after the revert —
  the #46 "receipt has a working link" feature went with them.

## [0.9.0] — 2026-04-23

Push-notification depth: bishopric members now get a push the moment a
speaker responds (not just an email), tapping a push deep-links into
the matching chat or week page (no more being dumped at `/`), and the
receipt email doubles as a durable re-entry point into the speaker's
invite page. Plus per-device labels and "This device" chips on the
Profile page so the subscribed-devices list actually reads like it's
about specific devices.

### Added

- **Push notify bishopric on speaker response** (#17). `onInvitationWrite`
  already fires on Yes/No transitions for the receipt email — it now
  fans out an FCM push alongside, with copy that reads "Brother Smith
  accepted — Sun, May 10" (or "declined: '…' — Sun, May 10" when the
  speaker included a reason, or "changed response to Yes/No — …" on a
  flip). Clerks and the speaker themselves are excluded; quiet hours
  honored via the shared `filterRecipients` helper.
- **Tap-through deep-links for every push** (#68). Notifications now
  route:
  - `invitation-response` / `invitation-reply` → `/schedule?chat=<invitationId>`
    (auto-opens the speaker's `BishopInvitationDialog`)
  - `mention` → `/week/<date>`

  Two layers: a `notificationclick` handler in `firebase-messaging-sw.js`
  that focuses an existing tab and navigates it (falling back to
  `clients.openWindow`), plus `webpush.fcmOptions.link` on the server
  payload for Chrome/Edge native handling. Safari/Firefox use the SW
  handler. `SpeakerRow` reads `?chat=` via `useSearchParams` and
  auto-opens the matching dialog, stripping the query with
  `replace: true` so a refresh doesn't re-trigger.
- **Re-fire the speaker receipt on a yes↔no flip** (#47). Previously
  `classifyInvitationChange` fired only on first-appearance; a speaker
  who flipped their answer left an inbox receipt contradicting their
  current status. Now re-fires whenever `response.answer` actually
  changes.
- **Link the speaker receipt email back to the invite page** (#46).
  `buildSpeakerReceipt` renders a freshly-rotated invite URL (via the
  existing `rotateTokenForBishopNotification` path — doesn't count
  against the daily cap). If rotation fails, falls back to the
  no-link receipt so the send itself never errors out.
- **Per-device names + "This device" chip** on `/settings/profile`
  (#53). Subscribed-devices list now labels entries with derived
  browser+OS strings like "Chrome · macOS" / "Safari · iOS" instead
  of the generic platform bucket. The row matching the current
  browser/PWA gets a brass-deep "This device" chip. New
  `deriveDeviceName` parser prefers `navigator.userAgentData`
  (Chromium) and falls back to UA-string regex for Safari/Firefox.

### Changed

- **Push toggle on Profile is now scoped to the current device.**
  Previously the switch read "any device subscribed" and flipping off
  deleted every token in the array — so flipping off on Safari would
  nuke a Chrome subscription too. Now tracks only the token matching
  the current browser's FCM registration (persisted in localStorage
  at subscribe time, cleared at unsubscribe).
- **FCM current-token detection moved to localStorage.** Deriving
  "which token is mine?" via a fresh `getToken()` call on every hook
  re-run hit SW/permission timing edge cases on Chrome (chip
  disappeared after subscribe). localStorage is per-origin
  per-browser — exactly the "this device" identity we want — and
  reads synchronously with no race conditions.

### Fixed

- `data.token` → `data.invitationId` rename on the
  `invitation-reply` push payload for consistency with the rest of the
  payload shape. The field has always been the invitation's Firestore
  doc ID; the legacy name was misleading.

### Infrastructure

- **New Cloud Function module**: `invitationResponseNotify.ts` houses
  `composeResponseNotification` (pure, 8 unit tests covering fresh
  yes/no/reason + flips) and `notifyBishopricOfResponse` (the FCM
  fan-out). `onInvitationWrite` now runs the push alongside the
  speaker receipt in a `Promise.all`.
- **SW template** (`public/firebase-messaging-sw.template.js`) grew a
  `notificationclick` handler with a `data.kind` switch table. Regen
  script (`scripts/generate-sw.mjs`) picks it up on every build.
- **Test coverage**: 273 root unit tests (+9 for `deriveDeviceName`)
  and 88 functions tests (+8 for the response-notification composer
  + 2 for the response-flip classifier).

## [0.8.0] — 2026-04-23

A large release that lands the Claude-Design **Profile** and **Ward
Settings** handoffs, a reusable avatar primitive, a full-viewport
invite page with a floating chat drawer, invitation response
receipts with status provenance, and a complete pass over the
message-template surface — every email and SMS the Cloud Functions
send is now editable from a unified `/settings/templates` page, and
the page is usable on phones (accordion rows + fullscreen edit modal).

### Added

- **`/settings/profile` page** (Claude-Design handoff, #49) — one
  surface for identity (96px avatar, editable display name,
  read-only verified email pill), notifications (FCM device list
  with per-row Remove, push toggle, hour-granular quiet hours),
  and sign-out. Sticky right rail + explicit Save/Discard savebar.
  Absorbs the standalone `/settings/notifications` page.
- **Consolidated `/settings/ward` page** (Claude-Design handoff,
  #54) — Schedule preferences + Members & callings under one route
  with a sticky rail and a bottom savebar. Preferences flow through
  the savebar; per-row member edits (calling / CC / Deactivate)
  persist imperatively. New `NumberStepper` and `NudgeChipRow`
  primitives replace the prior bespoke controls.
- **Flat UserMenu**: no more `/settings` index. Avatar header drops
  straight into Profile / Ward settings / Templates / Sign out. (#54)
- **Avatar primitive** with Google `photoURL` + deterministic
  two-letter initials fallback (FNV-1a hash → six-slot palette).
  Sizes `sm` / `md` / `lg` / `xl`. `aria-label` carries the display
  name; initials span is `aria-hidden`. Replaces every ad-hoc
  initials renderer across the app (UserMenu, schedule, chat
  bubbles, profile header). (#18, #48)
- **Full-viewport public invite page** (#45) — `ScaledLetterPreview`
  now fills `100dvh` inside `fixed inset-0`. Letter is the primary
  surface; zoom + pan still work. Floating print toolbar docks
  top-right with safe-area padding.
- **Floating chat drawer** on the invite page — pill FAB collapsed;
  full-screen sheet on mobile (with body-scroll lock so the letter
  behind doesn't rubber-band on iOS); ~420px side panel on sm+.
  Esc or backdrop tap closes. Session-gate states (idle / loading /
  rotated / rate-limited / invalid / error) fill the drawer and
  center their content; the old card-in-card chrome is gone. (#45)
- **Multi-row chat composer** with `resize-y` so speakers can drag
  the composer taller. Pinned to the drawer bottom via
  `mt-auto shrink-0` + safe-area inset; `interactive-widget=resizes-content`
  on the viewport meta so the mobile keyboard shrinks the layout
  viewport instead of overlapping the composer. (#45)
- **Speaker nudge toward the chat** — gentle prompt when a reply
  from the bishopric is sitting unread. (#45)
- **Invitation response receipts** (#20, #44) — new
  `onInvitationWrite` Firestore trigger fires two emails on the
  authoritative transitions: (1) `response.answer` newly present →
  email the speaker (cc'd to active bishopric + clerks) with the
  original letter rendered inline; (2) `response.acknowledgedAt`
  newly present → individual email to each bishopric / clerk with
  the letter + a link to a new read-only bishopric view. Other
  writes (heartbeat, delivery record, token rotation) are classified
  as no-ops by a pure `classifyInvitationChange` helper.
- **Status provenance** on speaker docs: `statusSource`
  (`"speaker-response" | "manual"`), `statusSetBy` (uid),
  `statusSetAt`. Schedule row shows a compact eyebrow on
  confirmed/declined rows: _"from reply · applied by John · Apr 22"_
  or _"set manually by John · Apr 23"_. (#44)
- **Read-only bishopric view** at
  `/ward/:wardId/invitations/:invitationId/view` — letter + response
  block (answer, respondedAt, applied-by). The Apply-receipt email
  links here. (#44)
- **Unified `/settings/templates` page** — all editable templates
  under one route with a grouped PageRail (Speaker invitation /
  Response receipts / Conversation / Ward members). Nine sections
  total: the original three (speaker letter, speaker email for
  `mailto:`, ward invitation) plus six new server-side messages
  (see below). (#54, #55)
- **Six new editable server-side message templates** (#55) —
  initial invitation SMS (Twilio), speaker response receipts
  (accepted + declined, SendGrid email), bishopric response notice
  (SendGrid email cc'd to the ward), and the bishop-reply pair that
  goes to the speaker when the bishopric posts in chat (SMS + email).
  Each template writes to `wards/{wardId}/templates/{key}` with
  defaults that match the prior hardcoded copy, so wards without an
  override see identical behavior.
- **Mobile accordion layout** for `/settings/templates` below 640px.
  Each section collapses to a compact row (eyebrow + title + pencil
  + chevron); tapping the row expands to show the description and
  preview, and the pencil icon opens a fullscreen edit modal with
  the editor, variable list, and Save / Cancel / Reset controls.

### Changed

- **`MessageTemplateCard` + `TemplateVariableList`** — shared
  primitives so every template section on `/settings/templates` uses
  the same variable-hint layout and preview chrome. The older
  Speaker-email and Ward-invite cards now match the new ones.
- **Receipt email builders** (`buildSpeakerReceipt`,
  `buildBishopricReceipt`) take a `headerTemplate` arg. The structural
  pieces — inline letter reproduction, meta lines (responded-at,
  applied-by), divider rules, and the safety warning — stay
  hardcoded so bishoprics don't have to reason about HTML. Only the
  narrative header string is user-authored.
- **Rotate / resend reads live contact info** — when a bishop
  corrects a typo'd phone or email on the speaker form and hits
  Resend, the rotate path now refreshes `speakerEmail` and
  `speakerPhone` from the live speaker doc before building the
  delivery payload. Absent channels are cleared with
  `FieldValue.delete()`. Previously the rotate used the stale
  snapshot on the invitation doc. (#44)

### Removed

- **Copy-invite-link overflow action** from the bishopric chat
  dialog. Rotate no longer returns `inviteUrl` — the freshly-minted
  plaintext URL stays server-side and reaches the speaker only via
  SMS or email. (#44)
- **Emoji reactions on chat messages** (#43). The feature added in
  v0.7.0 couldn't round-trip to the speaker's SMS side of the
  Twilio bridge, so it only worked when both parties happened to be
  on the web chat. Rather than split behavior by surface, the
  feature is fully removed — `ReactionPicker`, `ReactionBar`,
  `reactions.ts`, and the `messageUpdated` listener on
  `useConversation` (it only fired for reactions) are all gone.

### Infrastructure

- **New Cloud Function**: `onInvitationWrite` (Firestore trigger on
  `wards/{wardId}/speakerInvitations/{invitationId}`) — fans out the
  speaker + bishopric receipts on authoritative response
  transitions. Seventh Cloud Function on the surface; the project's
  "six Cloud Functions" rule is deliberately relaxed to seven for
  the receipt trigger. (#44)
- **Shared template helpers**: `functions/src/messageTemplates.ts`
  exposes `interpolate` + `readMessageTemplate` (falls back to the
  default when the Firestore doc is absent or malformed). Defaults
  live in `functions/src/messageTemplateDefaults.ts` and
  `src/features/templates/serverTemplateDefaults.ts` — a drift-check
  test asserts the two stay identical. (#55)
- **Client plumbing**: generic `useMessageTemplate(key)` hook +
  shared `writeMessageTemplate(wardId, key, { bodyMarkdown })`
  writer. `invitationDelivery.ts` extracted from
  `sendSpeakerInvitation.helpers.ts` to house SMS/email delivery
  (was over the 150-LOC cap). (#55)
- **Test coverage**: 264 root unit tests (+15 over v0.7.0) and 76
  functions tests (+23 — new template helpers, receipt classifier,
  `buildSpeakerReceipt` + `buildBishopricReceipt` variants, and the
  client/server defaults drift-check).
- **Firestore rules unchanged** — the existing
  `match /templates/{templateId}` allow-list already covers the six
  new keys.

## [0.7.0] — 2026-04-23

Chat polish and invitation resend / copy-link, plus two mobile-fit
fixes. The bishopric chat now feels like a real messenger — day
separators, unread horizon with jump-to-latest, typing indicator,
read receipts, composer auto-grow, optimistic send, per-message
emoji reactions, and a full-screen mobile layout. Bishops can also
resend an invitation SMS or copy the invite link directly from the
chat dialog without leaving the thread, and the PWA on iOS/Android
stops behaving like a browser tab.

### Added

- **Day separators + per-message timestamps** in the chat thread.
- **Unread horizon + jump-to-latest pill** — the thread remembers
  where the reader left off and offers a one-tap return to the
  newest message.
- **Typing indicator + read receipts** sourced from Twilio
  Conversations, so both sides of the thread see presence state.
- **Composer auto-grow, optimistic send, and SMS hint banner** —
  messages render instantly while the API call is in flight, and
  the composer explains that a reply will SMS the speaker.
- **Emoji reactions on individual messages** — tap-and-hold to
  react, same set visible to every participant.
- **Bishop can copy or resend the invite link** from the chat
  dialog's overflow menu. Resend triggers a fresh SMS with a
  rotated capability token while preserving the Twilio
  `conversationSid` (full message history stays intact).
- **Full-screen bishop chat on mobile** with page-scroll lock so
  the composer never hides behind iOS Safari chrome.

### Changed

- **`sendSpeakerInvitation` gains rotate-link mode** — the callable
  now accepts a `rotate: true` flag that generates a new hashed
  capability token, writes it to the invitation doc, and re-sends
  the SMS without creating a second Twilio conversation.
- **Chat UI polish** — redundant inner header removed, link
  actions collapsed into the overflow menu, 36px avatars aligned
  against the last bubble in a stack instead of the stack midpoint.
- **a11y (chat)**: semantic separators for day breaks, an sr-only
  label for optimistic pending messages, and a pass over
  announcement markup.

### Fixed

- **Sunday card click target was too broad** — the whole top
  region of the card navigated to `/week/:date`. Only the date
  text now navigates, with a bordeaux-deep underline on hover;
  the card-wide shadow lift was dropped so the card no longer
  reads as a click target. (#38)
- **PWA on mobile behaves like a browser tab** — overscroll
  bounce, pinch-zoom, double-tap zoom, and iOS input-focus
  auto-zoom are now disabled in the installed PWA via
  `maximum-scale=1 + user-scalable=no` on the viewport meta,
  `overscroll-behavior: none` + `touch-action: manipulation`
  on `html, body`, and a 16px font-size floor on inputs gated
  to touch devices. Desktop layouts and Ctrl+/- zoom are
  unaffected. (#40)

### Infrastructure

- 249 unit tests passing — new coverage for the chat thread's
  unread horizon, day separators, typing indicator, reaction
  picker, rotate-link mode on `sendSpeakerInvitation`, and the
  overflow-menu copy-link / resend flows.

## [0.6.0] — 2026-04-23

Two-way speaker conversations (#16) and a reworked speaker scheduling flow
(#33). The invitation feature now bridges SMS and a web chat: bishops send
from the Prepare page, speakers tap the SMS link to a tokened landing page,
can reply with Yes/No or free-form chat. Replies flow back to the bishopric
as FCM push; bishop replies flow to the speaker as SMS with a fresh
resume-link that reopens the same thread with history preserved.

### Added

- **Two-way speaker chat** end-to-end — Twilio Conversations-backed group
  thread that includes every active bishopric + clerk member, bubble
  styling with initials / avatars, read-receipts, and an unread badge on
  the Schedule's per-speaker chat icon. (#16)
- **Speaker self-response** (Yes/No + optional reason) from the invite
  landing page, with a bishop-side Apply action that flips speaker status
  to confirmed / declined. (#16)
- **Fresh resume-link in bishop-reply SMS** when the speaker's tab has
  been closed > 2 minutes — same `conversationSid` preserves full message
  history when the link is tapped. (#16)
- **Heartbeat gate** (`speakerLastSeenAt` on the invitation doc, written
  every 60s from the visible speaker tab) so redundant SMS notifications
  are skipped while the speaker is actively viewing the chat. (#16)
- **Two-step Assign Speakers modal** — Edit first, then Send invitations.
  4-speaker cap per meeting, Add-speaker tile inside the grid, responsive
  1–4 column layout on 2xl screens. (#33)
- **Confirm dialog** before flipping a speaker's status to a non-planned
  value (prevents accidental cancels / decline flips).

### Changed

- **Speaker auth rewritten** from phone-OTP to capability-token. The
  invitation URL now carries a one-time SHA-256 hash; `issueSpeakerSession`
  exchanges it for a Firebase custom token + Twilio JWT. Self-heals on a
  consumed or expired link by rotating the hash and sending a fresh SMS
  (daily cap bounds the cost exposure). (#16)
- **Bishop-reply SMS** now identifies the bishopric as a group ("new
  message from the bishopric about your speaking assignment") rather than
  a single name, and includes the resume link. (#16)
- **Chat bubble eyebrows** label senders by registered name instead of
  email. (#16)
- **Speaker response surface** moved from a separate page into the Assign
  modal (#16).

### Fixed

- **Second bishopric member** added or activated after an invitation was
  sent could not see the chat thread —
  `issueSpeakerSession` now idempotently backfills the Twilio participant
  on every chat open. (#16)
- **Invite URLs with a trailing-slash `STEWARD_ORIGIN`** no longer
  collapse to a 404; `buildInviteUrl` strips trailing slashes
  defensively.
- **Save flicker** on the Schedule's speaker grid when edits apply —
  speakers now live on the Sunday card rather than re-mounting. (#33)
- **Speaker + add-speaker cards** match heights per row on the Assign
  modal. (#33)
- **Assign modal step** locked at open time (no step-hopping mid-edit).
  (#16)
- **Invitation list queries** no longer require a composite Firestore
  index. (#16)
- **Phone-authed users** resolve to `none` in the auth gate instead of
  sticking on "checking". (#16)
- **Unread badge** handles the null read-horizon case without crashing.
  (#16)

### Infrastructure

- **Three new Cloud Functions**: `sendSpeakerInvitation` (callable — creates
  the invitation + Twilio Conversation + delivers email/SMS with a hashed
  capability token), `issueSpeakerSession` (callable — exchanges the
  capability token for a Firebase custom token + Twilio JWT; self-heals
  consumed / expired tokens via rotation + resend), `onTwilioWebhook`
  (HTTPS — receives Conversations events, fans out FCM to bishopric + SMS
  to speaker). (#16)
- **Firestore rule extension**: speakers can write `response` +
  `speakerLastSeenAt` on their own invitation doc (claim-gated,
  expiry-gated). (#16)
- **Local emulator loop** for the invitation flow — `pnpm emulators` now
  starts functions + pubsub alongside auth + firestore; `pnpm dev:functions`
  watches TS on the functions package; `STEWARD_DEV_STUB_SMS=true` in
  `functions/.env.local` bypasses real Twilio SMS (still uses real
  Conversations for chat) and logs the invite URL to the emulator
  terminal. (#16)
- **Test coverage**: 53 functions unit tests (+14 from v0.5.0 — token
  helpers, session helpers, SMS stub) and 21 speaker-invitation rules
  tests (+3 for the heartbeat field).

## [0.5.0] — 2026-04-22

Speaker invitations over SMS (#15). Adds a one-tap **Send SMS**
action next to Send email in the Prepare Invitation toolbar —
native `sms:` hand-off to the device's Messages app, no paid
gateway, no new Cloud Function. Bishops can now reach speakers
who answer texts faster than email without leaving the app.

### Added

- **Phone field on speakers** (`speakerSchema.phone`, optional).
  Surfaced as a new input on the speaker editor card, between
  Email and Topic, labeled "optional, enables Send SMS".
- **Send SMS icon button** in the Prepare Invitation toolbar
  (between Print and Send email). Disabled when no plausible
  phone on file. Confirm modal matches the Send email pattern:
  snapshots the letter into a new invitation link, opens the
  native Messages composer pre-filled with a short text + invite
  URL, and flips status to `invited`.
- **`smsInvitation.ts`** helper: `buildSmsHref`,
  `normalizePhone` (strips parens / spaces / dashes / dots,
  preserves a leading `+`), `isPlausiblePhone` (lax ≥ 7-digit
  threshold), and `renderSmsBody` with a hardcoded default
  ("Hi {speakerName}, you've been invited to speak in sacrament
  meeting on {date}. Full invitation: {inviteUrl}") short
  enough to fit one SMS segment with a typical token URL.
- **Tests**: 10 unit tests for the URL / phone helpers + 5
  component tests for the toolbar's SMS button state, confirm
  modal gating, and cancel path. 209 tests passing total
  (+12 from this release).

### Changed

- `canSendReason` copy on the toolbar updated to include SMS as
  a path: "No email on file — print, text, or mark invited
  instead" instead of "print or mark invited".

### Infrastructure

- No new deps. No Cloud Function added — `sms:` URLs are pure
  client-side hand-off, respecting the "exactly three Cloud
  Functions" hard rule.
- No Firestore rule changes (reusing the existing speaker write
  path, no new fields on invitations / audit docs).

### Deliberately out of scope

- Paid gateway (Twilio / Vonage / etc.).
- `smsInvitedAt` audit-trail field — status flip matches the
  email path.
- Editable ward-level SMS template — hardcoded default ships
  here; can follow the email-template pattern later.
- iMessage / WhatsApp deep links.
- Playwright e2e — covered by unit + component tests since the
  prepare-invitation route needs auth + seeded emulator speaker
  data + editor hydration, which didn't add confidence over
  the tight tests on URL construction and button gating.

## [0.4.0] — 2026-04-22

Streamlined speaker-invitation flow (#26). The three-button Planned
action strip (Mark invited / Print letter / Send email) collapses
into a single **Prepare invitation** button that opens a full-page
editor in a new tab — letter body + footer MDXEditors on the left,
pinch-zoomable 8.5 × 11 paper preview on the right, and an
icon-only toolbar with confirm dialogs for every terminal action.
The ward template settings page (`/settings/templates/speakers`)
and the public invitation landing page get the same preview +
print chrome so all three surfaces feel like one system.

### Added

- **Prepare Invitation page** at
  `/week/:date/speaker/:speakerId/prepare`, opened in a new tab
  from the "Prepare invitation" button. Runs outside the AppShell
  for full-viewport real estate. Sticky header with speaker name
  and email target on the left, X close top-right, toolbar
  centered below (mobile) or floating top-right inside the
  preview (desktop).
- **Zoomable / pannable letter preview** (shared
  `<ScaledLetterPreview>` component): wheel + pinch zoom,
  click-drag + touch-drag pan, double-click reset. Fit-to-container
  computed from a new `useFitScale` hook (ResizeObserver + CSS
  `zoom`). Bottom-left pill shows current magnification percentage
  with step + reset controls. Applied to:
  1. The Prepare Invitation editor
  2. The ward template settings page
     (`/settings/templates/speakers`)
  3. The public speaker landing page
     (`/invite/speaker/:wardId/:token`)
- **Icon-only toolbar** with tooltips: Revert / Mark invited only
  / Print / Send email on the editor, Reset / Save on the ward
  template page. Connected button group, smaller on mobile, Cancel
  split out as the header X.
- **Confirm modals** (`<ConfirmDialog>`) gate every destructive
  or side-effecting action:
  - **Revert** distinguishes "discard unsaved edits" vs "clear
    saved override" copy based on whether an override exists.
  - **Mark invited only** explains the status-flip-no-email path
    for phone / in-person / already-reached cases.
  - **Send email** explains the snapshot + mailto + status flip,
    and reassures the bishop the message is still reviewable in
    their email client before actually sending.
  - **Save as ward default** explains future invitations will use
    the new text + existing sent invitations are frozen snapshots.
  - **Reset to defaults** clarifies the ward template on file
    stays until you click Save.
- **Editable speaker-email body template** (#26, slice 1 / #27):
  new ward template at `wards/{wardId}/templates/speakerEmail`
  edited from `/settings/templates/speaker-email`. Replaces the
  hardcoded "Please open your invitation letter at the link below"
  that looked like phishing — default now names purpose, sender,
  and Sunday upfront.
- **Editor guide**: collapsible `<SpeakerLetterGuide>` above the
  body / footer editors listing every supported variable
  (`{{speakerName}}`, `{{topic}}`, `{{date}}`, `{{today}}`,
  `{{wardName}}`, `{{inviterName}}`) with a short description.
- **Mobile preview FAB**: `<MobileLetterPreviewButton>` — fixed
  bottom-right pill on mobile only, opens the 8.5 × 11 preview
  as a full-viewport overlay when the desktop preview column is
  hidden.
- **Print pipeline**: `<PrintOnlyLetter>` React Portal mounts a
  copy of the letter at `document.body` level on every page that
  exposes a Print button. Global `@media print` rules in
  `src/styles/index.css` hide every other body-level child via
  `body > *:not([data-print-only-letter]) { display: none }`
  so printing is WYSIWYG with no blank trailing pages or
  mis-scaled sheets. `@page { size: letter; margin: 0 }` +
  reset body/html margins for edge-to-edge printing.

### Changed

- **Speaker action strip** on the schedule view: three buttons
  (Mark invited / Print letter / Send email) collapse to a single
  **Prepare invitation** primary button. The card-header "Edit
  letter" is gone — the Prepare page is the one place letter
  editing happens.
- **`sendSpeakerInvitation`** simplified: takes the resolved
  letter body + footer from the caller instead of running its
  own override + template lookup. One `getDoc` (ward name) per
  send instead of three.
- **Letter spacing** in `<LetterCanvas>` trimmed
  (`pt-[0.85in] pb-[0.6in]`, shorter margins between the
  header / date / callout / signature / footer blocks) so a
  typical 4-paragraph letter fits on one 11 in sheet. Letter
  side margins dropped from 1.1 in to 0.75 in for more body
  width.
- **Settings index** now marks the speakers template link as
  "↗ new tab" and opens it with `target="_blank"` to match the
  Prepare flow.
- **`/settings/templates/speakers`** moves outside the AppShell
  entirely — sticky header with X close, icon toolbar inside
  the preview. Same full-viewport rhythm as the Prepare page.
- **MDXEditor sizing**: `min-h-[220px]` moves from the
  `className` prop (which applies to popup containers) to
  `contentEditableClassName` (which applies to the editable
  area). Fixes a bug where two empty popup containers were
  adding ~440 px of phantom height and forcing a page
  scrollbar.

### Removed

- `SpeakerLetterOverrideDialog` + `useLetterOverrideForm` +
  `OverrideDialogFooter` — consolidated into the Prepare page.
- `PrepareInvitationEmailTab` + `PrepareInvitationTabs` +
  `speakerEmailOverride` — per-speaker email editing dropped
  (email is tweaked in the mail client after mailto).
- `TemplateSaveActions` — replaced by the icon-only
  `<WardTemplateToolbar>` with confirm modals.
- `printInvitationLetter` + its test — replaced by
  `window.print()` + `<PrintOnlyLetter>`.
- `fullWidth` prop on `AppShell` / `AuthGate` — dead code
  after the speakers template page moved outside the shell.

### Infrastructure

- Dependency: `react-zoom-pan-pinch` ^4.0.3 (~200k weekly
  downloads, maintained through 2025). Drives the
  pinch / zoom / pan UX on every letter preview.
- 194 unit tests (down 3 from v0.3.0 — the removed
  `printInvitationLetter.test.ts` accounted for the delta) +
  86 Firestore rules tests (unchanged).

## [0.3.0] — 2026-04-22

Editable Markdown templates across both outbound surfaces. Bishops and
clerks can now author the speaker invitation letter and the ward-member
invitation message in their ward's voice — defaults ship polished, but
every word is editable from Settings, and individual sends can override
the ward default when a specific speaker or invitee needs different
copy. Closes #8 and #9.

### Added

- **Speaker invitation letter template** (#8). New ward-level template
  at `wards/{wardId}/templates/speakerLetter` (two Markdown blocks —
  body + scripture footer) with a live preview at
  `/settings/templates/speakers`. Variables: `{{speakerName}}`,
  `{{topic}}`, `{{date}}`, `{{wardName}}`, `{{inviterName}}`,
  `{{today}}`.
- **Public speaker invitation landing page** at
  `/invite/speaker/:wardId/:token`. Fully public — the unguessable
  Firestore auto-ID in the URL is the authorization. Shows the full
  letter on a `bg-parchment` sheet with "Print / Save as PDF" toolbar
  that hides under `@media print`; `@page { size: letter; margin: 0 }`
  for a clean one-page portrait PDF.
- **Send email → landing URL flow**: "Send email" on a persisted
  planned speaker now snapshots the current template + ward + speaker
  into `wards/{wardId}/speakerInvitations/{autoId}` and opens a
  `mailto:` with the landing URL in the body. Frozen snapshot pattern —
  the letter is immutable once sent, so recipients keep the exact text.
- **Per-speaker letter override** (Slice 4 of #8). `Edit letter` on a
  SpeakerEditCard opens a side-by-side MDXEditor + LetterCanvas preview
  dialog. Override lives on the speaker doc; precedence on send is
  override → ward template → seed default.
- **Ward-member invitation message template** (#9). Second template
  at `wards/{wardId}/templates/wardInvite` (single Markdown block) with
  editor + preview at `/settings/templates/ward-invites`. Variables:
  `{{inviteeName}}`, `{{wardName}}`, `{{inviterName}}`, `{{calling}}`
  (pretty-printed via `CALLING_LABELS`), `{{role}}`.
- **Per-invite message override** in `InviteMemberDialog` (collapsible
  "Customize message" panel). On send, the rendered greeting is
  snapshotted onto the invite doc as `messageBody` so the accept page
  can display it without needing template-doc access (the invitee
  isn't a member yet).
- **Rendered greeting on the accept-invite page**: above the
  existing "Join X Ward?" CTA, rendered as Markdown from the
  snapshotted `messageBody`.
- **Shared template primitives** reused by both features:
  `interpolate()` (whitespace-tolerant `{{var}}` replacement, 7 unit
  tests), `LetterCanvas` (ornament / eyebrow / title / scripture
  footer chrome), `SpeakerLetterEditor` (thin MDXEditor wrapper with
  headings / lists / quotes / inline formatting).

### Changed

- `openInviteMailto` now takes a pre-rendered `messageBody` and appends
  the accept URL + "— Sent from Steward" footer automatically, so the
  template can focus on the personal greeting.
- Firestore rule `match /templates/{templateId}` covers every ward
  template under one permissive rule (active members read + write) —
  both the speaker letter and ward invite share the same access model.

### Security

- New public-read rule for `/speakerInvitations/{token}` (anonymous
  read, active-member write). Safe by construction: Firestore auto-IDs
  provide ~120 bits of entropy, and each invitation is a self-contained
  frozen snapshot (no ward doc or template reads needed).

### Infrastructure

- MDXEditor (`@mdxeditor/editor`) + `react-markdown` added as
  dependencies for template authoring and preview rendering.
- 197 unit tests (+7 from `interpolate`) and 85 Firestore rules tests
  (+15 across `templates.test.ts` and the new `speakerInvitations.test.ts`).

## [0.2.0] — 2026-04-21

First feature release on the new branch-PR workflow.

### Added
- **Version label in the topbar** (#5). Shows `v{version}` directly
  below the "Steward" wordmark, centered, in a quiet mono eyebrow.
  Clicking opens the matching GitHub Release in a new tab. Version
  is pulled from `package.json` at build time via a Vite `define`
  (`__APP_VERSION__`), so the bundle always carries the version the
  commit was tagged with.

## [0.1.2] — 2026-04-21

Backlog scaffolding: a skill for filing issues mid-session plus issue
templates so anything captured follows a consistent shape.

### Added
- `.claude/skills/log-issue.md` — skill that turns a mid-session
  discovery into a GitHub issue (de-dupe search, template-shaped body,
  label selection, guardrails).
- `.claude/skills/feature-branch-workflow.md` — skill that enforces
  "non-trivial changes start on a `feat/…` / `fix/…` / `chore/…`
  branch off `develop` and ship as a PR; no direct pushes to
  `develop` or `main`, no squash/rebase, no force-pushes".
- `.github/ISSUE_TEMPLATE/` with `bug.yml`, `feature.yml`, and
  `tech-debt.yml` so issues filed from the GitHub UI follow the same
  shape as ones filed via the CLI. `config.yml` disables blank
  issues.
- Labels on GitHub: `tech-debt`, `needs-triage`, `security`.
- `CLAUDE.md` "Backlog hygiene" section: Claude now proactively asks
  about logging any discovered bug / feature idea / tech-debt item
  mid-session, with a 10-minute rule-of-thumb threshold.
- `CLAUDE.md` hard rules: "No direct pushes to `develop` or `main`"
  and "Merge-commit is the only enabled merge method".

### Changed
- **Merge methods at the repo level**: squash and rebase merges
  disabled on GitHub (`gh repo edit --enable-squash-merge=false
  --enable-rebase-merge=false`). Only "Create a merge commit" is
  available now, which prevents the history drift that produced the
  "N ahead / N behind" mirror on earlier releases.
- `.claude/skills/release-to-main.md` — dropped the force-push
  develop-realignment step (no longer needed, now that drift can't
  occur) and added a simple fast-forward `git pull` post-merge sync.
  Guardrails hardened: no direct pushes, no force-pushes, ever.
  Changelog step also pulls closed issues since the last tag so each
  release links back to the backlog that drove it.

### Infrastructure
- Branch protection on `develop` / `main` is NOT enforced at the
  GitHub layer — classic protection and rulesets both require
  GitHub Pro on private repos. The PR-only workflow is enforced by
  skills + discipline. Revisit if the repo moves to a paid plan or
  adds collaborators.

## [0.1.1] — 2026-04-21

Docs + release tooling, plus a cleanup of an index config that drifted
into `main` from a prior rebase-and-merge.

### Added
- `README.md` with stack, scripts, routes, and the versioning policy.
- `CHANGELOG.md` (Keep a Changelog format) — start of a release log.
- `.claude/skills/release-to-main.md` — project-scoped Claude Code
  skill that walks the release runbook (versioning, changelog update,
  PR + merge strategy, post-merge develop realignment, tagging, and
  Firestore rules/indexes deploy sequence).

### Fixed
- `firestore.indexes.json` — remove the duplicate `invites.email`
  collection-group composite entry that slipped back in during a
  rebase-and-merge. The `fieldOverrides` version is the source of
  truth (single-field collectionGroup queries need an override, not
  a composite — prod Firestore rejects the composite).

### Infrastructure
- `package.json` bumped to `0.1.1`.

## [0.1.0] — 2026-04-21

First production release. Bundles the v2 redesign plus several
correctness fixes shipped to `steward-prod-65a36`.

### Added
- **v2 redesign** across Schedule, Week editor, Program, Print, and
  Members pages, on the walnut / parchment design system.
- **Email-invite flow** replaces manual UID paste. Bishopric sends a
  `mailto:` invite; invitee self-accepts via `/accept-invite/:wardId`.
  Invite doc snapshots `wardName` so invitees (not yet ward members)
  can land on the accept page without needing to read the ward doc.
  Cross-ward pending-invite discovery surfaced on the
  `AccessRequired` page.
- **Inline save indicator** (idle / saving / saved / error) in the
  `ProgramSaveBar`, replacing a transient toast. Friendly copy for
  permission-denied + network errors.
- **Online / offline banner** pinned below the topbar, driven by
  `navigator.onLine`. Transient "Back online — syncing changes" note
  for a few seconds after reconnect.
- **Congregation + Conducting print views** — congregation prints
  two-up on landscape letter for paper saving; conducting fits one
  dense portrait page with script cues. Grayscale under `@media
  print`.
- **ProgramRail** now distinguishes done / unconfirmed / missing per
  section, matching the status legend.
- **Ward name** shown next to the app name in the topbar.
- **Hymn picker** flips upward when there isn't room below the
  trigger; same behavior in the overflow menu.
- **Visitor list** on the Leaders section.
- **Drag-to-reorder** speakers (with rest hymn / musical number as a
  draggable row).
- **Emulator persistence** via `--import=./emulator-data --export-on-exit`
  so local ward state survives restarts.
- **Release workflow** codified in `.claude/skills/release-to-main.md`
  (merge strategy, develop realignment, Firestore deploy order).

### Changed
- **User menu** collapsed to a single Settings entry; sub-pages live
  on the `/settings` index.
- **Approval flow is now transactional** — `requestApproval`,
  `approveMeeting`, `resetToDraft`, `writeMeetingPatch`, and
  `ensureMeetingDoc` all run inside `runTransaction` so concurrent
  approvers can't drop each other's vote.
- **reorderSpeakers** runs speakers + hash recompute in a single
  atomic transaction (no stale hash on partial failure).
- **SpeakerEditList.save()** serialized so the final
  `contentVersionHash` matches the final speaker set.
- **Settings pages** inherit the AppShell max-width so their layout
  matches Schedule and Week.
- **print/PrintLayout** waits on `document.fonts.ready` instead of a
  250ms timeout.
- Toast system removed; modal flows show local inline errors instead.

### Fixed
- Ward members stop zombie Firestore listeners on sign-out (avoids a
  firebase-js-sdk internal assertion).
- `handleRequestApproval` / `handleResetToDraft` now surface errors to
  the save indicator — previously failures were silent.
- Request-approval button gates on `memberReady` so a first-render
  bishopric user isn't mis-classified.
- Print routes no longer redirect to `/schedule` when the meeting is
  not yet approved — they show a `NotApproved` screen instead.
- Dropdowns (`OverflowMenu`, `HymnPicker`) flip upward when below-
  viewport space is tight.

### Security
- **Firestore rule tightening**: `approvalsArrayOk` now requires each
  preserved approval at equal array length to match identity fields
  (`uid` / `email` / `displayName` / `approvedVersionHash`), blocking
  a clerk from rewriting a bishop's approval entry. Only the legit
  invalidation path (`invalidated` flipping `false` → `true`) is
  allowed.
- **Invite rules**: bishopric-only invite CRUD, invitee can read +
  delete their own invite, invitee can self-create a member doc only
  when a matching invite exists and the new doc mirrors the invite's
  role / calling / email / displayName.

### Infrastructure
- Firestore index for `invites.email` configured via
  `fieldOverrides` (single-field collectionGroup queries require a
  field override, not a composite index).
- 190 unit tests (+45 new this release) and 70 Firestore rules tests
  (+17 new).
- Biome format check gated in CI; `design/` and `emulator-data/`
  excluded; tailwindDirectives enabled so `styles/index.css` parses.

[Unreleased]: https://github.com/aylabyuk/steward/compare/v0.10.0...HEAD
[0.10.0]: https://github.com/aylabyuk/steward/releases/tag/v0.10.0
[0.9.13]: https://github.com/aylabyuk/steward/releases/tag/v0.9.13
[0.9.12]: https://github.com/aylabyuk/steward/releases/tag/v0.9.12
[0.9.11]: https://github.com/aylabyuk/steward/releases/tag/v0.9.11
[0.9.10]: https://github.com/aylabyuk/steward/releases/tag/v0.9.10
[0.9.9]: https://github.com/aylabyuk/steward/releases/tag/v0.9.9
[0.9.8]: https://github.com/aylabyuk/steward/releases/tag/v0.9.8
[0.9.7]: https://github.com/aylabyuk/steward/releases/tag/v0.9.7
[0.9.6]: https://github.com/aylabyuk/steward/releases/tag/v0.9.6
[0.9.5]: https://github.com/aylabyuk/steward/releases/tag/v0.9.5
[0.9.4]: https://github.com/aylabyuk/steward/releases/tag/v0.9.4
[0.9.3]: https://github.com/aylabyuk/steward/releases/tag/v0.9.3
[0.9.2]: https://github.com/aylabyuk/steward/releases/tag/v0.9.2
[0.9.1]: https://github.com/aylabyuk/steward/releases/tag/v0.9.1
[0.9.0]: https://github.com/aylabyuk/steward/releases/tag/v0.9.0
[0.8.0]: https://github.com/aylabyuk/steward/releases/tag/v0.8.0
[0.7.0]: https://github.com/aylabyuk/steward/releases/tag/v0.7.0
[0.6.0]: https://github.com/aylabyuk/steward/releases/tag/v0.6.0
[0.5.0]: https://github.com/aylabyuk/steward/releases/tag/v0.5.0
[0.4.0]: https://github.com/aylabyuk/steward/releases/tag/v0.4.0
[0.3.0]: https://github.com/aylabyuk/steward/releases/tag/v0.3.0
[0.2.0]: https://github.com/aylabyuk/steward/releases/tag/v0.2.0
[0.1.2]: https://github.com/aylabyuk/steward/releases/tag/v0.1.2
[0.1.1]: https://github.com/aylabyuk/steward/releases/tag/v0.1.1
[0.1.0]: https://github.com/aylabyuk/steward/releases/tag/v0.1.0
