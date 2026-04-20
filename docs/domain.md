# Domain model

Core entity: **SacramentMeeting** per Sunday date.

## SacramentMeeting

- `date` — ISO `YYYY-MM-DD`
- `meetingType` — `regular` | `fast` | `stake` | `general`
- `status` — `draft` | `pending_approval` | `approved` | `published` (v1.1)
- `cancellation` — `{ cancelled, reason, cancelledAt, cancelledBy }`
- `approvals[]` — log of approval events
- `contentVersionHash` — cheap hash of current content; approvals compare against it to detect staleness
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
    - meetingType, status, cancellation, approvals[], contentVersionHash
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

Orthogonal to approval — an `approved` meeting can still be cancelled without losing approval history.

Effects:
- Schedule view: strikethrough + reason.
- Print: refuses to render ("This meeting was cancelled").
- Change notification fires with "Meeting cancelled" wording.
- Nudges skip cancelled meetings.
- Uncancel = just clear the field. Approval + content survive.

## Program lifecycle & approval

Printing is gated on **≥2 distinct bishopric-member approvals**.

| State | Meaning |
|---|---|
| `draft` | Default on creation. Freely editable. Cannot print. |
| `pending_approval` | Review requested. Approvers can click Approve. |
| `approved` | ≥2 distinct approvals. Printing unlocked. |
| `published` (v1.1) | Informational "distributed" label. |

**Transitions**:
- `draft` → `pending_approval`: any bishopric member clicks "Request approval".
- `pending_approval` → `approved`: automatic on 2nd distinct approval.
- Any state → `draft` on edit (confirm dialog): prior approvals marked `invalidated: true`, preserved in the log. Honors "everything is always editable".

**Approval rules**:
- Must be `role: bishopric` + `active: true`.
- One approval per UID.
- Author may approve own work (small-bishopric reality: bishop + 2 counselors often means author is 1 of 2).
- Captures `{ uid, email, displayName, approvedAt, approvedVersionHash, invalidated, invalidatedAt }`.

Firestore rules: only `bishopric` can approve; no duplicate non-invalidated approvals per UID.

## Audit trail

Every write to a meeting / speakers / comments / approvals appends to `meetings/{date}/history/{eventId}`:

```
- actorUid, actorDisplayName, at
- target: "meeting" | "speaker" | "comment" | "approval"
- targetId
- action: "create" | "update" | "delete"
- changes: [{ field, old, new }]    # sparse; updates only
```

**Written client-side** in the same batched write as the content change — atomic, no extra Cloud Function.

**Size control**: skip `updatedAt` changes; don't diff comment bodies (comment's `editedAt` covers it).

**UI**: "History" drawer, reverse-chronological, 20 events paginated.

**Retention**: none in v1. Add Firestore TTL (1 year) later if storage becomes an issue.

**Privacy**: approval events + comment deletions never removed. Members cannot erase their approval history.
