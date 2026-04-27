# Steward — Bishopric App

PWA for a ward bishopric to plan weekly sacrament meeting programs. Desktop + mobile, single codebase.

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind
- **Build**: Vite (with PWA plugin)
- **Data**: Firebase — Firestore, Auth (Google), FCM
- **Hosting**: Vercel (app); Firebase is data + auth only
- **State**: direct Firestore subscription hooks + Zustand for client state (no Redux, no React Query)
- **Forms**: React Hook Form + Zod
- **Email**: SendGrid (transactional — invitation letters, chat reply notifications)
- **SMS + in-app chat**: Twilio Conversations (bridges the speaker's phone SMS and their web invite page into a single thread — speakers can reply from either side)
- **Lint**: oxlint &nbsp;·&nbsp; **Format**: Biome (formatter mode; linter disabled)
- **Test**: Vitest + Playwright + `@firebase/rules-unit-testing`, against Firebase Local Emulator Suite
- **Backend**: eight Firebase Cloud Functions — `onMeetingWrite` (change notifications), `scheduledNudges` (finalization cron, hourly), `drainNotificationQueue` (drains the per-ward notification queue once a minute, sends FCM multicasts for due entries), `onCommentCreate` (@mention notifications), `sendSpeakerInvitation` (callable: creates invitation + delivers email/SMS + a hashed capability token), `issueSpeakerSession` (callable: exchanges an invitation capability token for a Firebase custom token + Twilio Conversations JWT; self-heals consumed/expired tokens by rotating + resending the SMS), `onInvitationWrite` (Firestore trigger: fires receipt emails on authoritative response transitions — speaker gets a Yes/No confirmation, bishopric gets an Apply notice), `onTwilioWebhook` (HTTPS: receives Conversations events, fans out FCM to bishopric + email to speaker). No API server beyond these.

## Hard rules

- **Everything is always editable.** No field locks based on status; status is a label, never a gate. Editing an `approved` program invalidates approvals (logged, not deleted).
- **Components ≤ 150 LOC.** Enforced by oxlint `max-lines` + `max-lines-per-function` (error, not warn).
- **Eight Cloud Functions, no API server.** The list above is the full surface; expanding it requires a deliberate scope decision. Firestore rules carry the rest of the authorization logic.
- **Multi-ward from day one.** All data scoped under `wards/{wardId}/`.
- **No direct pushes to `develop` or `main`.** Every change flows through a PR: feature branch → PR into `develop` (see the [`feature-branch-workflow`](.claude/skills/feature-branch-workflow.md) skill); releases go via PR from `develop` → `main` (see [`release-to-main`](.claude/skills/release-to-main.md)). GitHub's free tier doesn't enforce this — discipline does. No force-pushes to either branch, ever.
- **No stacked PRs.** Every PR's base must be `develop` (or `main` for a release PR), never another feature branch. Stacked PRs orphan the moment the parent branch is deleted post-merge — finished work strands outside `develop` and won't ship. If a feature splits into multiple PRs, merge the foundation into `develop` first, then branch the next slice off the new `develop`.
- **Merge-commit is the only enabled merge method** at the repo level (squash + rebase disabled). Keeps `develop` and `main` SHA-aligned and prevents "N ahead / N behind" drift.
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
    onMeetingWrite.ts           # change notifications
    scheduledNudges.ts          # finalization nudges (hourly cron)
    drainNotificationQueue.ts   # per-ward notification queue drainer (every-minute cron)
    onCommentCreate.ts          # @mention notifications
    sendSpeakerInvitation.ts    # callable: create invitation + deliver via SendGrid + Twilio; issues a hashed capability token
    issueSpeakerSession.ts      # callable: exchange capability token for Firebase custom token + Twilio JWT; self-heals via rotation
    onInvitationWrite.ts        # Firestore trigger: speaker + bishopric receipt emails on response transitions
    onTwilioWebhook.ts          # HTTPS: Twilio Conversations events → FCM / SendGrid fan-out
    invitationToken.ts          # shared capability-token helpers (generate / hash / timing-safe compare / rotation bucket)
    invitationDelivery.ts       # shared SMS + email delivery paths (trySms / tryEmail / sendInvitationSms)
    messageTemplates.ts         # interpolate + readMessageTemplate (falls back to default when doc absent)
    twilio/, sendgrid/          # thin transport wrappers
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

## Backlog hygiene — log before you forget

When you discover a bug, feature gap, or tech-debt item mid-session
that you're NOT going to fix in the next step, proactively ask the
user once: *"Log this as a GitHub issue, or skip?"* Use the
[`log-issue`](.claude/skills/log-issue.md) skill to file it. The
threshold: if it's a 10-minute fix you're about to make anyway, skip.
Everything else — things you're documenting but not fixing, feature
ideas mentioned in passing, known shortcuts — should get an issue so
it doesn't evaporate in chat history.

Issue templates live at `.github/ISSUE_TEMPLATE/` (bug / feature /
tech-debt). Commit messages that resolve an issue should use
`Fixes #N` so the PR auto-closes on merge to `main`. Changelog
entries reference the issue inline as `(#N)`.

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
