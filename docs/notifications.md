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
- Non-meeting Sundays (`stake` / `general`).

**Cancelled meetings**: fires with special `"Meeting cancelled"` wording.

## 2. Planning-open notification

**Function**: `planningOpenNotification` — hourly cron
(`functions.pubsub.schedule("every 60 minutes")`).

Replaces the old escalating Wed/Fri/Sat finalization nudges. The new
flow is a single, friendly Monday-morning push that announces the
planning window for the upcoming Sunday is open. It pairs with the
PR-2 schedule restriction: the sacrament meeting program form is only
editable for the upcoming Sunday, and this push is the prompt to
start.

**Schedule**: fires at **08:00 in the ward's local timezone every Monday**. The cron polls hourly so it can hit the right wall-clock hour for any tz.

**Payload**:

| Field | Value |
|---|---|
| title | `Planning is OPEN for Sunday {YYYY-MM-DD}` |
| body  | `Start planning the upcoming sacrament meeting.` |
| data  | `{ wardId, date, kind: "planning-open" }` |
| route | `/week/{date}` (via `firebase-messaging-sw.js → routeForPushData`) |

**Targets**: every active member (bishopric + clerk). `filterRecipients` is
applied so per-user `notificationPrefs.enabled` and `quietHours` still
gate delivery, and dead FCM tokens are pruned by `sendAndPrune`.

**Idempotency**: `wards/{wardId}.lastPlanningOpenNotified` stores the
ISO date of the upcoming Sunday whenever the push goes out. Subsequent
hourly ticks during the same Monday-morning window skip the ward
because the value already matches the current upcoming Sunday. The
key naturally goes stale next Monday when the upcoming Sunday rolls
over, and the push fires again.

**No per-ward configuration.** The hour is hardcoded to 08:00 local —
single time across all wards keeps the operational surface tiny and
matches the "one prompt, then back off" intent. Per-user opt-out via
the existing `notificationPrefs.enabled` toggle covers individual
preferences.

**No skip on cancelled meetings or non-meeting Sundays.** The push
announces that the planning window is open, not that there's a
meeting to fill — even a cancelled or stake-conference Sunday earns a
ping so the bishop knows the slot is now editable. (The schedule UI
itself surfaces non-meeting Sundays as such; the push is just a
calendar prompt.)

**Decommissioning the old `scheduledNudges` cron**: when this code
deploys, the new `planningOpenNotification` cron is registered
automatically. The old `scheduledNudges` Cloud Scheduler job won't
deregister itself just because the function export went away —
manually run `firebase functions:delete scheduledNudges` after a
successful deploy to free the slot. Verify with
`firebase functions:list`.

## 3. Mention notifications

**Function**: `onCommentCreate` — `onCreate` on `meetings/{date}/comments/{id}`.

**Flow**:
1. Read `mentionedUids` from the new comment.
2. Send FCM to each mentioned user's tokens: *"{author} mentioned you on Sunday {date}"*.
3. Prune dead tokens.

Plain comments (no mentions) do NOT notify. All-activity opt-in (`notificationPrefs.commentsAllActivity`) is v1.1.
