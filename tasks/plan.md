# Implementation Plan — Steward v1

## Overview

Build the Bishopric PWA end-to-end: React + TS + Tailwind on Vite, Firebase (Firestore, Auth, FCM) as backend, Vercel for hosting, three Cloud Functions for notifications. Ship v1 as defined in [CLAUDE.md](../CLAUDE.md) and the [docs/](../docs/) topic files.

## Working assumptions (confirm before starting)

Resolving the three open questions in [CLAUDE.md](../CLAUDE.md) as working defaults. Change before Phase 0 if different:

1. **Hymn list** — ship JSON in repo (`src/features/hymns/hymns.json`).
2. **Member management** — any `role: bishopric` member can add/remove/deactivate ward members in-app.
3. **Package manager** — pnpm.

Other assumptions:

- Single Firebase project with two environments (`steward-dev`, `steward-prod`); emulators for local + CI.
- Vercel project linked to the repo; `develop` → preview, `main` → production.
- `develop` is the default working branch; feature branches PR into it.
- Tailwind v4 (current stable as of 2026-04) with Vite plugin.
- No shadcn/ui CLI — hand-roll the few primitives we need in `src/components/ui/` to keep the bundle and dependency surface small. Revisit if primitive count grows past ~6.

## Architecture decisions

- **Server state** = Firestore `onSnapshot` hooks. **Client state** = Zustand. No React Query. (See [docs/engineering.md](../docs/engineering.md#state-management).)
- **Audit trail written client-side** in the same batched write as the content change — no Cloud Function for history. (See [docs/domain.md](../docs/domain.md#audit-trail).)
- **Exactly three Cloud Functions.** Nothing else server-side. (See [docs/notifications.md](../docs/notifications.md).)
- **Multi-ward from day one.** All data under `wards/{wardId}/`. Rules enforce ward isolation. (See [docs/access.md](../docs/access.md).)
- **Everything is always editable.** Status is a label, never a gate. (See [CLAUDE.md](../CLAUDE.md#hard-rules).)
- **150 LOC component cap**, oxlint-enforced as error.
- **Approval gates printing only.** Editing an approved meeting invalidates approvals (logged, not deleted).

## Dependency graph (high level)

```
Tooling + scaffold (Phase 0)
    │
    ├── Firebase init + emulators (Phase 1)
    │       │
    │       ├── Auth + ward access (Phase 2)
    │       │       │
    │       │       ├── Domain types + Firestore hooks (Phase 3)
    │       │       │       │
    │       │       │       ├── Speaker schedule (Phase 4)
    │       │       │       │       │
    │       │       │       │       └── Weekly program editor (Phase 5)
    │       │       │       │               │
    │       │       │       │               ├── Letters + mailto (Phase 6)
    │       │       │       │               ├── Approval lifecycle (Phase 7)
    │       │       │       │               ├── Print views (Phase 8)
    │       │       │       │               ├── Comments + mentions (Phase 9)
    │       │       │       │               └── Audit trail UI (Phase 10)
    │       │       │       │
    │       │       │       └── Settings screens (Phase 11)
    │       │       │
    │       │       └── Cloud Functions (Phase 12 — depends on writes from 5–9)
    │       │               │
    │       │               └── FCM subscribe flow (Phase 13)
    │       │
    │       └── Rules test suite (grows with each phase)
    │
    └── PWA polish + launch (Phase 14)
```

---

## Phase 0 — Tooling & scaffold

Goal: a repo that lints, formats, typechecks, tests, and deploys previews with zero feature code.

### Task 0.1 — Vite + React + TS scaffold

**Description:** Initialize the Vite React-TS project, Tailwind v4, and directory skeleton matching [CLAUDE.md](../CLAUDE.md#directory-layout).

**Acceptance criteria:**
- `pnpm dev` serves a blank page on localhost.
- `src/` directory matches the documented layout (empty dirs with `.gitkeep` ok).
- `tsconfig.json` strict mode on; path alias `@/*` → `src/*`.

**Verification:**
- `pnpm build` succeeds.
- `pnpm typecheck` passes.
- Manual: visit `http://localhost:5173`, see placeholder.

**Dependencies:** None.
**Files likely touched:** `package.json`, `tsconfig.json`, `vite.config.ts`, `src/main.tsx`, `src/app/`, `tailwind.config.*`, `src/styles/index.css`.
**Estimated scope:** S.

### Task 0.2 — oxlint + Biome + CI lint/format config

**Description:** Configure oxlint (with `max-lines`/`max-lines-per-function` as error, limit 150) and Biome in formatter-only mode. Add npm scripts.

**Acceptance criteria:**
- `.oxlintrc.json` has `max-lines` and `max-lines-per-function` as error with `{ max: 150, skipBlankLines: true, skipComments: true }`.
- `biome.json` has `"linter": { "enabled": false }`.
- Scripts: `lint`, `format`, `format:check`, `typecheck` per [CLAUDE.md](../CLAUDE.md#commands).
- A deliberately oversized component file fails `pnpm lint`; a correctly sized one passes.

**Verification:**
- `pnpm lint && pnpm format:check && pnpm typecheck` all pass.

**Dependencies:** 0.1.
**Files likely touched:** `.oxlintrc.json`, `biome.json`, `package.json`.
**Estimated scope:** S.

### Task 0.3 — Vitest + Playwright harness

**Description:** Install Vitest (shares Vite config), Playwright, and write one passing placeholder test in each so CI has something to run.

**Acceptance criteria:**
- `pnpm test` runs one passing Vitest test.
- `pnpm test:e2e` runs one passing Playwright test against a preview build.
- Playwright config points at `pnpm preview` on a known port.

**Verification:**
- Both commands exit 0 locally.

**Dependencies:** 0.1.
**Files likely touched:** `vitest.config.ts`, `playwright.config.ts`, `src/__tests__/smoke.test.ts`, `e2e/smoke.spec.ts`.
**Estimated scope:** S.

### Task 0.4 — CI pipeline

**Description:** `.github/workflows/ci.yml` runs on every push to `develop` and every PR. Steps per [docs/engineering.md](../docs/engineering.md#ci): lint, format:check, typecheck, test, test:rules, test:e2e. No retries.

**Acceptance criteria:**
- Workflow runs on push to `develop` and PRs to `develop`/`main`.
- All 7 steps defined (rules + e2e stubs pass even if empty suite).
- Node cache + pnpm cache configured for speed.

**Verification:**
- Open a throwaway PR, observe green pipeline.

**Dependencies:** 0.2, 0.3, 1.2 (emulator needed for rules + e2e; can initially stub those two steps and fill in during Phase 1).
**Files likely touched:** `.github/workflows/ci.yml`.
**Estimated scope:** S.

### Task 0.5 — Vercel preview wiring

**Description:** Link repo to Vercel project; `develop` → preview, `main` → production. Verify a push creates a preview URL.

**Acceptance criteria:**
- `vercel.json` (if needed for build command / output).
- Preview URL reachable from PRs.

**Verification:**
- A PR produces a reachable preview deployment.

**Dependencies:** 0.1.
**Files likely touched:** `vercel.json`, Vercel dashboard config (out-of-repo).
**Estimated scope:** S.

### Checkpoint: Foundation

- [ ] `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build` all green locally.
- [ ] CI green on a throwaway PR.
- [ ] Vercel preview URL works.
- [ ] Review with human.

---

## Phase 1 — Firebase + emulators

### Task 1.1 — Firebase project + SDK init

**Description:** Create `steward-dev` and `steward-prod` Firebase projects. Install `firebase` SDK. Create `src/lib/firebase.ts` that reads config from env vars and initializes Auth + Firestore + Messaging.

**Acceptance criteria:**
- `.env.example` documents the required `VITE_FIREBASE_*` vars.
- `src/lib/firebase.ts` exports `app`, `auth`, `db`, `messaging`.
- Emulator detection: if `VITE_USE_EMULATORS=true`, connect Auth/Firestore/Functions/FCM to emulator ports.

**Verification:**
- App boots, no console errors with dev project vars.

**Dependencies:** 0.1.
**Files likely touched:** `src/lib/firebase.ts`, `.env.example`.
**Estimated scope:** S.

### Task 1.2 — Firebase Local Emulator Suite

**Description:** `firebase.json` configures Auth, Firestore, Functions, and FCM emulators. `firestore.rules` starts as deny-all. `pnpm emulators` brings the suite up.

**Acceptance criteria:**
- `pnpm emulators` starts all four emulators on fixed ports.
- `firestore.rules` exists (deny-all for now).
- `firebase.json` + `.firebaserc` in repo.

**Verification:**
- Emulator UI reachable at `localhost:4000`.

**Dependencies:** 0.1.
**Files likely touched:** `firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`.
**Estimated scope:** S.

### Task 1.3 — Rules unit test harness

**Description:** Wire `@firebase/rules-unit-testing`. Write one passing test (e.g., deny-all rejects an unauthenticated read) so CI step `test:rules` has a live suite.

**Acceptance criteria:**
- `pnpm test:rules` spins up Firestore emulator and runs one test.
- Test exits 0.

**Verification:**
- `pnpm test:rules` green locally and in CI.

**Dependencies:** 1.2.
**Files likely touched:** `tests/rules/*.test.ts`, `package.json`.
**Estimated scope:** S.

### Checkpoint: Firebase ready

- [ ] Emulators run locally, rules test green, CI runs `test:rules` non-trivially.

---

## Phase 2 — Auth & ward access

Vertical slice: a bishop can sign in, the app finds their ward, unauthorized users get bounced.

### Task 2.1 — `useAuthStore` + sign-in flow

**Description:** Zustand store subscribes to `onAuthStateChanged`. Google sign-in button on a `/login` route. Sign-out available.

**Acceptance criteria:**
- `useAuthStore` exposes `{ user, status: 'loading' | 'signed_out' | 'signed_in', signIn, signOut }`.
- Store initializes once at app mount.
- Login page has working Google button (against emulator).

**Verification:**
- Vitest: store state machine transitions correctly given mocked Auth events.
- Manual: sign in via emulator, see `user` populate.

**Dependencies:** 1.1.
**Files likely touched:** `src/stores/authStore.ts`, `src/app/routes/login.tsx`.
**Estimated scope:** S.

### Task 2.2 — Allowlist enforcement + ward picker

**Description:** After sign-in, query `collectionGroup('members').where('email','==',user.email).where('active','==',true)`. Zero matches → "Access required" + sign out. One match → set `currentWardId`. Multiple → ward picker.

**Acceptance criteria:**
- `useCurrentWardStore` exposes `{ wardId, setWardId }`.
- Zero-match path renders the denial screen.
- Multi-match path renders the picker.
- Firestore composite index for `members.email + active` documented in `firestore.indexes.json`.

**Verification:**
- Vitest: mocked query returning 0 / 1 / 2 docs produces correct UI states.
- E2E: seeded emulator with a member doc → sign-in → routed into app.

**Dependencies:** 2.1, 1.2.
**Files likely touched:** `src/stores/currentWardStore.ts`, `src/app/routes/access-required.tsx`, `src/app/routes/ward-picker.tsx`, `firestore.indexes.json`.
**Estimated scope:** M.

### Task 2.3 — Ward bootstrap script

**Description:** Admin CLI script (`scripts/bootstrap-ward.ts`) that uses the Firebase Admin SDK to create `wards/{wardId}` + first `bishopric` member + default letter template. Documented in [docs/access.md](../docs/access.md#ward-bootstrap-manual-v1).

**Acceptance criteria:**
- Script accepts `wardId`, `wardName`, bishop email+calling as args.
- Creates ward doc + first member + default `speaker-invitation` template atomically.
- README section in `scripts/README.md` explains usage.

**Verification:**
- Run against emulator, observe docs in UI.

**Dependencies:** 1.2.
**Files likely touched:** `scripts/bootstrap-ward.ts`, `scripts/README.md`.
**Estimated scope:** S.

### Task 2.4 — Baseline Firestore rules for auth + members

**Description:** Replace deny-all with rules that: only authenticated users read anything; only active members of a ward can read that ward; only `bishopric` can write member docs; first-member invariant (rules reject member create if ward has zero bishopric members).

**Acceptance criteria:**
- Rules match the matrix in [docs/access.md](../docs/access.md#roles--permissions).
- Rules tests cover: unauthenticated read rejected; cross-ward read rejected; inactive member rejected; clerk cannot write member doc; bishopric can; first-member invariant holds.

**Verification:**
- `pnpm test:rules` green with the new cases.

**Dependencies:** 1.3, 2.2.
**Files likely touched:** `firestore.rules`, `tests/rules/auth.test.ts`, `tests/rules/members.test.ts`.
**Estimated scope:** M.

### Checkpoint: Auth & access

- [ ] Sign-in end-to-end works against emulator.
- [ ] Unauthorized user bounced out.
- [ ] Rules tests cover member boundaries.
- [ ] Review with human.

---

## Phase 3 — Domain types + Firestore hooks

### Task 3.1 — Types + Zod schemas

**Description:** Translate the domain model in [docs/domain.md](../docs/domain.md) to TypeScript types + Zod schemas in `src/lib/types.ts`: `SacramentMeeting`, `Speaker`, `Person`, `Assignment`, `AssignmentStatus`, `MeetingType`, `MeetingStatus`, `Comment`, `HistoryEvent`, `WardSettings`, `Member`, `LetterTemplate`.

**Acceptance criteria:**
- All types match doc, including discriminated unions where useful.
- Zod schemas exported for runtime validation at Firestore read boundaries.
- Pure unit tests for schema parsing: valid docs parse, invalid get rejected with useful errors.

**Verification:**
- Vitest green.

**Dependencies:** None (pure code).
**Files likely touched:** `src/lib/types.ts`, `src/lib/types.test.ts`.
**Estimated scope:** M.

### Task 3.2 — Core Firestore hooks

**Description:** Implement `useMeeting(date)`, `useSpeakers(date)`, `useUpcomingMeetings(horizonWeeks)`, `useWardSettings()`, `useWardMembers()`. Each wraps `onSnapshot`, returns `{ data, loading, error }`, unsubscribes on unmount, validates with Zod.

**Acceptance criteria:**
- Hooks consume `currentWardId` from the store (hooks throw if no ward selected — caller renders a loading boundary).
- Unit tests mock the Firestore SDK and verify: subscribe on mount, unsubscribe on unmount, state transitions, Zod validation errors surface.

**Verification:**
- Vitest green; coverage includes happy path + error path per hook.

**Dependencies:** 3.1, 2.2.
**Files likely touched:** `src/hooks/useMeeting.ts`, `src/hooks/useSpeakers.ts`, `src/hooks/useUpcomingMeetings.ts`, `src/hooks/useWardSettings.ts`, `src/hooks/useWardMembers.ts`, corresponding `.test.ts`.
**Estimated scope:** M.

### Task 3.3 — Meeting auto-creation rules

**Description:** Helper function `ensureMeetingDoc(date)` that creates a meeting doc with the right auto-default (`fast_sunday` if first Sunday of month, `stake_conference`/`general_conference` per `settings.nonMeetingSundays`, else `regular`). Idempotent.

**Acceptance criteria:**
- Given a date, function returns existing doc or creates the correct default.
- Unit tests cover: first Sunday → fast_sunday; non-meeting list hit → correct type; regular Sunday → regular; called twice → no duplicate write.

**Verification:**
- Vitest green.

**Dependencies:** 3.1, 3.2.
**Files likely touched:** `src/features/meetings/ensureMeetingDoc.ts`, corresponding test.
**Estimated scope:** S.

### Checkpoint: Domain layer

- [ ] Types match docs, hooks subscribe/unsubscribe cleanly, auto-create logic correct.

---

## Phase 4 — Speaker Schedule view

Vertical slice: a bishopric member sees the next N Sundays, adds speakers, sees lead-time warnings.

### Task 4.1 — Schedule route + card grid

**Description:** `/schedule` route renders `N` upcoming Sunday cards (N = `settings.scheduleHorizonWeeks`). Each card shows date, meeting type, speaker names (or empty slots), comment count badge. Non-meeting Sundays render greyed.

**Acceptance criteria:**
- Horizon respects ward setting; default 8.
- Grid responsive: desktop multi-col, mobile single column.
- Non-meeting Sundays visually distinct and not interactive.

**Verification:**
- Component test: seeded upcoming meetings render correctly.
- Manual in preview: walk the schedule.

**Dependencies:** 3.2, 3.3.
**Files likely touched:** `src/features/schedule/ScheduleView.tsx`, `src/features/schedule/MeetingCard.tsx`, `src/app/routes/schedule.tsx`.
**Estimated scope:** M.

### Task 4.2 — Add/edit speaker inline

**Description:** On a card, "Add speaker" opens a form (name, email, topic). Uses React Hook Form + Zod. Writes to `meetings/{date}/speakers/{id}`. Speakers list inline-editable.

**Acceptance criteria:**
- Form validates; invalid submits surface errors.
- New speaker doc has status `not_assigned` by default.
- Lead-time warning banner (yellow <14d, red <7d).
- `fast_sunday` hides the speaker section (testimonies).

**Verification:**
- Vitest on form validation.
- E2E: sign in → add speaker to upcoming Sunday → see persisted.

**Dependencies:** 4.1, 3.2.
**Files likely touched:** `src/features/speakers/SpeakerForm.tsx`, `src/features/speakers/SpeakerList.tsx`, `src/features/speakers/leadTime.ts`.
**Estimated scope:** M.

### Task 4.3 — Rules for meetings + speakers

**Description:** Extend `firestore.rules` so active members of a ward can create/update `meetings/{date}` and `speakers/{id}`; cross-ward blocked.

**Acceptance criteria:**
- Tests cover: active member writes succeed; inactive fails; cross-ward fails; non-member fails.

**Verification:**
- `pnpm test:rules` green.

**Dependencies:** 2.4.
**Files likely touched:** `firestore.rules`, `tests/rules/meetings.test.ts`, `tests/rules/speakers.test.ts`.
**Estimated scope:** S.

### Checkpoint: Speaker scheduling works

- [ ] E2E: sign in → schedule view → add speaker → reload → persisted.
- [ ] Lead-time warnings appear at the right thresholds.
- [ ] Rules tests cover the new writes.
- [ ] Review with human.

---

## Phase 5 — Weekly Program editor

Vertical slice: open a specific Sunday, fill all assignment fields.

### Task 5.1 — `/week/:date` route + layout

**Description:** Route renders an editor with sections: Speakers, Hymns, Prayers, Sacrament, Other assignments (pianist, chorister), Special number, Business/Announcements. Meeting-type gating hides irrelevant sections.

**Acceptance criteria:**
- Desktop: two-column; mobile: single column with collapsible sections.
- `fast_sunday` hides Speakers; `stake_conference`/`general_conference` render a read-only placeholder.
- Editor shows cancellation banner if cancelled.

**Verification:**
- Component tests per meeting type.

**Dependencies:** 3.2, 4.2.
**Files likely touched:** `src/features/meetings/WeekEditor.tsx`, `src/features/meetings/sections/*.tsx`, `src/app/routes/week.tsx`.
**Estimated scope:** M.

### Task 5.2 — Assignment field component + status menu

**Description:** Shared `<AssignmentField>` for person + status (opening/closing prayer, pianist, chorister, sacrament bread, blessers[2], special number). Status dropdown. Autocomplete from ward members (optional — free-text ok).

**Acceptance criteria:**
- Writes update status + timestamps correctly.
- Status values match [docs/domain.md](../docs/domain.md#assignment-statuses).
- Blessers enforce exactly 2 slots.

**Verification:**
- Vitest on field behavior.
- E2E: fill a regular Sunday's assignments end-to-end.

**Dependencies:** 5.1.
**Files likely touched:** `src/features/assignments/AssignmentField.tsx`, `src/features/assignments/statusOptions.ts`.
**Estimated scope:** M.

### Task 5.3 — Hymn picker + hymns JSON

**Description:** Ship hymn JSON (number + title) in `src/features/hymns/hymns.json`. `<HymnPicker>` is a typeahead. Writes `openingHymn` / `sacramentHymn` / `closingHymn` as `{ number, title }`.

**Acceptance criteria:**
- JSON contains all standard LDS hymnal hymns (confirm count with human).
- Typeahead matches on number or title substring.
- `stake_conference`/`general_conference`/`fast_sunday` sacrament-hymn behavior matches the meeting-types table.

**Verification:**
- Component test on the picker.

**Dependencies:** 5.1.
**Files likely touched:** `src/features/hymns/HymnPicker.tsx`, `src/features/hymns/hymns.json`.
**Estimated scope:** S.

### Task 5.4 — Cancellation flow

**Description:** "Cancel meeting" action sets `cancellation = { cancelled, reason, cancelledAt, cancelledBy }`. "Uncancel" clears it. Schedule view strikes through cancelled cards.

**Acceptance criteria:**
- Reason required; confirm dialog.
- Uncancel leaves content + approvals intact (per [docs/domain.md](../docs/domain.md#cancellation)).

**Verification:**
- E2E: cancel → schedule reflects → uncancel → reverts.

**Dependencies:** 5.1.
**Files likely touched:** `src/features/meetings/cancellation.ts`, `src/features/meetings/CancelDialog.tsx`.
**Estimated scope:** S.

### Task 5.5 — Copy from previous week

**Description:** Button on the week editor copies `pianist`, `chorister`, `sacramentBlessers`, `sacramentBread` from the immediately previous non-cancelled Sunday. Speakers + topics NOT copied.

**Acceptance criteria:**
- Only the listed fields copy.
- Confirm dialog before overwriting existing values.
- No previous meeting exists → button disabled.

**Verification:**
- Unit test on the copy logic.
- E2E: fill Sunday A's assignments, open Sunday B, click copy, verify.

**Dependencies:** 5.2.
**Files likely touched:** `src/features/meetings/copyFromPrevious.ts`, corresponding button in editor.
**Estimated scope:** S.

### Checkpoint: Program editor complete

- [ ] All meeting types render the correct sections.
- [ ] E2E: fill a `regular` Sunday top to bottom.
- [ ] Cancel + uncancel round-trips.
- [ ] Copy-from-previous works.

---

## Phase 6 — Letters & mailto

### Task 6.1 — Letter template editor

**Description:** `/settings` subsection for `letterTemplates/{id}`. Edit name, subject, body. Preview pane with sample placeholder values.

**Acceptance criteria:**
- Handlebars-style `{{placeholders}}` per [docs/features.md](../docs/features.md#letter-templates--placeholders).
- Preview pane renders live.
- Unknown placeholders pass through visibly.

**Verification:**
- Unit test on the pure string-replacement renderer.

**Dependencies:** 3.2.
**Files likely touched:** `src/features/speakers/LetterTemplateEditor.tsx`, `src/features/speakers/renderTemplate.ts`.
**Estimated scope:** M.

### Task 6.2 — Per-speaker letter compose screen

**Description:** `/week/:date/speaker/:id/letter` route. Pre-fills `letterBody` from template + speaker data. Editable; saves to speaker doc. "Send via email" + "Print" actions.

**Acceptance criteria:**
- Placeholders resolved on first open; edits persist.
- Editing the ward template later does NOT retro-update this letter.

**Verification:**
- E2E: open letter → placeholders resolved → edit → save → reopen shows edit.

**Dependencies:** 6.1, 4.2.
**Files likely touched:** `src/features/speakers/LetterComposer.tsx`, `src/app/routes/letter.tsx`.
**Estimated scope:** M.

### Task 6.3 — `mailto:` with CC policy + status tracking

**Description:** "Send via email" builds a `mailto:` link: `to=speaker.email`, `cc=<computed ward CC list>`, `subject=`, `body=`. Per [docs/access.md](../docs/access.md#email-cc-policy): bishopric always CCed, clerks/secretaries if their `ccOnEmails=true`. Optimistic status update + undo banner.

**Acceptance criteria:**
- `buildMailto()` pure function covers bishopric-always, `ccOnEmails` toggle, and truncation at ~2000 chars.
- Click opens mail client + status → `invite_emailed` + records `sentBy`, `sentAt`.
- Undo banner reverts status within 10s.
- "Didn't send" button reverts any time.
- Print path: click → `invite_printed` + undo.

**Verification:**
- Vitest on `buildMailto()` (all CC permutations + truncation).
- E2E: send letter → check window.location assertions on mailto URL shape.

**Dependencies:** 6.2.
**Files likely touched:** `src/features/speakers/buildMailto.ts`, `src/features/speakers/SendActions.tsx`.
**Estimated scope:** M.

### Checkpoint: Letters ship

- [ ] Template editor + preview works.
- [ ] Speaker letter composed + sent via mailto with correct CC.
- [ ] Status + undo flow honest.

---

## Phase 7 — Approval lifecycle

### Task 7.1 — `contentVersionHash` + write integration

**Description:** Pure function `computeContentHash(meeting, speakers)` that hashes the approvable content (exclude `updatedAt`, comments, audit trail). Every write to a meeting / its speakers recomputes and stores it.

**Acceptance criteria:**
- Changing a hymn changes the hash. Adding a comment does NOT change the hash.
- Stable across re-serializations (field order independent).

**Verification:**
- Vitest: 10+ cases covering include/exclude.

**Dependencies:** 3.1.
**Files likely touched:** `src/features/meetings/contentHash.ts`.
**Estimated scope:** S.

### Task 7.2 — Approval actions + state transitions

**Description:** `<ApprovalPanel>` on the week editor: "Request approval" (draft → pending_approval), "Approve" (records approval, flips to approved on 2nd distinct approval), "Unapprove" not supported (edit invalidates). Edits prompt "This will invalidate N approvals — proceed?" if meeting is approved or pending_approval.

**Acceptance criteria:**
- Author can approve own work.
- Only `bishopric` + `active` can approve.
- Duplicate non-invalidated approval per UID blocked client-side (and server-side in rules).
- Edit after approval → confirm dialog → prior approvals marked `invalidated: true`.

**Verification:**
- Component tests on panel states.
- E2E: request → approve with two different bishopric users → approved. Edit → invalidate banner.

**Dependencies:** 7.1, 2.4.
**Files likely touched:** `src/features/meetings/ApprovalPanel.tsx`, `src/features/meetings/approvalActions.ts`, `src/features/meetings/InvalidateConfirm.tsx`.
**Estimated scope:** M.

### Task 7.3 — Firestore rules for approvals

**Description:** Rules enforce: only `bishopric`+`active` writes approvals; one non-invalidated approval per UID; `status` can't skip from `draft` to `approved` without the approvals path.

**Acceptance criteria:**
- Rules tests cover: clerk approve rejected; inactive rejected; duplicate rejected; non-bishopric self-approve rejected.

**Verification:**
- `pnpm test:rules` green.

**Dependencies:** 7.2.
**Files likely touched:** `firestore.rules`, `tests/rules/approvals.test.ts`.
**Estimated scope:** M.

### Checkpoint: Approval works

- [ ] 2-of-3 approval flow demonstrable end-to-end.
- [ ] Invalidation on edit logged (not deleted).
- [ ] Rules tests cover approval boundaries.
- [ ] Review with human.

---

## Phase 7.5 — UI design pass (placeholder)

Goal: unify the visual design across everything built in Phases 2–7. Deferred here deliberately so we refine after the main editor surfaces (schedule, week editor, letters, approvals) exist — it's easier to style coherently once you see them all.

**What this is NOT:** functional behavior. No logic changes.

**Likely scope (decide when we get here):**

- Consistent color palette, spacing, and typography beyond the current "slate + Tailwind defaults" look.
- Form controls (inputs, selects, textareas) styled uniformly.
- Button hierarchy (primary / secondary / destructive) applied consistently.
- Empty states, loading skeletons, error banners.
- Mobile polish — touch target sizes, table reflow on the week editor.
- Icons (if any). Probably Lucide since it pairs well with Tailwind.

**Acceptance criteria:** TBD when the user has concrete visual direction. For now the goal is functional first; this phase is a deliberate placeholder.

**Dependencies:** Phase 7 complete (all core surfaces exist).

**Estimated scope:** M–L depending on how far the user wants to go.

---

## Phase 8 — Print views

### Task 8.1 — Conducting print view

**Description:** `/print/:date/conducting` — full detail, dense one-page layout, `@media print` stylesheet, semantic HTML.

**Acceptance criteria:**
- Blocked unless `status == approved`; otherwise renders "Not yet approved" page.
- Cancelled meeting renders single line "No sacrament meeting — {reason}".
- Includes: program flow, speakers + topics, hymns, pianist, chorister, blessers, bread, announcements, ward + stake business.
- Screen preview + actual print look identical.

**Verification:**
- E2E: approve a week → print view renders all sections.
- Visual check in browser preview (screen).

**Dependencies:** 7.2.
**Files likely touched:** `src/features/print/ConductingView.tsx`, `src/features/print/print.css`, `src/app/routes/print-conducting.tsx`.
**Estimated scope:** M.

### Task 8.2 — Congregation print view

**Description:** `/print/:date/congregation` — minimal: hymns, speakers, special number, sacrament blessers. Announcements opt-in via toggle. NEVER ward/stake business.

**Acceptance criteria:**
- Announcements toggle controlled by a query param or UI before print.
- Same approval gate + cancellation handling as conducting view.

**Verification:**
- E2E: approve → print congregation → verify fields visible/hidden per toggle.

**Dependencies:** 8.1.
**Files likely touched:** `src/features/print/CongregationView.tsx`, `src/app/routes/print-congregation.tsx`.
**Estimated scope:** S.

### Checkpoint: Printable programs

- [ ] Both views print correctly from a real browser.
- [ ] Approval gate enforced.

---

## Phase 9 — Comments & mentions

### Task 9.1 — Comment thread UI

**Description:** Collapsible panel at bottom of week editor. `useComments(date)` hook. Create / edit / soft-delete own comments. Plain text. Live updates.

**Acceptance criteria:**
- Author can edit/delete own comments (soft delete → `deletedAt`, body replaced with "deleted" in UI).
- Others cannot edit/delete.
- Comment count badge on schedule cards.

**Verification:**
- E2E: two signed-in users exchange a comment.

**Dependencies:** 3.2, 5.1.
**Files likely touched:** `src/features/comments/CommentThread.tsx`, `src/features/comments/CommentForm.tsx`, `src/hooks/useComments.ts`.
**Estimated scope:** M.

### Task 9.2 — `@mention` autocomplete + resolution

**Description:** Typing `@` opens a dropdown of ward members (name matching). On submit, client resolves `@name` → `uid` and writes `mentionedUids[]` to the doc.

**Acceptance criteria:**
- Multiple mentions supported.
- Ambiguous names (two "John"s) disambiguate via displayed email.
- Unknown `@name` written as literal text; not added to `mentionedUids`.

**Verification:**
- Vitest on the extractor (given body + members, produce mentionedUids).

**Dependencies:** 9.1.
**Files likely touched:** `src/features/comments/MentionAutocomplete.tsx`, `src/features/comments/extractMentions.ts`.
**Estimated scope:** M.

### Task 9.3 — Unread badge via `lastReadAt`

**Description:** Store `lastReadAt` per user per meeting. Badge shown on schedule card if latest comment `createdAt > lastReadAt`.

**Acceptance criteria:**
- Visiting `/week/:date` updates `lastReadAt`.
- Badge disappears after read.

**Verification:**
- E2E: one user posts → other user sees badge → opens → badge clears.

**Dependencies:** 9.1.
**Files likely touched:** `src/features/comments/lastRead.ts`, `src/features/schedule/MeetingCard.tsx`.
**Estimated scope:** S.

### Task 9.4 — Rules for comments

**Description:** Rules: any active member creates; author edits/deletes own (soft via `deletedAt`); no one else edits/deletes.

**Acceptance criteria:**
- Rules tests cover permission matrix.

**Verification:**
- `pnpm test:rules` green.

**Dependencies:** 2.4.
**Files likely touched:** `firestore.rules`, `tests/rules/comments.test.ts`.
**Estimated scope:** S.

### Checkpoint: Comments & mentions

- [ ] Live-updating thread with mentions, unread badges, rules.
- [ ] Comments DO NOT affect `contentVersionHash` (verify by hash test).

---

## Phase 10 — Audit trail UI

Writes already happen in-batch starting Phase 5; this phase exposes them.

### Task 10.1 — History write helper

**Description:** Helper `appendHistoryEvent(batch, meetingRef, event)` that writes to `meetings/{date}/history/{eventId}` as part of any batched content write. Skip `updatedAt`-only changes. Don't diff comment bodies (comment's `editedAt` covers it).

**Acceptance criteria:**
- Every write in Phases 5–9 uses a batched write that includes a history event.
- Unit tests on `computeDiff` ensure sparse diff output.

**Verification:**
- E2E: edit a hymn → `history` subcollection has the event with `field`, `old`, `new`.

**Dependencies:** 5.2, 7.2, 9.1.
**Files likely touched:** `src/features/meetings/history.ts`, refactors across Phase 5–9 writes.
**Estimated scope:** M.

### Task 10.2 — History drawer UI

**Description:** Drawer on the week editor showing reverse-chronological events, 20 per page.

**Acceptance criteria:**
- Human-readable event descriptions ("Alice changed Opening Hymn from … to …").
- Pagination (load more).
- Approval + comment-delete events never hidden.

**Verification:**
- E2E: perform 5 edits → open drawer → see 5 events in correct order.

**Dependencies:** 10.1.
**Files likely touched:** `src/features/meetings/HistoryDrawer.tsx`.
**Estimated scope:** M.

### Checkpoint: Audit trail

- [ ] Every write produces a history event except skipped `updatedAt` cases.
- [ ] Drawer readable by a non-technical user.

---

## Phase 11 — Ward settings

### Task 11.1 — Ward settings editor

**Description:** `/settings` page: timezone, `speakerLeadTimeDays`, `scheduleHorizonWeeks`, `nonMeetingSundays`, `nudgeSchedule`, `emailCcDefaults`.

**Acceptance criteria:**
- Only `bishopric` can edit (UI + rules).
- `nonMeetingSundays` editor: date + type + optional note.
- Validation: timezone is a valid IANA zone, horizon 1–52 weeks, lead time 0–60 days.

**Verification:**
- Vitest on validation.
- E2E: change horizon → schedule reflects.

**Dependencies:** 3.2, 2.4.
**Files likely touched:** `src/features/settings/WardSettingsEditor.tsx`, `src/app/routes/settings.tsx`.
**Estimated scope:** M.

### Task 11.2 — Member management

**Description:** Add/deactivate/reactivate members (per working assumption: any `bishopric` member). Assign `calling` + derive `role`. Toggle `ccOnEmails` for clerks/secretaries.

**Acceptance criteria:**
- `calling` → `role` derivation centralized.
- Cannot deactivate the last `bishopric` member (invariant).
- `ccOnEmails` toggle hidden for bishopric (always-on).

**Verification:**
- Vitest on invariants.
- Rules test: non-bishopric attempt to add member rejected.

**Dependencies:** 11.1, 2.4.
**Files likely touched:** `src/features/settings/MemberList.tsx`, `src/features/settings/callingToRole.ts`.
**Estimated scope:** M.

### Task 11.3 — Notification prefs (placeholder fields)

**Description:** Per-member notification settings UI: enabled, quiet hours. Writes to member doc. FCM wiring happens in Phase 13.

**Acceptance criteria:**
- Quiet-hours picker writes a valid range.
- Disable toggle suppresses all push (honored by Cloud Functions in Phase 12).

**Verification:**
- Unit test on quiet-hours serialization.

**Dependencies:** 11.1.
**Files likely touched:** `src/features/settings/NotificationPrefs.tsx`.
**Estimated scope:** S.

### Checkpoint: Settings complete

- [ ] Bishopric can configure everything the ward needs.
- [ ] Invariants + permissions enforced.

---

## Phase 12 — Cloud Functions

Three functions, no more. Own `functions/` workspace with its own `package.json`, tsconfig, and CI sub-pipeline.

### Task 12.1 — `functions/` workspace + CI

**Description:** `functions/` pnpm workspace. TypeScript, esbuild or tsc. Firebase Functions v2 APIs. Own lint + test. Add CI sub-job.

**Acceptance criteria:**
- `cd functions && pnpm build` succeeds.
- CI builds + tests functions in parallel with app pipeline.

**Verification:**
- CI green with a placeholder function.

**Dependencies:** 0.4.
**Files likely touched:** `functions/package.json`, `functions/tsconfig.json`, `functions/src/index.ts`, `.github/workflows/ci.yml`.
**Estimated scope:** S.

### Task 12.2 — `onCommentCreate` (mention notifications)

**Description:** `onCreate` trigger on `meetings/{date}/comments/{id}`. Reads `mentionedUids`, sends FCM to each user's tokens, prunes dead tokens.

**Acceptance criteria:**
- No mentions → no notifications.
- Dead-token errors remove the token from the member doc.
- Emulator test runs the function against seeded data.

**Verification:**
- Functions unit test with firebase-functions-test.

**Dependencies:** 12.1, 9.2.
**Files likely touched:** `functions/src/onCommentCreate.ts`, `functions/test/onCommentCreate.test.ts`.
**Estimated scope:** M.

### Task 12.3 — `onMeetingWrite` (change notifications + debounce)

**Description:** `onWrite` on `meetings/{date}` + speakers subcollection. Diff before/after. Skip `updatedAt`-only. Coalesce writes within 60s via a pending-notification doc + scheduled drain.

**Acceptance criteria:**
- Writer excluded from recipients.
- Non-meeting Sundays skipped.
- Cancellation produces the "Meeting cancelled" wording.
- Debounce: 5 rapid writes → 1 notification.

**Verification:**
- Functions unit tests cover diff, debounce coalescing, writer-exclusion, skip conditions.

**Dependencies:** 12.1, 5.2.
**Files likely touched:** `functions/src/onMeetingWrite.ts`, `functions/src/diff.ts`, `functions/src/debounce.ts`, tests.
**Estimated scope:** L — consider splitting into `onMeetingWrite` (diff/write pending) and `drainPendingNotifications` (scheduled drain).

### Task 12.4 — `scheduledNudges` (finalization nudges)

**Description:** Hourly `pubsub.schedule` cron. For each ward, check upcoming Sunday; send appropriate nudge based on per-ward schedule + meeting state. Idempotent via `lastNudgedAt`.

**Acceptance criteria:**
- Wed/Fri/Sat schedule per ward honored in ward's local timezone.
- Targeting rules: draft → whole team; pending_approval → non-approvers only; missing → whole team with different message.
- Cancelled / non-meeting Sundays skipped.
- Retry scenario doesn't double-send.

**Verification:**
- Unit tests with mocked clock covering each schedule slot + targeting.

**Dependencies:** 12.1, 7.2, 11.1.
**Files likely touched:** `functions/src/scheduledNudges.ts`, tests.
**Estimated scope:** L — consider splitting into `computeNudges` (pure) + `sendNudges` (effectful).

### Checkpoint: Functions deployed

- [ ] All three functions run against emulator in CI.
- [ ] Deployed to dev Firebase project; smoke-tested manually.
- [ ] Blaze plan confirmed on production project.

---

## Phase 13 — FCM subscribe flow

### Task 13.1 — Service workers

**Description:** `public/firebase-messaging-sw.js` for background FCM. PWA SW (from `vite-plugin-pwa`) coexists. Document registration order in a README.

**Acceptance criteria:**
- Both SWs register without conflict.
- Background notification arrives with app closed.

**Verification:**
- Manual: send test push via Firebase Console → receive while tab closed.

**Dependencies:** 12.2.
**Files likely touched:** `public/firebase-messaging-sw.js`, `vite.config.ts`, `src/lib/pwa.ts`.
**Estimated scope:** M.

### Task 13.2 — Subscribe prompt + token lifecycle

**Description:** After sign-in, one-time prompt "Subscribe to program updates". `Notification.requestPermission()` → get FCM token → save to `members/{uid}/fcmTokens`. `useNotificationsStore` tracks local state + prompt-dismissed flag (persisted).

**Acceptance criteria:**
- Multiple devices produce multiple tokens.
- Settings → "Devices" lists tokens with "updatedAt" + "Remove".
- iOS Safari (non-PWA) sees an "Add to Home Screen" nudge BEFORE the permission prompt.

**Verification:**
- Manual: subscribe on Chrome desktop + iOS PWA.
- Unit: store transitions.

**Dependencies:** 13.1.
**Files likely touched:** `src/features/notifications/SubscribePrompt.tsx`, `src/features/notifications/useFcmToken.ts`, `src/stores/notificationsStore.ts`, `src/features/notifications/iosInstallNudge.ts`.
**Estimated scope:** M.

### Checkpoint: Push live

- [ ] Can subscribe, receive push in foreground + background, revoke, add device.

---

## Phase 14 — PWA, rules coverage, launch prep

### Task 14.1 — PWA manifest + icons

**Description:** `public/manifest.webmanifest`, app icons (192/512/maskable), `vite-plugin-pwa` configured, install prompt surfaced on supported platforms.

**Acceptance criteria:**
- Lighthouse PWA audit green on preview.
- Installable on Android/desktop/iOS.

**Verification:**
- Lighthouse run locally.

**Dependencies:** 13.1.
**Files likely touched:** `public/manifest.webmanifest`, `public/icons/*`, `vite.config.ts`.
**Estimated scope:** S.

### Task 14.2 — Rules test suite completion

**Description:** Fill all remaining permission boundaries per [docs/engineering.md](../docs/engineering.md#testing): non-member, clerk, cross-ward, inactive, email-mismatch, hash-based invalidation, comment edit/delete.

**Acceptance criteria:**
- Every rules path covered with at least allow + deny tests.
- CI runs the full suite.

**Verification:**
- `pnpm test:rules` green with the expanded suite.

**Dependencies:** All previous rules tasks.
**Files likely touched:** `tests/rules/*.test.ts`.
**Estimated scope:** M.

### Task 14.3 — Playwright critical-flow suite

**Description:** Playwright specs cover: sign-in, create meeting, schedule speaker, send letter (mailto URL shape), approve program (two users), print each view, comment + mention.

**Acceptance criteria:**
- All specs green against emulator + preview build.
- Runs in CI in under 10 minutes.

**Verification:**
- `pnpm test:e2e` green locally and in CI.

**Dependencies:** All feature phases.
**Files likely touched:** `e2e/*.spec.ts`.
**Estimated scope:** M.

### Task 14.4 — Production deploy

**Description:** Point `main` → Vercel production. Production Firebase project ready (Blaze). Deploy functions + rules + indexes. Smoke-test live.

**Acceptance criteria:**
- Production URL serves the app.
- Real bishopric member (test ward) can sign in, schedule a speaker, send a letter.
- Cloud Functions logs show expected invocations.

**Verification:**
- Manual smoke with the bishop.

**Dependencies:** All prior.
**Files likely touched:** Firebase CLI deploy targets, Vercel prod config.
**Estimated scope:** M.

### Checkpoint: Launch

- [ ] Real ward bootstrapped in production.
- [ ] Documented rollback plan.
- [ ] On-call / triage plan for first week.

---

## Parallelization notes

- **Parallel-safe within a phase** once the scaffold exists: e.g., Phase 5 sections (`AssignmentField`, `HymnPicker`, cancellation) can be built independently after 5.1 lays the route.
- **Sequential bottlenecks:** 0 → 1 → 2 → 3 is strictly serial. After Phase 5 lands, Phases 6 / 7 / 8 / 9 / 10 can be parallelized across sessions — they share only the meeting editor surface.
- **Rules tests grow in parallel with each phase.** Don't batch them into Phase 14.2.

## Risks & mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| iOS Web Push only works for installed PWAs | Med | Surface "Add to Home Screen" nudge before prompt (13.2); document in release notes. |
| FCM SW + PWA SW registration conflicts | Med | Bake the fix into 13.1 and document; Vitest can't catch this — manual check required. |
| Cloud Functions cold starts delay change notifications | Low | 60s debounce masks it; v2 min-instances=0 is fine for v1. |
| Rules complexity → approval logic drifts from tests | High | Rules tests are CI-blocking; grow suite with each phase, not at the end. |
| 150 LOC cap fights with editor forms | Med | Split into section components early; sections map to natural subcomponents anyway. |
| Firestore composite indexes missed → sign-in breaks | High | Document every index in `firestore.indexes.json` + deploy as part of launch; 2.2 calls this out explicitly. |
| Blaze plan forgotten until Phase 12 deploy | Med | Flag at ward bootstrap (2.3) and in Phase 12 kickoff; block Phase 12 merge until confirmed. |

## Open questions (block Phase 0 start)

1. Confirm working-assumption defaults (hymn JSON, bishopric-manages-members, pnpm)?
2. Firebase project names — `steward-dev` and `steward-prod` acceptable, or preferred naming?
3. Target launch ward — is there a real ward lined up for Phase 14, or are we launching with a synthetic test ward first?
4. Any constraints on bundle size / older-browser support (iOS 16.4 is the FCM floor; anything else)?

---

*Update this plan as decisions land. Reference it from commit messages / PR descriptions so the history stays legible.*
