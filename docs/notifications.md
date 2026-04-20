# Notifications

Three distinct push flows, all via Firebase Cloud Messaging (FCM) Web Push. Three Cloud Functions drive them — that's the entire backend code.

## Subscribe flow (first-run, one-time)

1. Prompt after sign-in: *"Subscribe to program updates"*.
2. `Notification.requestPermission()` → get FCM token → save to `wards/{wardId}/members/{uid}/fcmTokens`.
3. Multiple devices supported (phone + desktop). Array of tokens.
4. Settings screen: toggle off, add/remove devices.

**Service worker**: `firebase-messaging-sw.js` for background pushes; `onMessage` for foreground. The FCM SW and the PWA SW coexist — document the registration-order pitfall when implementing.

**iOS caveat**: Web Push on iOS only works for **installed PWAs** (Safari 16.4+). Surface "Add to Home Screen" nudge on iOS *before* the permission prompt.

**Cost**: FCM free. Cloud Functions free tier (2M invocations/month) easily covers us. Blaze plan required for Cloud Functions — flag during bootstrap.

## 1. Change notifications

**Function**: `onMeetingWrite` — `onWrite` on `meetings/{date}` + speakers subcollection.

**Flow**:
1. Diff before/after. Skip if only `updatedAt` changed.
2. Build payload: title `"Sacrament program updated — {date}"`, body summarizes the change ("Speaker added", "Hymn changed").
3. **Debounce**: coalesce writes within 60s into one notification. Write a pending-notification doc with a scheduled send time; subsequent writes within the window update that doc. A scheduled function performs the send.
4. Fetch ward's active-member tokens → send via FCM → prune dead tokens from errors.
5. **Exclude the writer** — don't notify someone about their own edit.

**Skipped**:
- Comments (handled by `onCommentCreate`).
- Non-meeting Sundays (`stake_conference` / `general_conference`).

**Cancelled meetings**: fires with special `"Meeting cancelled"` wording.

## 2. Finalization nudges

**Function**: `scheduledNudges` — hourly cron (`functions.pubsub.schedule(...)`).

**Default schedule** (per-ward configurable):

| When (local) | Trigger if | Severity | Target |
|---|---|---|---|
| Wed 7pm | Upcoming Sunday missing OR `draft` / `pending_approval` | Soft | Whole team |
| Fri 7pm | Still not `approved` | Urgent | Pending approvers only |
| Sat 9am *(off by default)* | Still not `approved` | Critical | Whole team |

**Why Wed + Fri** (vs. Tue/Fri): Tue is too soon after last Sunday — feels nagging. Wed gives breathing room while keeping 4-day lead time. Fri evening still leaves Saturday to act.

**Targeted > broadcast**:
- `draft` → whole team (someone needs to request approval).
- `pending_approval` → only bishopric members who haven't yet approved.
- Meeting doc missing → whole team with different message (*"No program created yet for Sunday"*).

**Skip**: cancelled meetings, non-meeting Sundays.

**Idempotent**: `lastNudgedAt` on meeting doc prevents double-send on retry.

**Settings** (under `ward.settings`):
```
nudgeSchedule: {
  wednesday: { enabled: true,  hour: 19 },
  friday:    { enabled: true,  hour: 19 },
  saturday:  { enabled: false, hour: 9  }
}
```

## 3. Mention notifications

**Function**: `onCommentCreate` — `onCreate` on `meetings/{date}/comments/{id}`.

**Flow**:
1. Read `mentionedUids` from the new comment.
2. Send FCM to each mentioned user's tokens: *"{author} mentioned you on Sunday {date}"*.
3. Prune dead tokens.

Plain comments (no mentions) do NOT notify. All-activity opt-in (`notificationPrefs.commentsAllActivity`) is v1.1.
