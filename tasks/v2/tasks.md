# v2 Task list

Every Phase-B+ component ≤ 150 LoC (oxlint enforced).

## Phase A — Foundation
- [ ] **A1** Self-host Inter + Newsreader + IBM Plex Mono in `public/fonts/` + `@font-face` in `index.css`
- [ ] **A2** `@theme` block in `src/styles/index.css` — all tokens (palette, fonts, shadows, easings, spacing, radii, type scale)
- [ ] **A3** `@layer base` essentials — body defaults, `::selection`, warm focus ring, keyframes, `paper-grain` `@utility`
- [ ] **A4** `src/lib/cn.ts` (clsx + tailwind-merge); add `tailwind-merge` dep if missing
- [ ] **A5** `src/app/components/AppShell.tsx` + `Topbar` + `UserMenu` (wired to `authStore`)

## Phase B — Schema + delete sweep
- [ ] **B1** Add `speakerStatusSchema`, new `MEETING_TYPES`, `role` field on speaker; drop letter fields (`src/lib/types/meeting.ts`)
- [ ] **B2** Delete all files in [deletions.md](./deletions.md)
- [ ] **B3** Remove `match /letterTemplates` block in `firestore.rules`; delete the rules test
- [ ] **B4** Enum-literal rename sweep across all caller files (see [schema.md](./schema.md))
- [ ] **B5** Update router + settings hub — remove 4 deleted routes
- [ ] **B6** Simplify `contentHash.ts` — drop `letterBody` from hash input
- [ ] **B7** Update `scripts/bootstrap-ward.ts` — drop letter-templates seed
- [ ] **B8** Docs: `docs/domain.md`, `docs/features.md`, `docs/access.md`, `CLAUDE.md`
- [ ] **B9** `pnpm test:all` green before Phase C

## Phase C — Schedule page
- [ ] **C1** `HorizonSelect` — 1/2/3/6/12 months popover, `localStorage`, months→weeks for query
- [ ] **C2** `PageHead` — eyebrow / title / italic sub / right slot
- [ ] **C3** `groupByMonth` util (+ unit test)
- [ ] **C4** `kindLabel` util (+ unit test) — `MeetingType` → `{ label, variant }`
- [ ] **C5** `SundayCard` (≤150 LoC) — date-btn → `/week/:date`, kind chip, overflow menu (change type, cancel), short-notice callout
- [ ] **C6** `SundayCardBody` — empty / fast-stamp / `SpeakerRow` list via `useSpeakers`
- [ ] **C7** `SpeakerRow` + `StatePill` — number + name + italic topic + state pill
- [ ] **C8** `AssignDialog` — modal desktop, slide-over sheet mobile (`matchMedia`)
- [ ] **C9** `SpeakerEditor` (≤150 LoC) — state pills, invite-action strip, Name/Email/Topic/Role grid; syncs via `speakerActions.upsert`
- [ ] **C10** `QuarterSection` — title + count meta + grid
- [ ] **C11** `printInvitationLetter(speaker, sundayDate)` helper — pure, opens new window with templated HTML
- [ ] **C12** Rewrite `ScheduleView.tsx` — compose AppShell + PageHead + QuarterSection + SundayCard; keep `SubscribePrompt`
- [ ] **C13** Delete `MeetingCard.tsx` + `SpeakerSection.tsx`
- [ ] **C14** Preserve cancellation banner + comment-unread badge in new styling

## Phase D — QA
- [ ] **D1** Vitest unit — `groupByMonth`, `kindLabel`, month→week conversion, `SpeakerStatus` round-trip, letter-template render snapshot
- [ ] **D2** Vitest component — `SundayCard` kind variants, short-notice logic, `HorizonSelect` persistence
- [ ] **D3** Playwright (emulator) — schedule loads; horizon persists across reload; assign dialog opens; add speaker round-trips; print-letter new window opens
- [ ] **D4** `pnpm test:all` green; all new components ≤ 150 LoC
- [ ] **D5** Update `tasks/plan.md` with a v2 phase reference + memory phase-progress note
