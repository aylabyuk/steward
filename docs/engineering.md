# Engineering — state, testing, tooling, CI

## State management

Two categories, two mechanisms.

### Server state — direct Firestore hooks

Firestore is already reactive, cached, offline-capable. Lean on it.

**Convention**: each hook wraps `onSnapshot`, returns `{ data, loading, error }`, unsubscribes on unmount.

Examples:
- `useMeeting(date)`, `useSpeakers(date)`, `useComments(date)`
- `useUpcomingMeetings(horizonWeeks)` — schedule view
- `useWardSettings(wardId)`, `useWardMembers(wardId)`

**Writes**: call the Firestore SDK directly from event handlers. Local cache gives optimistic behavior for free; the snapshot listener reconciles with the server ack.

**Why not React Query / RTK Query**: Firestore is stream-shaped; those libraries are request/response-shaped. Wrapping `onSnapshot` in `queryFn` adds a layer without adding capability.

### Client state — Zustand

- `useAuthStore` — Firebase Auth user + sign-in status. Init via `onAuthStateChanged` on app mount.
- `useCurrentWardStore` — active `wardId` only. Actual ward data comes from hooks.
- `useUIStore` — modal state, toasts, editor dirty flags, print-view toggles.
- `useNotificationsStore` — FCM permission status, current token, subscribe-prompt dismissed flag.

Small stores, focused concerns. Zustand is ~1KB, no provider. Derived state computed inline or via selectors. No `reselect` unless profiling says so.

**Persistence**: Zustand `persist` middleware only for the few things worth it (e.g., subscribe-prompt dismissed). Most state derives from Firestore on mount.

## Lint & Format

**Linter: `oxlint`**
- Rust-based, ~50–100× faster than ESLint.
- Config: `.oxlintrc.json`.
- Caveats:
  - No type-aware rules yet. For things like exhaustive-switch, rely on strict `tsc`.
  - Smaller plugin ecosystem. If a critical rule is missing, add ESLint back *only for that rule*, don't ditch oxlint.

**Formatter: Biome (formatter-only mode)**
- `"linter": { "enabled": false }` so it doesn't fight oxlint.
- Prettier-compatible output.
- `biome format --write` / `biome format` (check only).

**Alternatives considered**: dprint (more flexible; overkill for single-package), Prettier (valid escape hatch — swap painlessly since Biome matches its output), oxfmt (too early; revisit v1.1).

## Component size limit (oxlint-enforced)

**Hard rule**: no component file exceeds **150 LOC**. If it does, split it.

**Enforced by oxlint** (error, not warn):
- `max-lines` — file-level: `{ "max": 150, "skipBlankLines": true, "skipComments": true }`
- `max-lines-per-function` — function-level: same + `"IIFEs": true`

**When to split**:
- Multiple distinct sections → extract sub-components.
- Multiple `useEffect`s with different concerns → custom hooks.
- Complex form logic → dedicated form component/hook.
- Large static content (e.g., letter template) → constants file.

**Escape hatch** (<5 uses expected):
```ts
// oxlint-disable-next-line max-lines-per-function -- <reason>
```

**Pure data files** (hymn list, etc.) can exceed the file cap via override if they're truly just data.

## Testing

**Unit / component — Vitest**
- Shares Vite config.
- Cover: Zustand store logic, Firestore hook contracts (mock SDK), letter template rendering, audit-trail diff computation, meeting-type UI gating.
- Target tests for every non-trivial hook and store. Don't chase component-render coverage.

**E2E — Playwright**
- Against the Firebase emulator (not production).
- Critical flows: sign-in happy path, create meeting, schedule speaker, send letter (verify `mailto:` URL shape), approve program, print each view, comment + mention.

**Firestore rules — `@firebase/rules-unit-testing`**
- Every permission boundary. Cover: non-member can't read/write, clerk can't approve, cross-ward blocked, inactive locked out, email-mismatch rejected, content-hash-based approval invalidation logic.

**Local harness — Firebase Local Emulator Suite**
- Emulates Auth, Firestore, Functions, FCM.
- E2E and rules tests share the same config.

## CI

GitHub Actions, runs on every push to `develop` **and** every PR targeting `develop` or `main`.

**Pipeline** (all steps must pass; no retries):
1. Install deps
2. `npm run lint` — oxlint
3. `npm run format:check` — Biome
4. `npm run typecheck` — `tsc --noEmit`
5. `npm run test` — Vitest
6. `npm run test:rules` — Firestore rules (emulator)
7. `npm run test:e2e` — Playwright (emulator + preview)

Cloud Functions have their own sub-pipeline in `functions/` (parallel).

**Branches**:
- `main` → Vercel production.
- `develop` → default working branch. Every push runs the pipeline.
- Feature branches → PR into `develop`. Vercel preview deploy per PR.
- `develop` → `main` = periodic promotion PR, triggers production deploy.

**Workflow file**: `.github/workflows/ci.yml`.
