# Features (v1)

1. **Speaker Schedule view** — primary workspace. Plan speakers 4–8 weeks ahead. Calendar-style cards.
2. **Weekly Program view** — specific Sunday editor. Speakers already filled from schedule; finalize hymns, pianist, chorister, bread, blessers, special number, business/announcements.
3. **Inline assignment status updates.**
4. **Auth** — Google sign-in; ward team only (see [access.md](access.md)).
5. **Push notifications** on program changes + mentions + finalization nudges (see [notifications.md](notifications.md)).
6. **Comments** — flat thread per meeting, `@mentions`, edit/delete own.
7. **Copy from previous week** — one-click carry-over of pianist/chorister/blessers/bread. Speakers + topics NOT copied.
8. **Audit trail** — see [domain.md#audit-trail](domain.md).

## Speaker scheduling

The whole point: avoid last-minute scrambles. Speakers are planned ahead, not week-of.

**Minimum lead time** (ward setting, default 14 days). Not hard-blocked — last-minute substitutes are possible — just warned.

### Planning is restricted to the upcoming Sunday

Editing only happens for the **upcoming Sunday** — the soonest Sunday that hasn't ended yet in the ward's local timezone. Everything else stays visible (so leadership sees what's coming) but is read-only.

- The schedule page surfaces this with a banner at the top: *"Planning is open for {Sunday}. Other Sundays are view-only."* Future cards drop their date link, switch their countdown to *"Opens Mon, {date}"*, and disable inline assignment / type controls.
- Today's Sunday stays editable until local midnight; the next Sunday opens at 00:00 local Monday. The Monday-morning planning-OPEN push (separate cron, see [notifications.md](notifications.md)) is the prompt to start.
- The week editor (`/week/:date`) renders a read-only banner and inert program sections when the loaded date isn't the upcoming Sunday. Past meetings stay viewable for archive (printable copies still resolve via the readiness gate); future Sundays are previewable.
- The helper that drives this is `getUpcomingSundayIso(now, tz)` in [src/lib/dates.ts](../src/lib/dates.ts) — single source of truth for both the schedule-page chrome and the editor's gate.

**Workflow**:
1. Open Speaker Schedule → cards for next N Sundays. Only the upcoming card is interactive.
2. Add speakers (name, email, topic) for the upcoming Sunday. Each becomes a doc under `meetings/{date}/speakers/{id}`.
3. Send invitations from the schedule view. Status moves `draft` → `invite_emailed` / `invite_printed` → `accepted` / `declined`.
4. Decline → slot empty → pick someone else, still with lead time.
5. Week-of: Weekly Program view has speakers ready; bishopric fills remaining non-speaker fields.

**No separate schedule collection** — `meetings/{date}` docs ARE the schedule, created in advance. A meeting doc with only speakers filled = a planned-but-not-finalized Sunday.

**Lead-time warnings** (non-blocking):
- < 14 days: yellow — *"Less than 2 weeks notice — consider a later week."*
- < 7 days: red — *"Short notice. Confirm directly."*

Other assignments (pianist/chorister/blessers/bread) can be pre-planned from the schedule view (stretch); primary flow is the Weekly Program view.

## Comments

Flat thread at the bottom of each Weekly Program view. Surfaced on schedule cards with a count badge.

**v1 scope**:
- Flat (no replies/threading).
- `@mention` autocomplete against ward member list.
- Edit/delete own comments; soft-deleted show as "deleted" to preserve context.
- Live updates via Firestore listener.
- Plain text only (no reactions, attachments, rich text).

**Mention extraction**: client resolves `@name` against members at submit time → writes `mentionedUids[]` to the doc.

**Permissions**: any ward member creates; author edits/deletes own (soft delete via `deletedAt`); no one else can edit/delete.

**Critical separation from program state**:
- Comments do NOT trigger change-based push notifications.
- Comments do NOT contribute to `contentVersionHash` — commenting on an approved program does not invalidate approvals.

**UI**: collapsible panel at page bottom. Unread badge = `lastReadAt` vs. latest comment `createdAt`. Mention notifications live in [notifications.md](notifications.md).

## Email status tracking (mailto:)

`mailto:` is fire-and-forget — no delivery confirmation. UX pattern:

1. Click "Send email" → open `mailto:` link + optimistically set status to `invite_emailed` (timestamped, records `sentBy`).
2. Inline banner: *"Marked as emailed. [Undo] [Didn't send]"*.
3. One click reverts if user closed mail client without sending.

Honest framing: we track *"user says they sent it"*, not SMTP delivery. Fine for a ward tool — humans still follow up.

Same pattern for printed letters: "Print letter" → print dialog → status `invite_printed` + undo.


## Out of scope for v1

- Roster / membership import
- Calendar integrations
- Speaker rotation / history analytics ("last spoke N months ago")
- Server-side email sending
- Time estimates / program pacing
- i18n / multi-language
- Stake-level read access
- Standing assignments (v1.1 via `defaultPianistUid`)

These are v2 candidates. Keep the data model flexible so they can be added without migration.
