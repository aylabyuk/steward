# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning
follows [SemVer](https://semver.org/) with the pre-1.0 interpretation
documented in [README.md](README.md#versioning--releases).

## [Unreleased]

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

[Unreleased]: https://github.com/aylabyuk/steward/compare/v0.9.1...HEAD
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
