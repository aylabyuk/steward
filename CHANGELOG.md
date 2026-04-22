# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning
follows [SemVer](https://semver.org/) with the pre-1.0 interpretation
documented in [README.md](README.md#versioning--releases).

## [Unreleased]

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

[Unreleased]: https://github.com/aylabyuk/steward/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/aylabyuk/steward/releases/tag/v0.5.0
[0.4.0]: https://github.com/aylabyuk/steward/releases/tag/v0.4.0
[0.3.0]: https://github.com/aylabyuk/steward/releases/tag/v0.3.0
[0.2.0]: https://github.com/aylabyuk/steward/releases/tag/v0.2.0
[0.1.2]: https://github.com/aylabyuk/steward/releases/tag/v0.1.2
[0.1.1]: https://github.com/aylabyuk/steward/releases/tag/v0.1.1
[0.1.0]: https://github.com/aylabyuk/steward/releases/tag/v0.1.0
