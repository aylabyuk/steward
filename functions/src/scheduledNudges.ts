import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { sendDisplayPush } from "./fcm.js";
import type { MeetingDocLite } from "./meetingChange.js";
import { currentSlot, type NudgeSchedule, slotKey, upcomingSundayIso } from "./nudgeSlot.js";
import { computeNudgeTarget, type NudgeMember, type NudgeTarget } from "./nudgeTarget.js";
import { filterRecipients, type RecipientCandidate } from "./recipients.js";
import type { FcmToken, MemberDoc, WardDoc } from "./types.js";

interface MeetingForNudge extends MeetingDocLite {
  approvals?: { uid: string; invalidated?: boolean }[];
  lastNudgedSlots?: Record<string, Timestamp>;
}

interface WardWithSettings extends WardDoc {
  settings: WardDoc["settings"] & { nudgeSchedule?: NudgeSchedule };
  lastNudgedSlots?: Record<string, Timestamp>;
}

const DEFAULT_SCHEDULE: NudgeSchedule = {
  wednesday: { enabled: true, hour: 19 },
  friday: { enabled: true, hour: 19 },
  saturday: { enabled: false, hour: 9 },
};

export const scheduledNudges = onSchedule("every 60 minutes", async () => {
  const db = getFirestore();
  const now = new Date();
  const wardsSnap = await db.collection("wards").get();
  await Promise.all(
    wardsSnap.docs.map(async (wardSnap) => {
      try {
        await processWard(db, wardSnap.id, wardSnap.data() as WardWithSettings, now);
      } catch (err) {
        logger.error("ward nudge failed", { wardId: wardSnap.id, err: (err as Error).message });
      }
    }),
  );
});

async function processWard(
  db: FirebaseFirestore.Firestore,
  wardId: string,
  ward: WardWithSettings,
  now: Date,
): Promise<void> {
  const timezone = ward.settings.timezone ?? "UTC";
  const schedule = ward.settings.nudgeSchedule ?? DEFAULT_SCHEDULE;
  const slot = currentSlot(now, schedule, timezone);
  if (!slot) return;
  const date = upcomingSundayIso(now, timezone);
  const key = slotKey(date, slot);

  const meetingRef = db.doc(`wards/${wardId}/meetings/${date}`);
  const meetingSnap = await meetingRef.get();
  const meeting = meetingSnap.exists ? (meetingSnap.data() as MeetingForNudge) : null;

  if (alreadyNudged(meeting, ward, key)) return;

  const membersSnap = await db.collection(`wards/${wardId}/members`).get();
  const members: NudgeMember[] = membersSnap.docs.map((d) => {
    const m = d.data() as MemberDoc;
    return { uid: d.id, role: m.role, active: m.active };
  });
  const approvedUids = new Set(
    (meeting?.approvals ?? []).filter((a) => !a.invalidated).map((a) => a.uid),
  );

  const target = computeNudgeTarget({
    day: slot.day,
    date,
    meeting,
    approvedUids,
    members,
  });
  if (!target) return;

  await deliverNudge(db, wardId, target, membersSnap, timezone);
  await markNudged(db, wardId, date, key, meetingSnap.exists);
}

function alreadyNudged(
  meeting: MeetingForNudge | null,
  ward: WardWithSettings,
  key: string,
): boolean {
  if (meeting?.lastNudgedSlots && key in meeting.lastNudgedSlots) return true;
  if (!meeting && ward.lastNudgedSlots && key in ward.lastNudgedSlots) return true;
  return false;
}

async function deliverNudge(
  _db: FirebaseFirestore.Firestore,
  wardId: string,
  target: NudgeTarget,
  membersSnap: FirebaseFirestore.QuerySnapshot,
  timezone: string,
): Promise<void> {
  const memberByUid = new Map<string, MemberDoc>();
  for (const d of membersSnap.docs) memberByUid.set(d.id, d.data() as MemberDoc);
  const candidates: RecipientCandidate[] = target.uids
    .map((uid) => {
      const member = memberByUid.get(uid);
      return member ? { uid, member } : null;
    })
    .filter((c): c is RecipientCandidate => c !== null);

  const recipients = filterRecipients(candidates, { now: new Date(), timezone });
  if (recipients.length === 0) return;
  const tokensByUid = new Map<string, readonly FcmToken[]>();
  for (const r of recipients) tokensByUid.set(r.uid, r.member.fcmTokens ?? []);
  const outcome = await sendDisplayPush(wardId, tokensByUid, {
    title: target.title,
    body: target.body,
    data: { wardId, kind: "nudge", severity: target.severity },
  });
  logger.info("nudge dispatched", {
    wardId,
    severity: target.severity,
    title: target.title,
    recipients: recipients.length,
    ...outcome,
  });
}

async function markNudged(
  db: FirebaseFirestore.Firestore,
  wardId: string,
  date: string,
  key: string,
  meetingExists: boolean,
): Promise<void> {
  const stamp = Timestamp.now();
  const ref = meetingExists
    ? db.doc(`wards/${wardId}/meetings/${date}`)
    : db.doc(`wards/${wardId}`);
  await ref.set(
    { lastNudgedSlots: { [key]: stamp }, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
}
