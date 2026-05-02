import { doc, runTransaction, serverTimestamp, writeBatch } from "firebase/firestore";
import { db, inviteDb } from "@/lib/firebase";

export interface SpeakerResponseInput {
  wardId: string;
  invitationId: string;
  answer: "yes" | "no";
  reason?: string;
  actorUid: string;
  /** Verified Google email, if the speaker happens to also have a
   *  Google session on the same device. Optional — capability-token
   *  speakers rely on their custom-claim identity, not email. */
  actorEmail?: string;
}

/** Speaker-side: writes the response. Post C1 doc-split, the full
 *  response object lives on the private auth subdoc; only a tiny
 *  `responseSummary` (answer + respondedAt) lands on the public
 *  parent so the pre-auth landing page can switch UI without
 *  reading the private subdoc. Both writes go in a single batch so
 *  the parent and subdoc never disagree about whether a response
 *  exists. Routes through `inviteDb` so the write carries the
 *  isolated `inviteAuth` session's ID token (with invitationId
 *  claim). */
export async function writeSpeakerResponse(input: SpeakerResponseInput): Promise<void> {
  const parentRef = doc(inviteDb, "wards", input.wardId, "speakerInvitations", input.invitationId);
  const authRef = doc(parentRef, "private", "auth");
  const respondedAt = serverTimestamp();
  const batch = writeBatch(inviteDb);
  batch.update(authRef, {
    response: {
      answer: input.answer,
      ...(input.reason ? { reason: input.reason } : {}),
      respondedAt,
      actorUid: input.actorUid,
      ...(input.actorEmail ? { actorEmail: input.actorEmail } : {}),
    },
  });
  batch.update(parentRef, {
    responseSummary: { answer: input.answer, respondedAt },
  });
  await batch.commit();
}

export interface ApplyResponseInput {
  wardId: string;
  invitationId: string;
  bishopUid: string;
}

/** Bishop-side: applies the participant's response to their status
 *  doc (confirmed for yes, declined for no) and stamps the
 *  invitation's acknowledgement. Wrapped in a Firestore transaction
 *  so the response read and the participant + auth-subdoc writes are
 *  atomic — concurrent applies (two bishopric tabs / racing devices)
 *  can't both pass the "no answer" check and double-write, and a
 *  speaker response landing mid-apply can't leave participant.status
 *  out of sync with auth.response. Routes through the main `db`
 *  (bishopric Google session).
 *
 *  Kind-aware: the invitation doc carries `kind: "speaker" | "prayer"`
 *  (PR #169). Speakers update their doc at `meetings/{date}/speakers/
 *  {speakerId}`; prayers update `meetings/{date}/prayers/{role}` —
 *  for prayer invitations the doc's `speakerRef.speakerId` field
 *  holds the role string. */
export async function applyResponseToSpeaker(input: ApplyResponseInput): Promise<void> {
  const invitationRef = doc(db, "wards", input.wardId, "speakerInvitations", input.invitationId);
  const authRef = doc(invitationRef, "private", "auth");
  await runTransaction(db, async (tx) => {
    const [parentSnap, authSnap] = await Promise.all([tx.get(invitationRef), tx.get(authRef)]);
    if (!parentSnap.exists()) throw new Error("Invitation not found.");
    const parentData = parentSnap.data() as {
      speakerRef: { meetingDate: string; speakerId: string };
      kind?: "speaker" | "prayer";
      responseSummary?: { answer: "yes" | "no" };
    };
    const authData = (authSnap.exists() ? authSnap.data() : null) as {
      response?: { answer: "yes" | "no"; acknowledgedAt?: unknown };
    } | null;
    // Read response from auth subdoc; fall back to the public summary
    // (and pre-migration `response` on parent) so apply still works
    // mid-migration.
    const answer = authData?.response?.answer ?? parentData.responseSummary?.answer;
    if (!answer) throw new Error("No response to apply.");
    if (authData?.response?.acknowledgedAt) {
      // Already applied by another bishopric session — short-circuit.
      // Without this, a racing apply would re-stamp acknowledgedAt and
      // re-overwrite participant.status with possibly-stale data.
      return;
    }

    const newStatus: "confirmed" | "declined" = answer === "yes" ? "confirmed" : "declined";
    const isPrayer = parentData.kind === "prayer";
    const subcollection = isPrayer ? "prayers" : "speakers";
    const participantRef = doc(
      db,
      "wards",
      input.wardId,
      "meetings",
      parentData.speakerRef.meetingDate,
      subcollection,
      parentData.speakerRef.speakerId,
    );

    // Acknowledgement audit lives on the auth subdoc with the rest of
    // the response object; only the answer + respondedAt mirror to the
    // public parent.
    tx.update(authRef, {
      "response.acknowledgedAt": serverTimestamp(),
      "response.acknowledgedBy": input.bishopUid,
    });
    tx.update(participantRef, {
      status: newStatus,
      statusSource: "speaker-response",
      statusSetBy: input.bishopUid,
      statusSetAt: serverTimestamp(),
    });

    // Prayer kind also mirrors `confirmed` onto the inline meeting
    // assignment row so the printed program template (which reads
    // `meeting.openingPrayer` / `meeting.benediction`, not the
    // participant doc) stays in sync. Speakers don't carry an inline
    // `confirmed` mirror — their schedule pill reads the speaker doc
    // directly.
    if (isPrayer) {
      const role = parentData.speakerRef.speakerId;
      const meetingField = role === "opening" ? "openingPrayer" : "benediction";
      const meetingRef = doc(
        db,
        "wards",
        input.wardId,
        "meetings",
        parentData.speakerRef.meetingDate,
      );
      tx.set(
        meetingRef,
        { [meetingField]: { confirmed: newStatus === "confirmed" } },
        { merge: true },
      );
    }
  });
}
