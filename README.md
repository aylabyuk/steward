# Steward

A progressive web app for a ward bishopric to plan weekly sacrament
meetings. Desktop + mobile from a single codebase.

## Stack

- **Frontend**: React 19 · TypeScript · Tailwind v4 (with `@theme` tokens) · Vite
- **Data / auth**: Firebase (Firestore + Auth + FCM)
- **Hosting**: Vercel for the app; Firebase for data + auth only
- **State**: direct Firestore subscription hooks + Zustand (no Redux, no React Query)
- **Forms**: React Hook Form + Zod
- **Email**: `mailto:` only — no server-side sending
- **Tests**: Vitest (unit + Firestore rules against the emulator) + Playwright (e2e)
- **Backend**: exactly three Firebase Cloud Functions (change notifications, finalization nudges, mention notifications). No API server — Firestore rules are the rest of the backend.

## Getting started

```bash
pnpm install
pnpm emulators    # Firebase emulator suite (data + auth)
pnpm dev          # Vite dev server
```

Then sign in at <http://localhost:5173/login>. If this is a fresh emulator, bootstrap a ward first:

```bash
FIRESTORE_EMULATOR_HOST=localhost:8080 \
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
GCLOUD_PROJECT=steward-dev-5e4dc \
pnpm bootstrap-ward \
  --ward-id=stv1 \
  --ward-name="Eglinton Ward" \
  --bishop-email=you@example.com \
  --bishop-name="Your Name" \
  --bishop-calling=bishop \
  --timezone=America/Toronto
```

Emulator data persists across restarts via `--import/--export-on-exit ./emulator-data/` — wired into the `emulators` script.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Vite dev server (port 5173) |
| `pnpm build` | Production build into `dist/` |
| `pnpm emulators` | Firebase emulator suite (auth + firestore) with persistence |
| `pnpm test` | Vitest unit tests |
| `pnpm test:rules` | Firestore rules tests against emulator |
| `pnpm test:e2e` | Playwright e2e |
| `pnpm lint` | oxlint (errors fail CI) |
| `pnpm format:check` | Biome format check |
| `pnpm format` | Biome format write |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm bootstrap-ward` | Seed a ward + first bishopric member |
| `pnpm add-member` | Add a member by email (resolves the Firebase Auth UID) |

## Routes

`/` · `/schedule` · `/week/:date` · `/week/:date/speaker/:id/letter` · `/print/:date/conducting` · `/print/:date/congregation` · `/accept-invite/:wardId` · `/settings` · `/settings/ward` · `/settings/members` · `/settings/notifications`

## Versioning + releases

The app follows [SemVer](https://semver.org/) with a pre-1.0 interpretation:

| Bump | Trigger |
| --- | --- |
| **Major** (`1.0.0+`) | Breaking Firestore schema changes, destructive migrations, or major UX pivots |
| **Minor** (`0.x.0`) | New user-facing features |
| **Patch** (`0.0.x`) | Bug fixes, non-functional tweaks |

Every release:

1. Update `CHANGELOG.md` with entries grouped **Added / Changed / Fixed / Security**.
2. Bump `package.json` version.
3. PR from `develop` → `main` (**"Create a merge commit"**, not rebase-and-merge).
4. After merge, realign `develop` to `main` and deploy Firestore rules + indexes to `steward-prod-65a36`. Full sequence lives in the [release-to-main skill](.claude/skills/release-to-main.md).

See [`CHANGELOG.md`](CHANGELOG.md) for the release log.

## Design system

Walnut / parchment / brass / bordeaux design tokens in
[`src/styles/index.css`](src/styles/index.css) using Tailwind v4 `@theme`.
Typography: Newsreader (serif/display), Inter (sans), IBM Plex Mono.
Design prototypes that spawned the v2 redesign live under
[`design/v2-*/`](design/) — reference material, not app code.

## Topic docs

- [`docs/domain.md`](docs/domain.md) — data model, Firestore shape, meeting types, cancellation, approval lifecycle, audit trail
- [`docs/features.md`](docs/features.md) — feature list, speaker scheduling, comments, email status, letter templates, print views
- [`docs/notifications.md`](docs/notifications.md) — push subscribe flow, nudges, mentions, iOS caveats
- [`docs/access.md`](docs/access.md) — roles matrix, sign-in allowlist, ward bootstrap, email CC policy
- [`docs/engineering.md`](docs/engineering.md) — state management, component size limit, lint/format, testing, CI

## License

Private — for the ward this is built for.
