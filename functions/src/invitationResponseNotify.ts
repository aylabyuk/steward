import { logger } from "firebase-functions/v2";
import { sendAndPrune } from "./fcm.js";
import { filterRecipients, type RecipientCandidate } from "./recipients.js";
import type { SpeakerInvitationShape } from "./invitationTypes.js";
import type { FcmToken, MemberDoc, WardDoc } from "./types.js";

export interface ResponseNotification {
  title: string;
  body: string;
}

/** Builds the FCM push payload for a speaker's yes/no response. Pure
 *  — no Firestore, no I/O — so it can be unit-tested. Caller passes
 *  the relevant slices of the before/after invitation shape. */
export function composeResponseNotification(input: {
  speakerName: string;
  meetingDate: string;
  prevAnswer: "yes" | "no" | undefined;
  nextAnswer: "yes" | "no";
  reason?: string;
}): ResponseNotification {
  const shortDate = formatShortDate(input.meetingDate);
  const flipped = input.prevAnswer !== undefined && input.prevAnswer !== input.nextAnswer;
  if (flipped) {
    const verb = input.nextAnswer === "yes" ? "Yes" : "No";
    return {
      title: `${input.speakerName} changed response to ${verb}`,
      body: shortDate,
    };
  }
  if (input.nextAnswer === "yes") {
    return {
      title: `${input.speakerName} accepted`,
      body: shortDate,
    };
  }
  const reason = input.reason?.trim();
  if (reason) {
    return {
      title: `${input.speakerName} declined`,
      body: `"${reason}" — ${shortDate}`,
    };
  }
  return {
    title: `${input.speakerName} declined`,
    body: shortDate,
  };
}

/** "2026-05-10" → "Sun, May 10". Parses at UTC midnight + formats in
 *  UTC so timezones can't skew the weekday. Falls back to the raw
 *  string on bad input — not a critical path. */
function formatShortDate(meetingDate: string): string {
  const date = new Date(`${meetingDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return meetingDate;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Push-notify every active bishopric member when a speaker submits
 *  or flips their yes/no on the invite page. Speakers themselves
 *  aren't targeted (they're the actor) and clerks are excluded —
 *  only bishopric gets paged on response activity.
 *
 *  The FCM payload carries `webpush.fcmOptions.link` so a tap routes
 *  straight to the matching speaker's chat dialog (the SW's
 *  `notificationclick` handler reads the same shape for browsers that
 *  don't honor `fcmOptions.link` natively). */
export async function notifyBishopricOfResponse(
  db: FirebaseFirestore.Firestore,
  wardId: string,
  invitationId: string,
  before: SpeakerInvitationShape | undefined,
  after: SpeakerInvitationShape,
  origin: string,
): Promise<void> {
  const nextAnswer = after.response?.answer;
  if (!nextAnswer) return;

  const wardSnap = await db.doc(`wards/${wardId}`).get();
  const ward = wardSnap.data() as WardDoc | undefined;
  const timezone = ward?.settings?.timezone ?? "UTC";

  const membersSnap = await db.collection(`wards/${wardId}/members`).get();
  const candidates: RecipientCandidate[] = membersSnap.docs
    .map((d) => {
      const m = d.data() as MemberDoc;
      return m.role === "bishopric" ? { uid: d.id, member: m } : null;
    })
    .filter((c): c is RecipientCandidate => c !== null);
  const recipients = filterRecipients(candidates, { now: new Date(), timezone });
  if (recipients.length === 0) return;

  const payload = composeResponseNotification({
    speakerName: after.speakerName,
    meetingDate: after.speakerRef.meetingDate,
    prevAnswer: before?.response?.answer,
    nextAnswer,
    ...(after.response?.reason ? { reason: after.response.reason } : {}),
  });
  const link = `${origin.replace(/\/+$/, "")}/schedule?chat=${encodeURIComponent(invitationId)}`;

  const tokensByUid = new Map<string, readonly FcmToken[]>();
  for (const r of recipients) tokensByUid.set(r.uid, r.member.fcmTokens ?? []);
  try {
    await sendAndPrune(wardId, tokensByUid, {
      notification: payload,
      data: {
        wardId,
        invitationId,
        meetingDate: after.speakerRef.meetingDate,
        kind: "invitation-response",
      },
      webpush: { fcmOptions: { link } },
    });
  } catch (err) {
    logger.error("response push fan-out failed", {
      wardId,
      invitationId,
      err: (err as Error).message,
    });
  }
}
