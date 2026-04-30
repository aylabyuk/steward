import { getFirestore, FieldValue } from "firebase-admin/firestore";

interface StampInput {
  db: ReturnType<typeof getFirestore>;
  wardId: string;
  meetingDate: string;
  speakerId: string;
  speakerName: string;
  isPrayer: boolean;
  prayerRole?: "opening" | "benediction" | undefined;
  invitationId: string;
  conversationSid: string;
  bishopUid: string;
}

/** Server-side write of `status: "invited"` onto the participant doc
 *  (speaker or prayer) so iOS, web, and any future client see the
 *  same state right after a fresh send. For prayers, also mirrors
 *  the name onto the inline `meeting.{role}.person` so the printed
 *  program template (which reads from the meeting doc, not the
 *  participant) stays in sync.
 *
 *  This is the source-of-truth alignment between iOS and web —
 *  without it the participant.status only got updated by whichever
 *  client did a follow-up `upsertPrayerParticipant` / `updateSpeaker`
 *  call after the send, and clients that skipped that step left
 *  status stale at "planned" while the invitation existed.
 *
 *  Idempotent: clients still call `updateSpeaker` /
 *  `upsertPrayerParticipant` after a successful send. Same write,
 *  same values — second one is a no-op. */
export async function stampParticipantInvited(input: StampInput): Promise<void> {
  const {
    db,
    wardId,
    meetingDate,
    speakerId,
    speakerName,
    isPrayer,
    prayerRole,
    invitationId,
    conversationSid,
    bishopUid,
  } = input;
  const now = FieldValue.serverTimestamp();
  const meetingRef = db.doc(`wards/${wardId}/meetings/${meetingDate}`);

  if (isPrayer) {
    if (!prayerRole) return;
    const participantRef = db.doc(
      `wards/${wardId}/meetings/${meetingDate}/prayers/${prayerRole}`,
    );
    const meetingField = prayerRole === "opening" ? "openingPrayer" : "benediction";
    const batch = db.batch();
    batch.set(
      participantRef,
      {
        name: speakerName,
        role: prayerRole,
        status: "invited",
        statusSource: "manual",
        statusSetBy: bishopUid,
        statusSetAt: now,
        invitationId,
        conversationSid,
        updatedAt: now,
      },
      { merge: true },
    );
    batch.set(
      meetingRef,
      { [meetingField]: { person: { name: speakerName } } },
      { merge: true },
    );
    await batch.commit();
    return;
  }

  // Speaker kind — the speaker doc must already exist (created by
  // `createSpeaker` before the bishop reaches Send). Use update so we
  // don't accidentally backfill a speaker doc that was deleted mid-flight.
  const speakerRef = db.doc(`wards/${wardId}/meetings/${meetingDate}/speakers/${speakerId}`);
  await speakerRef.update({
    status: "invited",
    statusSource: "manual",
    statusSetBy: bishopUid,
    statusSetAt: now,
    invitationId,
    conversationSid,
    updatedAt: now,
  });
}
