# Steward — Bishopric App

PWA for a ward bishopric to plan weekly sacrament meeting programs. Desktop + mobile, single codebase.

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind
- **Build**: Vite (with PWA plugin)
- **Data**: Firebase — Firestore, Auth (Google), FCM
- **Hosting**: Vercel (app); Firebase is data + auth only
- **State**: direct Firestore subscription hooks + Zustand for client state (no Redux, no React Query)
- **Forms**: React Hook Form + Zod
- **Email**: `mailto:` only (no server-side sending)
- **Lint**: oxlint &nbsp;·&nbsp; **Format**: Biome (formatter mode; linter disabled)
- **Test**: Vitest + Playwright + `@firebase/rules-unit-testing`, against Firebase Local Emulator Suite
- **Backend**: exactly three Firebase Cloud Functions (change notifications, finalization nudges, mention notifications). No API server.

## Hard rules

- **Everything is always editable.** No field locks based on status; status is a label, never a gate. Editing an `approved` program invalidates approvals (logged, not deleted).
- **Components ≤ 150 LOC.** Enforced by oxlint `max-lines` + `max-lines-per-function` (error, not warn).
- **Only three Cloud Functions.** No API server, no custom endpoints. Firestore rules are the rest of the backend.
- **Multi-ward from day one.** All data scoped under `wards/{wardId}/`.
- **Every push to `develop` runs the full CI pipeline.** Lint + format + typecheck + unit + rules + e2e. All must pass; no retries on flakes.

## Directory layout

```
src/
  app/              # routes, root layout
  stores/           # Zustand: authStore, currentWardStore, uiStore, notificationsStore
  hooks/            # Firestore subscription hooks — useMeeting, useSpeakers, useComments, etc.
  features/
    schedule/       # speaker schedule view — primary planning workspace
    meetings/       # weekly program editor
    speakers/       # speaker form, letter composer
    comments/       # thread UI, mention autocomplete
    assignments/    # shared assignment UI (person + status)
    hymns/          # hymn picker
    print/          # print views
    notifications/  # subscribe flow, settings, FCM client setup
  lib/
    firebase.ts
    types.ts        # domain types / Zod schemas
  components/ui/    # shadcn-style primitives
  styles/
public/
  manifest.webmanifest
  firebase-messaging-sw.js
  icons/
functions/          # Firebase Cloud Functions
  src/
    onMeetingWrite.ts      # change notifications
    scheduledNudges.ts     # finalization nudges (hourly cron)
    onCommentCreate.ts     # @mention notifications
```

## Routes

`/` · `/schedule` · `/week/:date` · `/week/:date/speaker/:id/letter` · `/print/:date/conducting` · `/print/:date/congregation` · `/settings`

## Commands

- `npm run dev` · `npm run build` · `npm run preview`
- `npm run lint` — oxlint
- `npm run format` / `format:check` — Biome
- `npm run typecheck` — `tsc --noEmit`
- `npm run test` — Vitest
- `npm run test:rules` — Firestore rules (emulator)
- `npm run test:e2e` — Playwright (emulator + preview)
- `npm run test:all` — CI target
- `npm run emulators` — Firebase Local Emulator Suite

## Topic docs — load on demand for the current task

- **[docs/domain.md](docs/domain.md)** — data model, Firestore shape, meeting types, cancellation, approval lifecycle, audit trail
- **[docs/features.md](docs/features.md)** — feature list, speaker scheduling, comments, email status tracking, letter templates, print views
- **[docs/notifications.md](docs/notifications.md)** — push subscribe flow, change notifications, finalization nudges, mention notifications, iOS caveats
- **[docs/access.md](docs/access.md)** — roles matrix, sign-in allowlist, ward bootstrap, email CC policy
- **[docs/engineering.md](docs/engineering.md)** — state management, component size limit, lint/format, testing, CI

## Decisions (resolved)

1. **Hymn list**: ship JSON in repo (`src/features/hymns/hymns.json`).
2. **Member management**: any active `bishopric` member can add/remove/deactivate the ward roster in-app.
3. **Package manager**: pnpm (workspace root + `functions/`).

---

*North star for v1. Update decisions here; move deep context into the topic docs.*
