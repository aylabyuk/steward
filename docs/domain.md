# Domain model

Core entity: **SacramentMeeting** per Sunday date.

## SacramentMeeting

- `date` — ISO `YYYY-MM-DD`
- `meetingType` — `regular` | `fast` | `stake` | `general`
- `cancellation` — `{ cancelled, reason, cancelledAt, cancelledBy }`
- `contentVersionHash` — cheap hash of current content; the meeting-change cron uses it to detect real edits vs noise
- `openingHymn`, `sacramentHymn`, `closingHymn` — Hymn assignments
- `openingPrayer`, `benediction` — Person + status
- `speakers[]` — subcollection (variable count), 2+ for `regular`; disabled for `fast`
- `specialNumber` — optional (performer name, piece title, status)
- `sacramentBread` — Person + status
- `sacramentBlessers[]` — 2 Melchizedek Priesthood holders, Person + status
- `pianist`, `chorister` — Person + status
- `wardBusiness`, `stakeBusiness`, `announcements` — multiline text
- `presiding`, `conducting` — Person (optional, v1.1)

### Person

Lightweight: `name`, `email` (optional), `phone` (v1.1). Inline on the assignment. Promote to a shared `People` collection later if names recur.

### Assignment statuses

`not_assigned` | `draft` | `invite_printed` | `invite_emailed` | `notified` | `accepted` | `declined` | `completed`

### Speaker statuses

`planned` | `invited` | `confirmed` | `declined`

## Firestore shape

```
wards/{wardId}/
  - name
  - settings: {
      timezone,
      speakerLeadTimeDays,         # default 14
      scheduleHorizonWeeks,        # default 8
      nonMeetingSundays: [{ date, type, note? }],
      nudgeSchedule: { wednesday, friday, saturday },
      emailCcDefaults,
      defaultPianistUid (v1.1)
    }
  members/{memberUid}
    - email, displayName
    - calling: "bishop" | "first_counselor" | "second_counselor"
             | "executive_secretary" | "assistant_executive_secretary"
             | "ward_clerk" | "assistant_clerk"
    - role: "bishopric" | "clerk"
    - active, ccOnEmails
    - fcmTokens: [{ token, platform, updatedAt }]
    - notificationPrefs: { enabled, quietHours? }
  letterTemplates/{templateId}
    - name, subject, body
  meetings/{YYYY-MM-DD}
    - meetingType, cancellation, contentVersionHash
    - openingHymn, sacramentHymn, closingHymn
    - openingPrayer, benediction, pianist, chorister, sacramentBread
    - sacramentBlessers: [assignment, assignment]
    - specialNumber, wardBusiness, stakeBusiness, announcements
  meetings/{date}/speakers/{speakerId}
    - name, email, topic, status, role
  meetings/{date}/comments/{commentId}
    - authorUid, authorDisplayName, body, mentionedUids[], createdAt, editedAt, deletedAt
  meetings/{date}/history/{eventId}
    - actorUid, actorDisplayName, at, target, targetId, action, changes
```

Speakers / comments / history are subcollections (variable count; can be long). Everything else embedded.

## Meeting types

| Type | Speakers | Sac. hymn | Sac. blessers/bread | Opening/Closing hymn | Prayers | Notes |
|---|---|---|---|---|---|---|
| `regular` | ✓ (2+) | ✓ | ✓ | ✓ | ✓ | Default. |
| `fast` | — (testimonies) | ✓ | ✓ | ✓ | ✓ | First Sunday of month (auto). Lead-time N/A. |
| `stake` | — | — | — | — | — | **No sacrament meeting.** Placeholder only. |
| `general` | — | — | — | — | — | **No sacrament meeting.** |

**Auto-defaults on meeting creation**: `fast` if first Sunday of month, else `regular`. Placeholder docs auto-created for dates in `settings.nonMeetingSundays` (bishopric fills at start of year).

**Non-meeting Sundays** (`stake` / `general`): no planning fields exposed; schedule view shows greyed-out cards; finalization nudges skip; change notifications don't fire.

## Cancellation

A meeting can be cancelled at any time without losing its content.

Effects:
- Schedule view: strikethrough + reason.
- Print: refuses to render ("This meeting was cancelled").
- Change notification fires with "Meeting cancelled" wording.
- Nudges skip cancelled meetings.
- Uncancel = just clear the field. Content survives.

## Print readiness

There is no approval workflow. Printing is gated by `checkMeetingReadiness`
([src/features/meetings/utils/readiness.ts](../src/features/meetings/utils/readiness.ts)),
which returns `ready: true` when:

- All required assignments have a person (presiding, conducting, prayers, chorister, pianist, sacrament bread, two blessers).
- All assigned people are `confirmed`.
- Every required hymn is picked (opening, sacrament, closing — plus rest hymn or musical performer when configured).
- For `regular` meetings: at least 2 speakers, all `confirmed`.

Readiness is computed live; nothing is persisted. The print buttons in the
editor and the print-view pages both compute it the same way, so the gate
is consistent.

## Audit trail

Every write to a meeting / speakers / comments appends to `meetings/{date}/history/{eventId}`:

```
- actorUid, actorDisplayName, at
- target: "meeting" | "speaker" | "comment"
- targetId
- action: "create" | "update" | "delete"
- changes: [{ field, old, new }]    # sparse; updates only
```

**Written client-side** in the same batched write as the content change — atomic, no extra Cloud Function.

**Size control**: skip `updatedAt` changes; don't diff comment bodies (comment's `editedAt` covers it).

**UI**: "History" drawer, reverse-chronological, 20 events paginated.

**Retention**: none in v1. Add Firestore TTL (1 year) later if storage becomes an issue.

**Privacy**: comment deletions are soft (preserved with `deletedAt`); the audit history is append-only.
