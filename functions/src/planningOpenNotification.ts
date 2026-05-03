import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { localDayOfWeek, upcomingSundayIso } from "./dates.js";
import { sendDisplayPush } from "./fcm.js";
import { localHour } from "./quietHours.js";
import { filterRecipients, type RecipientCandidate } from "./recipients.js";
import type { FcmToken, MemberDoc, WardDoc } from "./types.js";

// Mon 08:00 ward-local. Replaces the old Wed/Fri/Sat finalization
// nudges — one friendly weekly prompt at the start of the planning
// window instead of escalating reminders during it.
const PLANNING_OPEN_HOUR = 8;
const MONDAY = 1;

interface WardWithIndex extends WardDoc {
  /** Idempotency key — ISO of the upcoming Sunday for which the
   *  notification has already been sent. Bumps once per Monday
   *  rollover; until then the cron skips this ward. */
  lastPlanningOpenNotified?: string;
}

/**
 * Pure decision function — true when the cron should fire for the
 * given (now, ward.timezone, lastNotified, upcoming) tuple. Extracted
 * for unit-testability so we can verify the fire-once-per-Monday
 * window without spinning up the cron + Firestore.
 */
export function shouldFirePlanningOpen(
  now: Date,
  timezone: string,
  lastNotified: string | undefined,
  upcoming: string,
): boolean {
  if (localDayOfWeek(now, timezone) !== MONDAY) return false;
  if (localHour(now, timezone) !== PLANNING_OPEN_HOUR) return false;
  if (lastNotified === upcoming) return false;
  return true;
}

export const planningOpenNotification = onSchedule("every 60 minutes", async () => {
  const db = getFirestore();
  const now = new Date();
  const wardsSnap = await db.collection("wards").get();
  await Promise.all(
    wardsSnap.docs.map(async (wardSnap) => {
      try {
        await processWard(db, wardSnap.id, wardSnap.data() as WardWithIndex, now);
      } catch (err) {
        logger.error("planning-open notification failed", {
          wardId: wardSnap.id,
          err: (err as Error).message,
        });
      }
    }),
  );
});

async function processWard(
  db: FirebaseFirestore.Firestore,
  wardId: string,
  ward: WardWithIndex,
  now: Date,
): Promise<void> {
  const timezone = ward.settings?.timezone ?? "UTC";
  const upcoming = upcomingSundayIso(now, timezone);
  if (!shouldFirePlanningOpen(now, timezone, ward.lastPlanningOpenNotified, upcoming)) return;

  const membersSnap = await db.collection(`wards/${wardId}/members`).get();
  const candidates: RecipientCandidate[] = [];
  for (const d of membersSnap.docs) {
    const member = d.data() as MemberDoc;
    if (!member.active) continue;
    candidates.push({ uid: d.id, member });
  }

  const recipients = filterRecipients(candidates, { now, timezone });
  if (recipients.length === 0) {
    // Even when there are no recipients (no tokens, all in quiet hours),
    // bump the index so we don't retry every hour for the rest of the
    // day. The next firing happens next Monday.
    await markNotified(db, wardId, upcoming);
    return;
  }

  const tokensByUid = new Map<string, readonly FcmToken[]>();
  for (const r of recipients) tokensByUid.set(r.uid, r.member.fcmTokens ?? []);

  const outcome = await sendDisplayPush(wardId, tokensByUid, {
    title: `Planning is OPEN for Sunday ${upcoming}`,
    body: "Start planning the upcoming sacrament meeting.",
    data: { wardId, date: upcoming, kind: "planning-open" },
  });

  await markNotified(db, wardId, upcoming);
  logger.info("planning-open notification dispatched", {
    wardId,
    date: upcoming,
    recipients: recipients.length,
    ...outcome,
  });
}

async function markNotified(
  db: FirebaseFirestore.Firestore,
  wardId: string,
  upcoming: string,
): Promise<void> {
  await db.doc(`wards/${wardId}`).set(
    {
      lastPlanningOpenNotified: upcoming,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}
