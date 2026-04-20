# v2 Decisions (locked 2026-04-20)

## Source of truth
Strict reading of `design/v2-schedule/`. Where code differs, change the code.

## Styling
Pure Tailwind v4. Tokens via `@theme` block in `src/styles/index.css`. No
component-CSS files. Raw CSS kept only for: `@font-face`, `::selection`,
focus-visible ring, keyframes, body defaults, paper-grain `@utility`.
`clsx + tailwind-merge` via `src/lib/cn.ts`.

## Shell
Sidebar-less. Sticky topbar (brand + UserMenu) inside `AuthGate` outlet.

## Horizon
UI in months (1 / 2 / 3 / 6 / 12), persisted to `localStorage`. Firestore
setting stays `scheduleHorizonWeeks`; convert months → weeks at query time.

## Assign flow
Modal on desktop, slide-over sheet on mobile (`matchMedia`).

## Speaker status
4 values: `planned / invited / confirmed / declined`. Dedicated
`SpeakerStatus` enum, decoupled from 8-state `AssignmentStatus` (which stays
for prayers/music). Round-tripped 1:1 with UI — no projection util.

## Meeting type
4 values: `regular / fast / stake / general`. Drops `ward_conference` and
`other`.

## Letter composer
Removed. No `/letter` route, no `letterTemplates` collection, no persistence.
Letters are generated inline from `SpeakerEditor` via HTML template opened in a
new window (matches design pattern).

## Print views
Removed. No `/print/:date/*` routes. No replacement this branch — browser
print on the (pending-redesign) week editor is the interim story until a
future iteration picks a new program-print strategy.

## Preserved affordances (not in mock)
Cancellation banner, approval state, unread-comments badge — kept, restyled
in v2 tokens.

## Out of scope this branch
`/week/:date` editor redesign, settings redesign, login redesign, new print
strategy. Only enum-rename churn touches those files this pass.

## Launch-risk note
Phase 14.4 (prod deploy) hasn't shipped → no prod data → schema change is
clean-slate safe. No runtime migration needed.
