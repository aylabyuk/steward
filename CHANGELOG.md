# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning
follows [SemVer](https://semver.org/) with the pre-1.0 interpretation
documented in [README.md](README.md#versioning--releases).

## [Unreleased]

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

[Unreleased]: https://github.com/aylabyuk/steward/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/aylabyuk/steward/releases/tag/v0.3.0
[0.2.0]: https://github.com/aylabyuk/steward/releases/tag/v0.2.0
[0.1.2]: https://github.com/aylabyuk/steward/releases/tag/v0.1.2
[0.1.1]: https://github.com/aylabyuk/steward/releases/tag/v0.1.1
[0.1.0]: https://github.com/aylabyuk/steward/releases/tag/v0.1.0
