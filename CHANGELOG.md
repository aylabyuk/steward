# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning
follows [SemVer](https://semver.org/) with the pre-1.0 interpretation
documented in [README.md](README.md#versioning--releases).

## [Unreleased]

## [0.21.2] — 2026-05-03

Patch release: precision tweak to the schedule countdown labels.

### Fixed

- **Schedule countdown is precise instead of round-up.** `formatCountdown` previously called `Math.ceil(daysUntil / 7)`, so 8 days showed "In 2 weeks" and 17 days showed "In 3 weeks". It now floors the week count and surfaces the remainder, producing copy like "In 1 week and 1 day" and "In 2 weeks and 3 days". Both formatters anchor to local-midnight so DST shifts and late-night composition don't pull a result across a day boundary. Verbose copy on the desktop `SundayCardHeader` and `SundayTypeMenu`; a new compact form ("In 2w 3d") is wired into `MobileSundayBlock` so the tighter mobile header stays one line. (#236)

## [0.21.1] — 2026-05-02

Bundled remediation release for the remaining items from the 2026-05-01 invitation-flow audit. PR #233 lands eight findings as separate commits — one High, four Medium, three Low — alongside the audit's Critical (already shipped in v0.21.0). Behaviour-preserving for normal flows; rate-limited callers and `[archived]` Twilio Conversations are the only user-observable surface changes. App Check is wired but gated on operator-side env vars so this release ships in observe-only mode.

### Security

- **Bishop Apply runs in a Firestore transaction (M1).** `applyResponseToSpeaker` now wraps the response read + the auth-subdoc + participant writes in a single `runTransaction`. Two bishopric tabs racing the Apply button can't both pass the "no answer yet" check, and a speaker submitting a response mid-apply can't leave participant.status out of sync with the auth subdoc's `response.answer`. Short-circuits when `response.acknowledgedAt` is already stamped so a second click is a true no-op. (#233)
- **Chat-author `{{...}}` neutralised before template interpolation (M2).** `interpolate` is single-pass today, but a future change to recursive substitution would let a chat-authored `{{inviteUrl}}` expand against the surrounding vars dict. New `neutralizeMustaches` helper inserts a space (`{{` → `{ {`) on the bishop-authored chat body before it reaches the SMS / email template, breaking the regex unconditionally while keeping the visible intent. Applied at both `smsSpeaker` and `emailSpeaker` call sites. (#233)
- **Twilio webhook cross-checks `wardId` from `ConversationAttributes` (M6).** The Conversations post-webhook payload includes the conversation-level attributes JSON we set at create time (`{ wardId, speakerId }`). The webhook now compares that `wardId` against the wardId derived from the Firestore lookup; if both are present and disagree, the event is logged + ignored before any fan-out runs. Absent attributes (older conversations) fall through to the prior behaviour. (#233)
- **Security headers on `/invite/speaker/*` (M7, L1).** Three new response headers on the public speaker route via `vercel.json`: `Referrer-Policy: no-referrer` (so the rotating capability token in the URL doesn't leak to external link targets), `X-Frame-Options: DENY` (block click-jacking via iframe embed), and a `Content-Security-Policy-Report-Only` covering Firebase Auth / Firestore / Identity Toolkit, Twilio Conversations (mcs + tsock), Google reCAPTCHA (App Check), and self-hosted scripts. `frame-ancestors 'none'` mirrors X-Frame-Options for modern browsers. Report-only for now; flip to enforced after a soak window. (#233)
- **Speaker session revoke runs inside the rotation transaction (L2).** Both rotation paths now call `revokeSpeakerSession` from inside the Firestore transaction that commits the new `tokenHash`: `decideTokenAction` invokes revoke just before `tx.update`; `rotateInvitationLink` is fully wrapped in `runTransaction` (read merged invitation → refresh live contact → revoke → tx.update). `revokeRefreshTokens` is idempotent so tx retries are safe. Closes the window where the new token committed before the prior session was invalidated. (#233)
- **Prior conversations archived on resend instead of hard-deleted (L3).** `cleanupPriorConversations` now closes the prior Twilio Conversation (`state: closed`, friendlyName prefixed with `[archived] `) instead of removing it. Closed conversations reject new messages but retain the message history in the Conversations service for audit. A re-send still issues a fresh Conversation under a new SID, so the speaker only sees the active thread; bishopric record-keeping gets the prior thread preserved. The hard-delete `deleteConversation` helper is retained for explicit full-purge use cases. (#233)
- **Structured `invitation.consumed_token_presented` + `invitation.rate_limited` logs (L5).** `decideTokenAction` emits two named events during the rotation branch — info-level when a previously-consumed token is presented (with `reason: "expired" | "consumed"` to distinguish a normal expired-token rotation from a replay-style attempt), and warn-level when the daily rotation cap (`ROTATION_DAILY_CAP`) trips. Cloud Logging filter targets are `jsonPayload.event="invitation.consumed_token_presented"` and `jsonPayload.event="invitation.rate_limited"`. Operator follow-up: create log-based metrics + Cloud Monitoring alerts at the desired thresholds. (#233)
- **App Check (reCAPTCHA Enterprise) + per-IP rate limit on `issueSpeakerSession` (H4).** Web client now initialises Firebase App Check on both Firebase apps (main + invite) using `ReCaptchaEnterpriseProvider`, gated on the `VITE_FIREBASE_APPCHECK_SITE_KEY` env var so dev/emulator and any environment without a configured key continues to work unchanged. The `issueSpeakerSession` callable opts into `enforceAppCheck` via the `APP_CHECK_ENFORCED` env var (unset → observe-only) so the operator can ship the client-side init first, observe verification metrics for a soak window, and only flip the enforcement flag once real traffic looks healthy. New `functions/src/rateLimit.ts` adds an in-memory per-IP token bucket (30 calls per 60s) — Fluid Compute reuses function instances so the bucket persists across invocations on the same instance. Combined with App Check this is a best-effort backstop, not the primary defense; over-limit returns the existing `{ status: "rate-limited" }` shape so the landing page reuses its existing UI branch. (#233)

### Infrastructure

- **`issueSpeakerSession.ts` split for the 150-LOC cap.** PR-10's additions pushed the callable file past the project-wide `max-lines: 150` rule. The dispatch (`handleSpeakerTokenExchange` + `mintSpeakerSession`) moves to a new sibling `issueSpeakerSession.dispatch.ts`; shared types (`TOKEN_TTL_SECONDS` + `SpeakerResponse`) move to `issueSpeakerSession.types.ts`. Pure file split — no behaviour change. (#233)
- **Operator follow-ups added by this release.** reCAPTCHA Enterprise site key + Firebase App Check provider provisioned during the v0.21.1 setup; `VITE_FIREBASE_APPCHECK_SITE_KEY` set on Vercel Production. After ~1 week of healthy `appCheckTokenInvalid` / `appCheckTokenMissing` metrics in Firebase Console → App Check → APIs, set `APP_CHECK_ENFORCED=true` in `functions/.env.steward-prod-65a36` and redeploy `issueSpeakerSession`. Add Cloud Logging metrics + alerts on the two new log events documented above.

## [0.21.0] — 2026-05-02

Three threads of work since v0.20.1, anchored by the **Critical** doc-split fix from the 2026-05-01 security audit (C1).

### Security

- **Invitation doc split — public letter parent + private auth subdoc.** Fixes the audit's only Critical: previously every speakerInvitation lived in one Firestore doc with `allow read: if true`, which meant anyone with the URL could read `tokenHash`, `speakerEmail`, `speakerPhone`, the bishopric snapshot (with emails), the full `response` object, `deliveryRecord`, and the testing-number marker. The doc now splits into a public parent that carries only the letter snapshot + `conversationSid` + `expiresAt` + a tiny `responseSummary` denorm, and a private auth subdoc at `…/{id}/private/auth` that carries everything else. The subdoc is gated by Firestore rules — only the speaker (after `issueSpeakerSession` mints a Firebase custom token with matching `invitationId` + `wardId` claims) or an active bishopric/clerk member can read it. New Cloud-Function helpers (`invitationDocs.ts`) keep the merged shape downstream code consumes unchanged. New rules suite explicitly asserts the anonymous-read gate. Migration script (`scripts/migrate-invitation-doc-split.ts`) folds existing invitations onto the split. (#230)

### Added

- **SMS receipt on speaker Yes/No transition.** When a speaker submits Yes or No on the web invite page, the existing email confirmation now fans out alongside a short SMS receipt. Four new editable templates (`speakerResponseAcceptedSms`, `speakerResponseDeclinedSms`, `prayerResponseAcceptedSms`, `prayerResponseDeclinedSms`) with per-ward Firestore overrides, mirrored across the server + client defaults per the existing drift-test rule. Honours `fromNumberMode` so testing-number senders still route through the testing proxy. SMS leg failures are logged + swallowed; email remains the source-of-truth notification. (#228)

### Changed

- **SMS reply path — server-driven relay instead of Twilio auto-bridge.** Replaces the speaker's Twilio Conversations SMS-only participant with a server-side relay (`functions/src/twilio/inboundSmsRelay.ts`). Inbound speaker SMS now arrives at the messaging service's `inboundRequestUrl`, the dispatcher inside `onTwilioWebhook` looks up the active invitation by phone (collection-group query on the new `private` subcollection, joined back to each parent for `expiresAt` / `createdAt` / `conversationSid`), and posts the body into the conversation as `speaker:{invitationId}`. The bishop sees a normal speaker-authored chat message; existing fan-out (FCM push, email, etc.) runs unchanged. Removes Twilio's chat→SMS auto-broadcast as a load-bearing path, which sidesteps the speaker-echo bug from #227 and the duplicate bishop-reply SMS that appeared when both auto-bridge and `smsSpeaker` ran. Single endpoint (`onTwilioWebhook`) dispatches by request shape so we stay at 8 Cloud Functions. (#228)
- **Mobile chatbox is fullscreen.** Both the bishop's invitation dialog and the speaker's floating drawer go edge-to-edge on phones (`fixed inset-0`) instead of the prior 85dvh bottom sheet that left ~15dvh of context behind. Drag-down still dismisses; desktop side drawer is unchanged. (#228)
- **Removed the Sunday-card-level needs-apply dot.** The bordeaux dot at the top of each Sunday card was a rollup of "any speaker on this Sunday has a Yes/No that hasn't been Applied yet" — per-speaker chat icons already surface that signal where it's actionable. Drops it from desktop + mobile headers; deletes the now-orphan `useSundayInvitationsSummary` hook. (#229)

### Fixed

- **Speaker SMS replies no longer dropped silently.** Reverted the v0.20.1 `c9dc4a9` "combine speaker participant" attempt — Twilio's API rejects participants that carry both `Identity` and SMS `messagingBinding`, and the catch-block fallback dropped the SMS binding entirely so inbound replies had no participant to attach to. The relay model in this release replaces the auto-bridge entirely, so the underlying constraint no longer matters. Closes #226 and #227. (#228)
- **Unread badge on the speaker row's chat icon now clears.** `useConversationUnread` now listens for both `participantUpdated` and `updatedLastReadMessageIndex` (`@twilio/conversations` 3.x emits the read-horizon self-update on whichever event the build prefers — relying on a single one lost the signal in some 3.x builds). Awaited `setAllMessagesRead` with try/catch + `console.warn` so silent rejections become diagnosable. Extracted the mark-read effect into `useMarkAllRead` to keep `BishopInvitationChat` under the 150-LOC cap. (#229)
- **Emoji reactions restored on both Conversations services.** Granted `editAnyMessage` + `editAnyMessageAttributes` to the default `channel user` role on both the dev and prod Conversations services via the existing `configure-conversation-roles` script. Reactions are stored as message attributes; without these permissions, reacting to another participant's message tripped a Twilio 403. Operational fix, no code change. (#229)

### Infrastructure

- **Twilio inbound-SMS routing isolated dev from prod.** New "Steward Dev Inbound" messaging service (`MG09a6…`) holds the testing number `+12295473216` only, with `inboundRequestUrl` pointing at the dev ngrok tunnel. Production messaging service (`MG0566…`, the existing default) holds `+15873184624` only, with `inboundRequestUrl` set to the prod Cloud Function URL. Inbound replies on the testing number can never accidentally route through prod's Conversations service. Documented in the local Twilio resources memory.
- **`pnpm emulators` optionally launches an ngrok tunnel.** Reads `NGROK_DOMAIN` from `.env.ngrok.local` (gitignored); when set, starts `ngrok http 5001 --domain=$NGROK_DOMAIN` alongside the emulator suite and tears it down via `EXIT/INT/TERM` traps. Without the env var, behaves identically to a bare `firebase emulators:start` so other contributors are unaffected. (#228)
- **Firestore composite collection-group index for the inbound relay.** New index on `private.{speakerPhone, tokenStatus}` backs the relay's lookup query. Migration runbook deploys indexes before functions so the index has finished building when the dispatcher first sees inbound traffic. (#228, #230)
- **One-time SMS-only-participant sweep script.** `pnpm --filter @steward/functions sweep-sms-only-participants` walks every conversation in the configured Conversations service and removes any participant carrying a `messagingBinding` with no `identity`. Run once at the v0.20.2 deploy step (now superseded by the relay model in v0.21.0); idempotent re-runs are no-ops. (#228)
- **Migration: invitation doc split.** `pnpm migrate-invitation-doc-split --project <id>` walks every existing `speakerInvitations/{id}` doc, copies the private fields onto the new auth subdoc, mirrors `responseSummary` to the parent, and deletes the migrated fields from the parent. Idempotent; dry-run by default. Must run once after the v0.21.0 deploy completes. (#230)

## [0.20.1] — 2026-05-01

Same-day follow-up to v0.20.0. Restores SMS bridging that broke under
prod retest after PR #217 — a participant-model bug where the
speaker's chat identity and SMS messagingBinding lived on two
separate Twilio Conversations participants. The split caused the
speaker's web-side Yes/No answer to echo back to their own phone as
SMS, and made every bishop chat reply arrive twice (Twilio native
broadcast plus Steward's wrapped notification SMS). Combined into a
single participant per speaker so Twilio de-dupes correctly. Same
release also refreshes the invitation SMS + email copy to address
the recipient by name and direct replies into the in-app chat
instead of plain SMS.

### Changed

- **Invitation SMS + email copy refreshed** — speakers and prayer
  participants are now greeted by name (`{{speakerName}}`),
  speakers see their topic on the body line (with the project's
  standard "Topic of Choice" fallback when no topic is set), and
  the CTA leads recipients into the in-app chat instead of replying
  via SMS. Lower per-message Twilio cost on back-and-forth replies
  + richer context for the bishopric. Defaults updated server-side
  + on the client mirror in `src/features/templates/utils/`; the
  drift check in `messageTemplates.test.ts` still asserts the two
  sides match.

### Fixed

- **Speaker SMS reply landing in the wrong chat** — Twilio enforces
  uniqueness on `(phone, proxyAddress)` pairs across all active
  conversations, but `cleanupPriorConversations` only cleared
  bindings scoped to the same `(speakerId, meetingDate)`. Repeated
  invites to the same phone with different speakers (family-shared
  phones, test churn) left a stale binding owning the routing —
  inbound SMS replies arrived in the wrong (older) conversation.
  New `freePhoneBindingConflicts` helper walks
  `participantConversations.list({ address })` and removes any
  conflicting binding before the new participant is created.
- **"Yes, I can speak." echoed back to speakers via SMS** — when
  the speaker submitted Yes/No on the web invite page, the chat
  message authored by their chat-identity participant got broadcast
  by Twilio to the SMS-only participant — Twilio couldn't tell
  they were the same human. Speakers received their own answer
  back on their phone. Combined the chat identity and SMS binding
  onto a single participant via the new `addSpeakerParticipant`
  helper; Twilio now suppresses the echo automatically.
- **"Unknown" displayName on SMS-originated messages in the bishop
  chat** — the SMS-only participant carried no `attributes`, so
  the bishop's chat UI couldn't resolve a name for the speaker on
  inbound SMS. The combined participant now carries the
  `displayName` + `role` attributes alongside the binding.
- **Duplicate bishop-reply SMS arriving on the speaker's phone** —
  pre-PR-217 the speaker had no SMS binding, so Steward's
  `smsSpeaker` was the only path for bishop chat messages to reach
  the speaker via SMS. PR-217 changed that — Twilio Conversations
  now natively broadcasts bishop messages to the speaker's
  SMS-bound participant. `smsSpeaker` became a duplicate.
  Removed it from the bishop-reply branch in `onTwilioWebhook`;
  `emailSpeaker` and `pushToBishopric` still run.
  Side effect: Steward no longer rotates the token + sends a
  fresh URL on each bishop reply. Speakers re-enter the chat via
  their original invite URL or the existing rotation self-heal
  (presenting a consumed token triggers a fresh-URL SMS).

### Infrastructure

- **`docs/invitation-flow.md` Phase 7 updated** to reflect the
  Twilio-native SMS bridge (in parallel with the webhook fan-out)
  rather than Steward's prior wrapped-SMS step. Added a note in
  the simplified-out callout describing the combined-participant
  rationale.

## [0.20.0] — 2026-05-01

Security + reliability cycle. Speaker SMS replies now actually bridge
into the bishop's chat (a long-standing wiring gap), the template
editor gains audience tabs and a working invitation email path, and a
batch of Firestore-rule + render-layer hardening lands across the
invitation flow. CI gets a Playwright cache + parallelised rules job
to cut wall-clock time on every PR.

### Added

- **Audience tabs in the template editor** — speaker, prayer, and
  ward-invitee letter templates now share a single editor surface
  with audience tabs across the top, instead of three separate
  routes. Prayer-flow gains parity with the speaker-flow editor:
  same toolbar affordances, same chip behaviour, same revert path.
- **Invitation email template revived** — the bishop-side invitation
  email path is back as a first-class template the bishop can
  customise alongside the SMS one.

### Changed

- **Simplified template editors** — Lucide icons replace the bespoke
  toolbar SVGs; the inline preview lives directly under the editor
  (no separate pane); mobile gets a sticky top-bar action layout.
  Drops the floating selection toolbar from the inline editor — its
  affordances now live on the always-visible top toolbar instead.

### Fixed

- **Speaker SMS replies now bridge into the bishop's chat.** A
  long-standing wiring gap in `freshInvitation` meant speakers had a
  chat-identity participant on their Twilio Conversation but no
  phone-number messagingBinding — every inbound SMS reply was
  dropped silently because Twilio had nothing to match against. The
  call to `addSmsParticipant` is now wired in alongside the existing
  chat-identity creation, with fail-soft behaviour on Twilio errors.
  Pre-existing in-flight invitations are not auto-fixed; a fresh
  resend creates the missing binding.
- **Portal chat-variable tooltip floats above the toolbar** — the
  variable-chip explainer no longer gets clipped by the toolbar
  surface above it.

### Security

- **Tightened Firestore rules on the invitation update path.**
  `response.acknowledgedAt` is now write-once across both the
  bishopric and speaker-claim branches — once any active member
  sets it, subsequent writes can't change or clear it. Speaker-
  claim writes that touch the response subtree now pin
  `actorUid` to `request.auth.uid` and only accept `actorEmail`
  matching the auth token's verified email. Speaker writes are
  also gated by `tokenExpiresAt` (defence-in-depth alongside the
  meeting-level `expiresAt` wall).
- **Speaker session revoked on bishop-driven token rotation.**
  When the bishop rotates an invitation's capability token, prior
  Firebase refresh tokens for the speaker are revoked — a session
  minted from the old token can no longer keep writing past the
  next ID-token refresh.
- **Lexical letter renderer allowlists URL schemes + style
  properties.** `renderLink` accepts only `http(s)://` and same-
  origin paths (drops `javascript:`, `data:`, protocol-relative,
  and the rest); `renderImage` adds raster `data:image` to that
  list and excludes SVG. Inline `style=` declarations narrow to
  `color`, `backgroundColor`, `fontSize`, `fontFamily` — the set
  the WYSIWYG toolbar emits today; legitimate CSS function values
  like `rgb(...)` and `var(...)` still pass through.
- **Optional `TWILIO_MESSAGING_SERVICE_SID` for outbound SMS.**
  When set, production-mode `sendSmsDirect` calls route through
  the Messaging Service (and its sender pool) instead of the raw
  `TWILIO_FROM_NUMBER`. Lets the service-level "Disable Inbound
  and Outbound Message Body Logging" toggle apply, bounding the
  lifetime of any logged invitation URL in Twilio's retained logs.
  Backwards-compatible — environments without the secret keep the
  prior raw-from behaviour.
- **Optional `TWILIO_WEBHOOK_URL` for pinning the signing URL.**
  The Twilio Conversations webhook signature-verification path
  pins the URL passed to `validateRequest` to this secret when
  set, eliminating host-header drift as a silent failure mode
  (region change, custom-domain swap, unexpected `Host:` header).
  Verification logic extracted into a pure helper that emits
  structured `twilio.webhook.signature_failed` log entries with
  a `reason` label — `missing-header`, `missing-auth-token`, or
  `invalid` — for Cloud Logging metric + alarm.

### Infrastructure

- **CI Playwright browser cache + parallel rules job.**
  `~/.cache/ms-playwright` is cached keyed on `pnpm-lock.yaml`; on
  hit, the ~150MB chromium download is skipped and only system
  apt deps install. Rules tests (Java 21 + Firebase emulator)
  moved into their own job to parallelise with the build/e2e
  critical path. Saves 30–60s per run.
- **Branch protection on `develop` and `main`** — required CI
  status checks (lint/format/typecheck/test/build/e2e, rules,
  functions); admin bypass on for solo-dev workflow;
  force-pushes and branch deletion blocked.
- **Invitation-flow documentation** — new
  [docs/invitation-flow.md](docs/invitation-flow.md) covers the
  speaker/prayer chat pipeline (bishopric flowchart + engineering
  sequence diagram); paired `invitation-flow-doc-sync` agent skill
  + a `PostToolUse` hook that nudges contributors to update the
  doc when editing files in the invitation flow surface area.
- **`*.local.md` gitignore pattern** — local-only working notes
  (private trackers, scratch notes) stay on disk without
  accidentally landing in commits.

### Operator runbook (post-merge actions)

The `TWILIO_MESSAGING_SERVICE_SID` and `TWILIO_WEBHOOK_URL` secrets
must be set on the deployed project to activate the new code paths.
The release workflow handles the deploy; the operator handles the
secrets:

```bash
firebase functions:secrets:set TWILIO_MESSAGING_SERVICE_SID --project steward-prod-65a36
firebase functions:secrets:set TWILIO_WEBHOOK_URL --project steward-prod-65a36
```

Without them, the functions fall back to prior behaviour (raw
`from` number for SMS; constructed signing URL for the webhook).

## [0.19.0] — 2026-04-30

iOS-parity port, continued. The web app now exposes a view-only embed
of the prepare-invitation letter so the iOS app can WKWebView the
exact rendered preview, with a JS bridge the host calls to export the
on-page letter as a PDF for the share sheet. Prepare Invitation gets
a Send-CTA-in-header treatment and edge-to-edge toolbar matching the
iOS layout, with a guard against sending before the letter state has
hydrated. The per-row Assign + Invite flow gains a manual status menu
that locks the form whenever the slot is past `planned`, and prayer
quick-confirms now mirror back onto the meeting doc so they print
correctly. Several quality-of-life fixes: portal-anchored status
dropdown, deferred cache-miss in `useDocSnapshot`, "Topic of Choice"
fallback, standardized "Opening Prayer" / "Closing Prayer" copy.

### Added

- **iOS WebView embed of the prepare-invitation letter** — both
  prepare routes (speaker + prayer) accept `?embed=ios` to render a
  chromeless, view-only copy of the letter for the iOS app to
  WKWebView. Auth piggy-backs on a Firebase custom token minted by
  the existing `issueSpeakerSession` callable's bishopric branch
  (opt-in `mintWebSession: true`), passed through the URL fragment
  so it never hits server logs and is scrubbed from the address bar
  after sign-in. Native pinch/zoom/pan via the existing
  react-zoom-pan-pinch wrapper.
- **iOS share-PDF bridge** — `useEmbedShareBridge` installs
  `window.__ios_exportLetterPdf` while the embed is mounted; the iOS
  host calls it via `evaluateJavaScript` to rasterize the on-page
  `PrintOnlyLetter` portal into a base64 PDF (same `letterCanvasToPdf`
  pipeline the speaker-side ShareToolbar uses). `AuthGate` detects
  `?embed=ios` and renders `<Outlet />` directly, skipping the
  sign-out redirect, access-resolution screens, and AppShell wrapper
  so chrome doesn't bleed into the chromeless letter view.
- **Manual status menu on the per-row Assign pages and schedule
  rows** — the existing `SpeakerStatusMenu` is now reachable from
  `AssignSlotForm` and from each `SpeakerRow` / `PrayerRow` on the
  schedule (the row body's `<Link>` is kept separate so opening the
  menu doesn't navigate). Wires into the existing `updateSpeaker` /
  `upsertPrayerParticipant` audit paths; flipping back to "planned"
  auto-unlocks the form. Prayer side gains a "Remove" verb +
  `clearPrayerParticipant` action that deletes the participant doc
  and clears the inline meeting mirror, symmetric with `deleteSpeaker`.

### Changed

- **Send-CTA-in-header + edge-to-edge toolbar on Prepare Invitation
  pages** — both speaker and prayer prepare pages now place the action
  bar in the sticky page header at every breakpoint, with Send
  promoted to a labeled bordeaux-primary "Send Invitation" button
  matching iOS `InvitationPreviewView`. The floating absolute toolbar
  that overlapped the editor is gone, and horizontal padding around
  the editor surface is dropped so the page-editor toolbar's bottom
  border runs edge-to-edge. The send path refuses to write a snapshot
  before `letterStateJson` hydrates, preventing chrome-less invitations
  from being delivered.
- **Prepare Invitation toolbar overhaul** — Lucide icons replace the
  bespoke SVGs; the standalone Print button is gone (Share now hands
  the letter PDF to the OS share sheet via the same Web Share API
  path the speaker invite landing uses). The mark-invited (Check)
  button is removed entirely — status changes now flow exclusively
  through the new status menu on the assign page. Send Email becomes
  the secondary text button; Send SMS becomes the primary
  bordeaux-fill text button (with paper-plane icon) — order swapped
  to prioritize SMS as the more common bishop hand-off channel. All
  buttons normalized to `h-9 sm:h-10`.
- **Locked-form rules on Assign pages** — the assign form locks
  whenever `seed.status != "planned"`: inputs go read-only, Save /
  Continue hide, and a "Locked" notice points to the destructive
  button as the only escape. Prepare Invitation pages now navigate
  same-window instead of opening a new tab; the success screen
  routes to /schedule.
- **"Topic of Choice" fallback when a speaker has no topic** —
  every surface that renders a speaker's topic line now shows
  "Topic of Choice" (matching the iOS app since launch) instead of
  the previous mix of "No topic assigned" / blank / bare-name
  rendering. Affects the meetings program editor, schedule view,
  and the print pipeline's template tokens.
- **Standardized "Opening Prayer" / "Closing Prayer" copy** —
  bishopric-facing surfaces (schedule rows, prayer assignment pages,
  prepare-invitation header, print copies, readiness + history
  formatters, prayer letter variables, prayer SMS body, chat
  launcher) now uniformly read Title Case "Opening Prayer" /
  "Closing Prayer" instead of the mixed
  "Invocation" / "Benediction" / lowercase phrasing. Receipt emails
  follow suit (`invitationPrayerType` returns "closing prayer" not
  "benediction"); the `prayerType` template variable resolves to
  lowercase "opening prayer" / "closing prayer" for sentence fits.
- **Compact mobile schedule edges** — `MobileScheduleList` swaps its
  inner `px-4` for `-mx-2` so cards bleed past the AppShell's 16px
  padding to ~8px from the screen edge; `PageHead`'s bottom border
  is gated behind `sm:` so the mobile schedule no longer draws a
  separator between the page header and the first card.

### Fixed

- **Status dropdown on the mobile schedule no longer clipped** —
  `SpeakerStatusMenu`'s `<ul>` is now portaled to `document.body`
  and fixed-anchored to the badge's bounding-client rect (recomputed
  on scroll + resize), so the menu escapes any `overflow:hidden`
  ancestor (the rounded card surface that was eating the dropdown
  to a sliver). Near-right-edge case anchors by `right` instead of
  `left` so the menu stays on-screen.
- **`useDocSnapshot` no longer hangs on genuinely-missing docs** —
  the previous "skip the cache-miss fire" guard meant paths that
  legitimately don't exist (e.g. an unfilled prayer participant
  slot) sat at "Loading…" forever when the server-confirmed
  `fromCache: false` fire never arrived. Cache misses are now
  deferred 1.5s instead of skipped — a server fire within the
  window supersedes the miss; otherwise the miss is treated as
  authoritative and loading resolves to `{ data: null, loading:
  false }`. Covered by four new unit tests.
- **Speaker yes-reply now mirrors prayer-confirmed onto the
  meeting doc** — `applyResponseToSpeaker` previously flipped the
  participant doc's status but never touched
  `meeting.{role}.confirmed` for prayers, so a speaker-driven
  prayer confirmation never made it onto the printed program. Now
  batches a `setDoc(merge)` that mirrors `confirmed=(status ===
  "confirmed")` for the matching `openingPrayer` / `benediction`
  field.
- **Server-side participant stamping for fresh invitations** —
  `createFreshInvitation` now writes `participant.status="invited"`
  + audit stamps + `invitationId` / `conversationSid` (and, for
  prayers, the inline meeting role mirror) inside the call. Fixes
  the iOS/web closing-prayer divergence where the status flip only
  happened in whichever client did the post-send upsert, leaving
  the participant doc stale for clients that skipped that step.
- **Assigned Sunday callout renders in saved / PDF / embed paths**
  — the Lexical static walker was returning `null` for the
  `assigned-sunday-callout` node, so the gradient brass callout
  disappeared everywhere the snapshot is read (speaker invite
  landing, PDF/print preview, iOS WebView embed). The walker now
  threads `assignedDate` through `renderLetterState` and emits the
  same markup as the live decorator.
- **`PrintOnlyLetter` portal mounts unconditionally** — the
  embed's portal was previously gated on `form.hydrated`, so the
  iOS share bridge could throw "portal not mounted" when the host
  invoked the export before the letter finished hydrating.
- **Prepare-invitation success screen routes back to /schedule**
  — same-window navigation replaces the previous "try to close the
  tab" path, which silently failed in any non-popup context.

### Infrastructure

- **`scripts/sweep-orphan-invitations.ts`** — clears stale
  `speakerInvitations/*` docs left behind by prior sends. Dry-run
  by default; `--commit` to delete.
- **Emulator-restart helper** — `kill-emulators.sh` force-stops
  the local Firebase emulator suite by matching command-line
  patterns (firebase CLI, cloud-firestore-emulator, pubsub-
  emulator, firebase-tools binary), wired in via the `preemulators`
  npm hook so `pnpm emulators` always starts from a clean slate.
  Solves the recurring "Could not start Emulator UI, port taken"
  error when a previous emulator process didn't shut down
  cleanly. Earlier port-based kill swept up unrelated macOS
  launchd services; this version is scoped strictly to Firebase
  processes.
- **`pnpm bootstrap-ward:emulator`** — wrapper that bakes in the
  `FIRESTORE_EMULATOR_HOST` / `FIREBASE_AUTH_EMULATOR_HOST` /
  `GCLOUD_PROJECT=steward-dev-5e4dc` env vars so the Admin SDK
  routes to the local emulator instead of falling through to
  Application Default Credentials and trying to hit production
  identitytoolkit. Adds a `--bishop-password` flag (default
  `test1234`) so the bishop can sign in via the emulator-only
  email/password form.
- **CI format check unblocked** — apply biome formatter sweep over
  six files with trailing-whitespace / line-wrap deltas. No
  behavior changes.

## [0.18.0] — 2026-04-30

An iOS-parity port: native-iOS interaction wins land back in the PWA.
The biggest piece is the wholesale replacement of the multi-step Plan
Speakers/Prayers wizard with a per-row Assign + Invite flow — the
schedule rows themselves are now the entry point. Chat gains
long-press bubble reactions, kind-aware quick-response copy for
prayer assignments, a 24-hour edit/delete window, and a tombstone
notice when messages are removed. Mobile schedule gets a hero
treatment, jump-back button, status dots, and chalk card surfaces.

### Added

- **Per-row Assign + Invite flow** — every empty or filled speaker
  and prayer row on the schedule is the entry point for assigning
  that slot. Empty rows render a tappable Assign pill ("Assign
  Speaker", "Assign Opening Prayer", "Assign Closing Prayer"); tap
  opens a single-screen `AssignSlotForm`. Continue persists and
  routes to `/prepare` for invite send (Send Email / Send SMS /
  Print / Mark Invited toolbar); Save as Planned commits without
  inviting and returns to /schedule. Edit-mode exposes Delete with
  the existing type-to-confirm dialog. New routes:
  `/week/:date/speaker/new/assign`, `/week/:date/speaker/:id/assign`,
  `/week/:date/prayer/:role/assign`.
- **Chat-bubble reactions** — long-press a chat bubble to surface a
  reaction palette (👍 ❤️ 🙏 ✅ 😊 😮); tap to toggle. Chips render
  overlapping the bubble's bottom edge with bg-chalk + drop shadow,
  count if > 1, viewer's own reactions get a tinted ring. Reactions
  are stored as Twilio message attributes under the `reactions` key
  and are pure metadata — a reacted message is still subject to the
  usual edit/delete rules.
- **Hero card on mobile schedule** — first card gets a bordeaux
  uppercase eyebrow above the date, larger date typography, and a
  kind-aware "X of Y confirmed" rollup line beneath. 1.5pt bordeaux
  stroke replaces the muted walnut border.
- **Floating jump-back button** on mobile — Messages-style 52px
  circle fades in bottom-center when the hero scrolls out of view.
  Tap → smooth scroll to hero. Earns its weight on the 16-week
  horizon when the bishop scrolls down to plan a future Sunday.
- **Status indicator dots on mobile rows** — 8px tinted dot on
  speaker + prayer rows below `md`; desktop keeps the uppercase
  mono pill. ARIA label preserves the status word for screen
  readers.
- **Chalk card surfaces between mobile meeting blocks** — each
  `MobileSundayBlock` wraps in `bg-chalk border rounded-lg
  shadow-elev-1` so meetings read as discrete cards. The previous
  sticky parchment date strip is gone — the card edge is the
  per-meeting anchor.
- **Status menu in chat** — replaces the 4-segment status pill
  strip with a tappable badge that opens a 4-item dropdown
  (checkmark on active, destructive styling on Mark as Declined).
  Friction transitions still gate through `computeConfirmCopy`.
- **Tombstone notice on message deletion** — after a successful
  Twilio message remove, a centered "Message removed by X · Apr 28"
  system message is posted to the thread (kind: `message-deleted`).
  Both bishop and speaker delete paths post tombstones; the
  tombstone itself can't be re-deleted.
- **Inline status banner** — `InvitationStatusBanner` drops the
  full-bleed tone fill. The status badge sits inline with the
  message text on a single row; reason quote, last-seen, and
  provenance lines render only when present, each on its own row;
  Apply CTA gets its own right-aligned row.

### Changed

- **Wizard replaced by per-row flow** — the multi-step Plan
  Speakers / Plan Prayers wizard is removed entirely (routes
  `/plan/:date` and `/plan/:date/prayers`, plus the
  `src/features/plan-speakers/` and `src/features/plan-prayers/`
  directories). Per-row commits one slot at a time; multi-row
  batch save is sunset. The "Plan speakers / Plan prayers" link
  cluster is gone from `SundayCardBody` / `SundayCardSpecial`,
  and the kebab-menu Plan-actions section is dropped from
  `SundayMenuOptions`. Resend semantics are preserved via
  `InvitationLinkActions` inside the chat drawer.
- **Message edit/delete window 30m → 24h** — covers "I just
  realized I sent the wrong date" without enabling rewriting last
  week's history. The recent-5 same-side cap stays as the
  structural guard against selective deep-history rewriting.
- **Quick-response copy is kind-aware** — speaker prompts read
  "Can you speak on…" / "Yes, I can speak"; prayer prompts read
  "Can you offer the [opening / closing] prayer on…" / "Yes, I
  can offer the prayer". Decline copy stays kind-agnostic. Affects
  the live UI and the audit trail (Twilio body lives forever on
  both sides).
- **Stake / General cards drop OP & CP rows** — the centered
  stamp alone communicates "no local program"; empty prayer rows
  confused the bishop. Fast Sunday keeps both rows.
- **PrayerRow drops the leading "OP / CP" tag** — the role label
  ("Invocation" / "Closing Prayer") is now the italic-serif
  subtitle under the name, mirroring `SpeakerRow`'s name + topic
  line.
- **Compact mobile date badge** — `kindLabel.compact` carries
  "Stake Conf." / "General Conf." / "Fast Sun." so the date
  headline stays on one line at phone widths; desktop reads
  `kind.badge` as before.
- **Reaction popover is one capsule** — emoji palette + icon-only
  Edit / Delete actions with a thin vertical divider, replacing
  the earlier stacked palette + actions-card layout.

### Fixed

- **Cross-author reactions no longer fail with "User unauthorized
  for command"** — the `configure-conversation-roles` script now
  grants `editAnyMessageAttributes` (alongside the previously
  granted `editAnyMessage`). Twilio splits body edits and
  attribute edits into separate permissions; the reaction toggle
  is a `setAttributes` call. The script is idempotent but needs
  to be re-run against any service that already had the prior
  version applied.
- **Prayer-flavoured quick-response copy** for prayer slots
  (previously every kind got speaker-flavoured "Yes, I can speak"
  copy — misleading on the live UI and worse in the chat history).

### Infrastructure

- **CI on develop unblocked** — clear 8 oxlint max-lines + sort
  errors that surfaced when the rules tightened. Pure refactors
  extracting `BubbleActionsIcons`, `ReactionChips`, `BubbleSurface`,
  `ThreadItemList`, and `useSpeakerChatLifecycle`; no behaviour
  change.

## [0.17.0] — 2026-04-27

A native-feel pass on navigation. Mobile gets iOS-style stacked page
transitions — Schedule sits at the base of the stack, and any other
page (Week, settings) slides on top from the right; the browser back
gesture slides it back off. The user-menu destinations (Profile,
Notifications, Ward settings, Templates) become full-screen modal
pages with a sliver-style app bar that collapses smoothly as you
scroll. Schedule remembers its scroll position when you open and
dismiss a modal.

### Added

- **Native-stack page transitions** on mobile — built on React
  Router v7's View Transitions integration. A wrapper around
  `Link`/`useNavigate` (`@/lib/nav`) sets a `data-nav-direction`
  attribute synchronously on every navigation; CSS keyframes keyed
  off that attribute drive a slide-from-right (push) and
  slide-to-right (pop). A `popstate` listener catches the browser
  back button and iOS swipe-back. Desktop and `prefers-reduced-motion`
  fall back to instant swaps with zero snapshot overhead.
- **Full-screen modal layout** for user-menu pages — Profile,
  Notifications, Ward settings, and Templates move out of `AppShell`
  into a new `ModalPage` route layout with no Topbar. Settings now
  feel like overlays sitting on top of Schedule rather than peer
  pages with the same chrome.
- **Sliver-style `AppBar`** on every modal page — large hero
  (eyebrow + title + description) in normal flow with a 48px
  compact bar (back arrow + small centered title) sticky at the top.
  As the hero scrolls under the bar, the small title and a hairline
  cross-fade in. Animation is opacity-only, GPU-composited, driven
  by a rAF-throttled scroll handler reading the sentinel's viewport
  position — no layout reflow per frame.
- **Schedule scroll restoration** — `useScrollRestore` saves the
  scroll position to `sessionStorage` on unmount and restores on
  mount. Auto-detects the right scroll source (AppShell's inner
  container on desktop, window on mobile). Opening a modal and
  dismissing back to Schedule lands you at the same Sunday you left.

### Changed

- **Settings index `/settings` is no longer in-shell** — the legacy
  redirect remains, but the four leaf pages route through the modal
  layout instead of nesting under the AppShell topbar.

## [0.16.1] — 2026-04-27

A polish-pass release on top of v0.16.0. Two layout fixes — desktop
scrollbar tucking, and the OS keyboard breaking the chat drawers —
a horizon-dropdown cleanup, a secrets-hygiene pass, and the desktop
side-drawer treatment for bishop conversations.

### Changed

- **Desktop chat drawers slide in from the right** instead of
  centering as a bottom-anchored modal — the speaker's letter or
  schedule context behind the drawer stays glanceable while the
  bishop composes a reply.
- **Horizon dropdown speaks in weeks**, with the mobile cap aligned
  to 16 weeks so the dropdown matches the infinite-scroll ceiling.

### Fixed

- **OS keyboard no longer pushes the chat drawer upward** on mobile.
  `interactive-widget=resizes-content` was silently disabling vaul's
  `visualViewport`-based keyboard handler; removing it lets vaul pin
  the drawer's bottom edge just above the keyboard while keeping the
  top anchored, instead of compressing the whole drawer via `dvh`.
- **Desktop scrollbar tucks behind the topbar** instead of overlaying
  it, restoring the polished edge on wide viewports.

### Security

- Dev-mode email allowlist moved out of the bundle and into env vars;
  references to specific addresses scrubbed from the repo.

## [0.16.0] — 2026-04-27

A mobile-first pass on the schedule plus a project-wide structural
reorg. The schedule list, every dropdown, and the user menu all get
proper phone treatment — drag-to-dismiss bottom sheets, a full-height
side drawer, infinite-scroll horizon, and a darkened app bar. Under
the hood, every feature directory is now organized as `hooks/ +
utils/ + __tests__/`, every overlay surface runs on `vaul`, and the
per-component-folder discipline is codified as a project skill.

### Added

- **Mobile schedule list view** — below `md`, the Sunday cards
  collapse into an edge-to-edge list with sticky per-Sunday date
  rows. Reuses real `SpeakerRow` / `PrayerRow` components for the
  fixed 4 speaker + 2 prayer slots so density matches the desktop
  card. New `MobileScheduleList`, `MobileSundayBlock`,
  `MobileSundayBody`. Special meetings (fast / stake / general) and
  cancelled meetings render their existing variants edge-to-edge.
- **Infinite-scroll horizon on mobile** — `useInfiniteHorizon` hook
  drives the load-more behavior: 4 weeks initial, 4 more on each
  intersection-observer trigger (200 px pre-roll, 450 ms delay with a
  "Loading…" indicator). Capped at 4 months; bottom of list reads
  "Showing up to 4 months ahead" once reached. Desktop dropdown
  options match the new ceiling (1/2/3/4 months — 6/12 month options
  retired).
- **Bottom sheets for the per-Sunday menu and horizon select**
  (mobile) — both run on a new `MobileBottomSheet` primitive backed
  by `vaul`. Drag the handle down to dismiss, ESC to close, backdrop
  tap to close. Sunday menu sheet header reads `1st Sunday · May 3
  · In 6 days` so the user always knows which week they're editing.
  "Plan speakers" / "Plan prayers" actions move into the menu so
  they're discoverable regardless of slot fill state.
- **Mobile right-side user menu drawer** — `UserSideDrawer`
  (`vaul direction="right"`) replaces the old corner popover on
  phone-class viewports. Avatar bumps to 64×64 stacked above name
  and email; X close button absolute top-right; built-by-credit +
  version pinned bottom-center. Desktop popover unchanged.
- **Darker mobile app bar** — `Topbar` switches to `bg-walnut` on
  mobile with light-text overrides on the ward name and user-menu
  trigger, plus a subtle `shadow-elev-1` drop shadow on both layouts.

### Changed

- **All overlay surfaces now use [`vaul`](https://vaul.emilkowal.ski/)**
  for animation + gesture handling. `MobileBottomSheet`,
  `BishopInvitationDialog`, `SpeakerChatFloatingDrawer`, and
  `UserSideDrawer` all share the same drag-to-dismiss + spring-easing
  + body-scroll-lock behavior. Net ~250 lines of hand-rolled
  mount/exit/animation state machines deleted.
- **Per-component-folder discipline codified** —
  `.claude/skills/project-structure.md` defines the convention:
  components live as flat `.tsx` at the feature root by default and
  get promoted to a folder (`Component/{index.tsx, Component.tsx,
  hooks?, __tests__?}`) only when they grow component-private hooks
  or tests. CLAUDE.md adds a hard-rule line linking to the skill.
- **Bulk feature reorg** — every `src/features/<feature>/` is now
  `<feature>/{hooks/, utils/, __tests__/, ...components.tsx}`.
  Sub-features (`meetings/program/`, `page-editor/{nodes,plugins,
  toolbar}/`, `program-templates/nodes/`) follow the same pattern
  recursively. ~313 files touched, mostly renames; ~7 components
  promoted to folders because they have tests (e.g. `SundayCard`,
  `HorizonSelect`, `PrepareInvitationActionBar`,
  `VariableChipNode`, `Avatar`).
- **Routes reorg** — `app/routes/<kebab-name>.tsx` →
  `app/routes/<kebab-name>/{index.tsx, <RouteComponent>.tsx}`. Folder
  names stay kebab (URL-shaped); component file inside is PascalCase.
  Sub-components specific to a route move into the route folder
  (e.g. `invite-speaker/` houses `SpeakerChatFloatingDrawer`,
  `SessionGate`, etc.).
- **`callingLabels` promoted to `src/lib/`** — was at
  `features/settings/`, now imported by 5 cross-feature consumers
  via `@/lib/callingLabels`.
- **Seven single-feature hooks demoted from `src/hooks/`** —
  `useComments`, `useHistory`, `useLongPress`, `useMinuteTick`,
  `useUpcomingMeetings` now live in their feature's `hooks/`;
  `useHideOnScroll` moved to `app/components/hooks/`;
  `useMemberProfileSync` moved to `app/hooks/`.

### Fixed

- **Sticky week header was binding to a non-viewport scroll context**
  on mobile — both `will-change: transform` and `overflow-x: hidden`
  on the AppShell wrapper were silently turning ancestors into
  containing blocks for sticky descendants. Removed the former and
  switched the latter to `overflow-x: clip` (later removed entirely).
- **HorizonSelect popover was being covered by sticky list rows** —
  popover was at `z-10` (same as the sticky row), bumped to `z-30`.
- **Open/close sheet flicker** — pinned `animation-fill-mode:
  backwards` on entrance and `forwards` on exit so the browser
  doesn't snap to default opacity for a single frame between mount
  and animation start (or between animation end and unmount).
  Eventually superseded by the move to `vaul`.
- **`MobileBottomSheet` was getting trapped inside a sticky row**
  whose `backdrop-blur-sm` re-rooted `position: fixed` against it —
  portal the sheet to `document.body` so it always anchors to the
  viewport.

### Infrastructure

- **`vaul` added** (`v1.1.2`) — drag-to-dismiss + spring-easing
  drawer primitive. Replaces hand-rolled animation state machines
  in 4 surfaces.
- **Removed unused `useCommentUnread` hook** — zero importers.

### Removed

- Custom `drawerSlideInRight` / `drawerSlideOutRight` keyframes
  (replaced by vaul-driven animations).

## [0.15.0] — 2026-04-27

Plan-prayers wizard finally mirrors the speaker wizard 1:1, so the
bishop walks Opening + Benediction prayer-givers through the same
Roster → Invitations → Summary flow used for speakers. The Sunday
schedule grid gets a uniform-roster layout, prayer rows get a
dedicated letter template, and the mobile app shell auto-hides its
topbar on scroll. Plus a workflow rule against stacked PRs after a
13-commit chain stranded behind a deleted parent branch.

### Added

- **Full plan-prayers wizard at `/plan/:date/prayers`** (#178) — 3-step
  flow that mirrors `PlanSpeakersWizard` 1:1: same header chrome, same
  step keys (`roster | invitations | summary`), same per-participant
  sub-step flow (action picker → letter review → optional post-print
  confirm). New `src/features/plan-prayers/` module with
  `PlanPrayersWizard`, `PrayerRosterStep`, `PrayerActionPicker`,
  `PrayerInvitationStep`, `ReviewPrayerLetterStep`, `PrayerSummaryStep`,
  plus `usePrayerWizardActions`, `useReviewPrayerLetterAction`, and
  `usePrayerParticipants`. Reuses `WizardHeader`, `WizardFooter`,
  `ReviewLetterFooter`, `PostPrintConfirmStep`, and `SpeakerStatusChip`
  from the speaker wizard so step labels render identically. Retires
  the legacy single-page `PlanPrayersPage`. Differences from the
  speaker wizard: fixed 2-slot roster (no "+ Add another"), no
  `{{topic}}` (uses `{{prayerType}}`), no `MissingContactPrompt` (the
  roster step front-loads contact collection).
- **Dedicated prayer letter template** (#178) — separate
  `prayerLetterTemplate` ward doc + editor route alongside the
  speaker letter template, instead of reusing the speaker template
  for prayer invitations.
- **Prayer chat parity on schedule + week** (#178) — prayer rows now
  surface the same per-participant chat icon + unread badge that
  speaker rows do.
- **Mobile auto-hide topbar** (#178) — new `useHideOnScroll` hook +
  AppShell wiring; the topbar slides out of view on downward scroll
  and reappears on scroll-up, recovering vertical real estate on
  small viewports.

### Changed

- **Uniform Sunday-card roster shape on `/schedule`** (#178) — every
  card now reserves up to 4 speaker rows + 2 prayer rows so the grid
  reads as a uniform set instead of stretching/squeezing per Sunday.
  Empty slots render as a shared `EmptyRosterRow` (mono-brass label +
  "Not assigned" italic) at pixel-for-pixel the same height as a
  populated row, minus the chip / chat launcher. `SundayCardBody`
  drops the legacy "No speakers yet." paragraph fallback.
- **Schedule roster rows are now a fixed 64px tall** (#178) with the
  speaker name + topic restored as a stacked block. Special meeting
  cards (fast / stake / general) match the height and now render their
  prayer rows so the layout doesn't collapse on those weeks. The
  lead-time warning banner is silenced on the schedule grid; the
  prayer status pill always shows.

### Infrastructure

- **No-stacked-PRs hard rule** (#179) — every PR's base must be
  `develop` (or `main` for a release PR), never another feature branch.
  Codified in `CLAUDE.md` and the `feature-branch-workflow` skill after
  PR #173 (closed, base branch deleted) stranded a 13-commit chain
  outside `develop` for a full release cycle, including the
  merged-but-orphaned PR #175 plan-prayers wizard. Recovered via
  PR #178; the rule prevents recurrence.

## [0.14.0] — 2026-04-27

Prayer-giver invitations land end-to-end: the bishop can now invite
opening + closing prayer participants through the same Twilio
Conversation + capability-token pipeline used for speakers, with
role-appropriate copy on every surface. Plus three speaker-invite UX
upgrades and a small personal touch on the app shell.

### Added

- **Prayer-giver invitations (#168, #169, #170).** New
  `wards/{wardId}/meetings/{date}/prayers/{role}` subcollection +
  rules block, a `kind: "speaker" | "prayer"` discriminator on
  `sendSpeakerInvitation` + `onInvitationWrite`, and four new
  prayer-keyed message templates (`prayerInitialInvitationSms`,
  `prayerResponseAccepted`, `prayerResponseDeclined`,
  `prayerBishopricResponseReceipt`). The eight-Cloud-Function rule
  holds — we extended the existing functions instead of adding new
  ones. UI lands inline on the meeting editor's Prayers section: each
  row shows a status chip + Invite/Resend link once a name is typed,
  opening a dedicated `/week/:date/prayer/:role/prepare` page with the
  full-screen letter editor + Send / Send SMS / Mark invited / Print
  toolbar. The speaker landing page reads `invitation.kind` and
  flips its CTA + response banners to "Please reply to the prayer
  invitation" when appropriate. For now both prayer slots reuse the
  speaker letter template; a dedicated `prayerLetterTemplate` ward
  doc + editor route lands in a follow-up.
- **Share-as-PDF button on the speaker invite page.** Speakers tap a
  share icon that renders the resolved letter to a paginated 8.5×11
  PDF and hands it to `navigator.share({ files })` (Web Share API on
  iOS / Android / Edge / Safari) with a download fallback on Firefox
  / older desktops. Reuses the same `letterCanvasToPdf` +
  `shareLetterPdf` strategy as the bishop-side wizard, so the
  speaker's saved PDF is pixel-for-pixel identical. Toolbar shifts
  from `top-4` → `top-16` with a 200ms transition when the
  reply/unread CTA banner is visible, avoiding overlap.
- **Personal developer credit** on the app shell + invite pages. A
  tiny italic-serif "This app was built with love and prayer, by
  Oriel Absin." line sourced from a single shared component, visible
  on every authenticated bishopric route, below the `/accept-invite`
  card, and at the bottom of the speaker chat drawer. `print:hidden`
  keeps it out of printed programs and shared letter PDFs.

### Changed

- **Speaker chat drawer is now a bottom-sheet on mobile, docked panel
  on desktop.** On phone-class viewports the drawer slides up as an
  85dvh sheet with rounded top corners and a grab-handle pill,
  leaving the top of the letter peeking above so the speaker keeps
  spatial context. Desktop (`sm+`) is unchanged: bottom-right docked
  panel at `max-w-105` / `80dvh`, all corners rounded, no entrance
  animation. New `drawerSlideUp` keyframe scoped to mobile via
  `sm:animate-none`.

### Fixed

- **AssignRow's stray dashed bottom border on `lg+`** in the meeting
  editor's Prayers + Speakers sections. The dashed line under the
  Invite link, the inter-row dashed border, and AssignRow's bottom
  border are all dropped on large viewports where they were creating
  visual noise inside the multi-column layout.

## [0.13.1] — 2026-04-27

Hotfix for the v0.13.0 PDF share path: the bishop tapping "Share or
print letter" on a real letter threw two stacked errors. Both fixed.

### Fixed

- **`'Attempting to parse an unsupported color function "oklab"'`** —
  upstream `html2canvas` can't parse Tailwind v4's modern colour
  functions (`oklch`, `oklab`, `color-mix`). Swapped to the
  maintained `html2canvas-pro` fork, drop-in replacement.

- **`'image argument is a canvas element with a width or height of 0'`**
  — the `PrintOnlyLetter` portal is `display: none` on screen so the
  print path can rely on it; html2canvas-pro therefore snapshotted a
  0×0 canvas and the slice `drawImage` rejected it. Now the portal
  is parked off-screen (position: fixed; left: -100000px) for the
  duration of the capture, then its inline styles restored.

## [0.13.0] — 2026-04-27

Wizard's Print & hand-deliver path now generates a PDF and routes it
through the OS share sheet, so the bishop can hand a letter off via
iMessage / WhatsApp / AirDrop / Mail / Files instead of an actual
printer. Plus a mobile-polish fix on the fixed bottom bars and a new
maintainer-only Twilio testing FROM number.

### Added

- **PDF share on the wizard's deliver path.** The wizard step 2's
  "Print & hand-deliver" CTA is now "Share or print letter" — it
  generates a paginated 8.5×11 PDF of the resolved letter (chip
  styling, signature, letterhead intact) and hands it to
  `navigator.share({ files })` on iOS / Android / Chrome / Edge /
  Safari, falling back to a plain download on Firefox / older
  desktops. The PDF carries no capability link, so the fake-response
  surface stays closed. The post-deliver confirm copy softens to
  "Did you deliver this letter?" since delivery is no longer always
  physical.
- **Maintainer-only "testing" outbound SMS number.** A new
  `TWILIO_FROM_NUMBER_TESTING` secret + per-invitation toggle let
  allowlisted callers (configured via `DEV_MODE_EMAILS`) send an
  invitation through a separate Twilio number, leaving the production
  line free. The flag is persisted on the invitation only when set,
  so SMS rotations + bishop-reply notifications stay on the same
  FROM for the lifetime of the thread. Server allowlist is the
  security boundary; non-allowlisted callers are silently downgraded
  to the production number. A "Developer" section on the Profile
  page surfaces the toggle when the caller qualifies.

### Fixed

- **Bottom save bar + plan-speakers wizard footer respect the iOS
  safe area.** `ProgramSaveBar` (week editor) and `WizardFooter`
  (every step of the plan-speakers wizard, on its `h-dvh` shell)
  now apply `pb-[max(<base>,env(safe-area-inset-bottom))]` so the
  Approve / Send / Print buttons clear the iPhone home indicator
  instead of overlapping it. Matches the pattern already used by
  the global `SaveBar` and the speaker-invite FAB.

## [0.12.2] — 2026-04-27

Real-device follow-up to the v0.12.1 mobile gate. The read-only path
kept the Lexical editor + paginated stage and just hid the toolbar,
which left the paper visibly tiny while the inner text rendered close
to native size and produced 3 stacked page sheets the bishop couldn't
navigate.

### Fixed

- **Mobile letter preview is now pinch / pan / zoom on a single page.**
  The wizard's review step + the prepare-invitation tab render a
  dedicated `MobileLetterPreview` instead of a hidden-toolbar Lexical
  editor. Initial scale fits the paper to viewport width, pinch zooms
  in to read, double-tap resets, drag pans the page. Variable chips +
  `{{tokens}}` are pre-resolved against the speaker's vars so the
  bishop sees the real letter, not sample values. The walnut "Editing
  is desktop-only" notice strip stays pinned at top.

## [0.12.1] — 2026-04-27

Mobile follow-up to the v0.12.0 WYSIWYG release. The page-scale
template editors aren't operable on phone-class viewports, so this
release blocks editing there and replaces the broken-looking canvas
with clear guidance.

### Changed

- **Template editors are desktop-only** at `/settings/templates/
  speaker-letter` and `/settings/templates/programs`. Below Tailwind's
  `md` breakpoint (768px), the routes render a friendly **Desktop
  only** card with a Copy-link button instead of half-rendering an
  editor that can't be operated. The Settings → Templates section
  CTAs stay visible but disabled with a small "Desktop only" pill so
  the feature is still discoverable when the bishop is back at a
  laptop.

- **Per-speaker letter editor is read-only on mobile** in the
  plan-speakers wizard's review step + the prepare-invitation tab.
  The toolbar is hidden, a walnut notice strip explains the
  constraint, and pointer interaction on the page is blocked — the
  bishop sees the same paper preview as desktop and can still
  Send / Print / Skip without an unusable editor canvas in the way.

### Infrastructure

- New `useMediaQuery` / `useIsMobile` hook in
  `src/hooks/useMediaQuery.ts` for any other surface that needs the
  same viewport gate.

## [0.12.0] — 2026-04-26

The big WYSIWYG release: the speaker-letter and program-template
editors are rebuilt as Word-style WYSIWYG canvases on top of Lexical.
The bishop now authors **on the page** — letterhead, callout,
signature, image, and `{{variable}}` chips are first-class blocks they
can insert, drag, restyle, and click to edit. The conducting +
congregation print outputs are now driven by the bishop's customized
program template (#23) instead of hardcoded JSX, closing the loop:
editing the template **is** editing the printed program.

### Added

- **WYSIWYG speaker-letter editor**. The split-pane "editor on the
  left, paper preview on the right" pattern is gone; a single
  Word-style canvas renders the letter at print fidelity while the
  bishop edits it. Includes a sticky page-level toolbar with
  block-type, lists, alignment, link, history, page setup, insert
  menu, and zoom; a floating selection toolbar with bold / italic /
  underline / strike / link / colour / font / size; slash-command
  palette (`/`); markdown shortcuts; auto-link detection; design-token
  colour + font swatches.

- **Insertable letter blocks**. Letterhead (eyebrow + display title +
  sub-eyebrow), Callout (eyebrow + body band), Signature (closing line
  + walnut underline + signed-by), Image (with alt + caption + width).
  Each is a Lexical decorator the bishop can click to edit through an
  in-app modal — no native prompts anywhere in the editor.

- **`{{variable}}` chips that render as live values**. Authoring shows
  the resolved value (e.g. `Brother Park` instead of `{{speakerName}}`)
  with a hover tooltip surfacing the underlying token. Chips are
  formattable like text — bold / italic / colour / highlight / font /
  size all apply through the same toolbar selection — and click-to-
  change opens a picker grouped by variable category.

- **"Preview as" switcher in the template editor**. Rotate through
  upcoming Sundays to see how the letter resolves with each speaker's
  real values, replacing the static sample-value preview.

- **WYSIWYG program-template editor (Phases 3 + 4)**. Conducting +
  congregation programs author on the same page-editor framework with
  a custom node set (hymn block, speaker block, leadership row, etc.)
  and continuous-flow pagination — the conducting copy paginates
  visually as content overflows, including a manual page-break node.
  The print path (`ConductingProgram` / `CongregationProgram`) now
  consumes the saved template JSON so customizations land on the
  printed program (#23).

- **Page setup panel**. Page size (Letter / A4 / Legal / Statement /
  A3 / Pageless), orientation (portrait / landscape), margins
  (narrow / normal / wide), border colour + width + style, and paper
  colour. Settings persist on the template document and apply to the
  on-screen canvas + print output.

- **Slash-command palette + image insert**. `/` at start-of-line opens
  a typeahead palette for inserting blocks; an `INSERT_IMAGE_COMMAND`
  feeds it. The brass-ornament SVG ships as a built-in preset.

- **Page-size override on the wizard's review-letter step**. The
  bishop can switch a single speaker's letter to A4 / Statement / etc.
  without touching the template default.

### Changed

- **Speaker landing page renders the bishop's WYSIWYG template**, not
  the legacy hardcoded chrome + flat markdown body. Letterhead,
  callouts, signature blocks, images — everything the bishop authored
  appears on the speaker's page exactly as designed.

- **Letter footer editor removed**. The split body / footer markdown
  pair collapses into a single continuous editor state; the signature
  is now a draggable Lexical block (`SignatureBlockNode`) instead of
  fixed page chrome.

- **Conductor's-copy default redesigned for readability**:
  announcements first, two speakers with an interlude between them
  (instead of four speakers), officers paired on a single row, and
  ward business listed before the sacrament hymn.

- **Letterhead style**. Replaces the masthead-style header with a
  compact, single-hairline-rule layout featuring a circled brass
  ornament.

- **MDXEditor dropped** in favour of Lexical. Every markdown surface
  in the app now flows through the same editor framework.

### Fixed

- **Print preview matches editor typography 1:1**. Inline `<em>`,
  colour, and weight inherited the editor's prose rules but printed
  unstyled — the print sheet now mirrors the editor wrapper exactly,
  with `print-color-adjust: exact` so colour survives the PDF
  pipeline.

- **Speaker chips re-resolve against live vars in the print path**.
  Editing a speaker's topic on the roster step and returning to Print
  now reflects the new value; previously the print preview cached the
  old chip text.

- **Send-time chip resolution**. `{{variable}}` chips are now baked
  into the snapshot at send-time so the speaker page renders the
  bishop's chosen styling (colour / italic / font / size) end-to-end,
  even when the chip lives only in the JSON tree (not in inline text).

- **Letterhead doubling on the chrome+markdown fallback path**. The
  legacy markdown serializer was emitting the letterhead twice when
  the snapshot had no `editorStateJson` — chrome already paints the
  masthead, so the walker now skips letterhead / signature /
  assigned-Sunday-callout nodes when synthesising legacy markdown.

- **Per-speaker editors render real values, not sample values**. The
  inline letter editor in the wizard's review step + the prepare-
  invitation page now resolve chips against the live speaker, just
  like the bishop's preview-as switcher.

- **Pagination preserves natural top margin** of the first block on
  each new page (was getting clipped).

- **Defensive field reads in approval + isActiveMember rule chains**
  to avoid spurious `permission-denied` when expected fields are
  missing.

- **Firestore subscription state**: hooks now report `loading=true`
  on first mount and stay loading until every path segment is ready,
  preventing brief render-with-empty-data flashes.

### Infrastructure

- **`src/features/page-editor/`** new shared module: `PageEditor`,
  `PageCanvas`, `PageStage`, slash-command + drag-handle + pagination
  + image plugins, and the decorator-node set used by both editors.

- **`resolveChipsInState`** + **`serializeForInterpolation`** bridge
  the JSON editor state to the email/SMS plain-text interpolation
  pipeline so chips round-trip cleanly.

- **`src/features/page-editor/renderLetterState`** — read-only walker
  used by the speaker landing page + receipt emails to render the
  authored JSON tree.

- 13 legacy components retired (the split-pane editor, mobile preview
  FAB, swap-sides button, panel-layout storage, etc.) once the
  WYSIWYG framework reached parity.

## [0.11.0] — 2026-04-25

The big plan-speakers release: the per-Sunday "Assign speakers" modal
is replaced by a guided three-step wizard, the app shell gets a
mobile-first top bar and a new bordeaux S app icon, and Notifications
move out of the Profile page onto a dedicated surface with a
quick-toggle in the user menu.

### Added

- **Guided plan-speakers wizard at `/plan/:date`**. Replaces the
  per-Sunday Assign-speakers modal with a focused, three-step flow:
  Roster (name + topic + role for up to four speakers) → Invitations
  (one speaker at a time, choose Send / Resend / Print / Skip and
  edit the letter inline before firing) → Summary. The contact
  prompt collects email/phone inline when missing, the print path
  prompts "Did you hand-deliver?" to mark invited, and a sticky
  `WizardFooter` keeps the primary CTA visible at every step on both
  mobile and desktop.

- **Type-to-confirm speaker delete**. Removing a persisted speaker
  from the roster requires typing their name, with extra-stern
  warning copy when the speaker has already been invited or
  confirmed for the Sunday.

- **Edit / Preview tab toggle on the mobile letter editor**.
  Replaces the floating Preview FAB with an inline tab so the page
  has a single primary CTA.

- **Standalone Notifications page at `/settings/notifications`**.
  Moved out of Profile so device toggle + quiet hours have a
  dedicated surface. The user menu surfaces a Notifications row
  with a quick on/off switch for the current device, and an About
  row (disabled, "Coming soon").

### Changed

- **App icon and brand mark redesigned** to a bordeaux S monogram
  (replaces the V mark and the slate-S favicon). The PWA manifest
  and `<meta theme-color>` align with the new palette.

- **Mobile top bar condensed**. Drops the "Steward" wordmark and
  inline version chip on small screens — only the monogram + ward
  name + avatar render. The version moves into the user-menu
  dropdown as a release-notes link.

- **Subscribe prompt now requires opt-in**. The "Not now" escape on
  "Get notified about program updates" is gone so bishopric users
  can't dismiss push notifications without enabling them.

### Fixed

- **Edge-to-edge rendering on full-viewport pages**. The plan-speakers
  wizard, speaker-letter template editor, and speaker-invite landing
  now disable the global `scrollbar-gutter: stable` rule on `<html>`
  while mounted, so the right edge no longer paints an empty
  scrollbar band.

### Infrastructure

- New `useFullViewportLayout` hook centralizes the gutter-override
  pattern for any future full-viewport page.

## [0.10.1] — 2026-04-25

### Fixed

- **Google sign-in now prompts for account choice after sign-out**
  (#128). Signing out of Firebase doesn't end the underlying Google
  browser session, so `signInWithPopup` was silently
  re-authenticating the previously selected account — making it
  impossible to switch Google accounts from the login page. The
  provider now sets `prompt=select_account` so the chooser appears
  on every sign-in.

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

[Unreleased]: https://github.com/aylabyuk/steward/compare/v0.21.2...HEAD
[0.21.2]: https://github.com/aylabyuk/steward/releases/tag/v0.21.2
[0.21.1]: https://github.com/aylabyuk/steward/releases/tag/v0.21.1
[0.21.0]: https://github.com/aylabyuk/steward/releases/tag/v0.21.0
[0.20.1]: https://github.com/aylabyuk/steward/releases/tag/v0.20.1
[0.20.0]: https://github.com/aylabyuk/steward/releases/tag/v0.20.0
[0.19.0]: https://github.com/aylabyuk/steward/releases/tag/v0.19.0
[0.18.0]: https://github.com/aylabyuk/steward/releases/tag/v0.18.0
[0.17.0]: https://github.com/aylabyuk/steward/releases/tag/v0.17.0
[0.16.1]: https://github.com/aylabyuk/steward/releases/tag/v0.16.1
[0.16.0]: https://github.com/aylabyuk/steward/releases/tag/v0.16.0
[0.15.0]: https://github.com/aylabyuk/steward/releases/tag/v0.15.0
[0.14.0]: https://github.com/aylabyuk/steward/releases/tag/v0.14.0
[0.13.1]: https://github.com/aylabyuk/steward/releases/tag/v0.13.1
[0.13.0]: https://github.com/aylabyuk/steward/releases/tag/v0.13.0
[0.12.2]: https://github.com/aylabyuk/steward/releases/tag/v0.12.2
[0.12.1]: https://github.com/aylabyuk/steward/releases/tag/v0.12.1
[0.12.0]: https://github.com/aylabyuk/steward/releases/tag/v0.12.0
[0.11.0]: https://github.com/aylabyuk/steward/releases/tag/v0.11.0
[0.10.1]: https://github.com/aylabyuk/steward/releases/tag/v0.10.1
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
