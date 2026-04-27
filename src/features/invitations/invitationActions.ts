import { doc, getDoc, serverTimestamp, updateDoc, writeBatch } from "firebase/firestore";
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

/** Speaker-side: writes the `response` subtree on the invitation
 *  doc. Routes through `inviteDb` so the write carries the isolated
 *  `inviteAuth` session's ID token (with invitationId claim). */
export async function writeSpeakerResponse(input: SpeakerResponseInput): Promise<void> {
  const ref = doc(inviteDb, "wards", input.wardId, "speakerInvitations", input.invitationId);
  await updateDoc(ref, {
    response: {
      answer: input.answer,
      ...(input.reason ? { reason: input.reason } : {}),
      respondedAt: serverTimestamp(),
      actorUid: input.actorUid,
      ...(input.actorEmail ? { actorEmail: input.actorEmail } : {}),
    },
  });
}

export interface ApplyResponseInput {
  wardId: string;
  invitationId: string;
  bishopUid: string;
}

/** Bishop-side: applies the participant's response to their status
 *  doc (confirmed for yes, declined for no) and stamps the
 *  invitation's acknowledgement. Batched so either both writes land
 *  or neither. Routes through the main `db` (bishopric Google
 *  session).
 *
 *  Kind-aware: the invitation doc carries `kind: "speaker" | "prayer"`
 *  (PR #169). Speakers update their doc at `meetings/{date}/speakers/
 *  {speakerId}`; prayers update `meetings/{date}/prayers/{role}` —
 *  for prayer invitations the doc's `speakerRef.speakerId` field
 *  holds the role string. */
export async function applyResponseToSpeaker(input: ApplyResponseInput): Promise<void> {
  const invitationRef = doc(db, "wards", input.wardId, "speakerInvitations", input.invitationId);
  const snap = await getDoc(invitationRef);
  if (!snap.exists()) throw new Error("Invitation not found.");
  const data = snap.data() as {
    response?: { answer: "yes" | "no" };
    speakerRef: { meetingDate: string; speakerId: string };
    kind?: "speaker" | "prayer";
  };
  const answer = data.response?.answer;
  if (!answer) throw new Error("No response to apply.");

  const newStatus: "confirmed" | "declined" = answer === "yes" ? "confirmed" : "declined";
  const subcollection = data.kind === "prayer" ? "prayers" : "speakers";
  const participantRef = doc(
    db,
    "wards",
    input.wardId,
    "meetings",
    data.speakerRef.meetingDate,
    subcollection,
    data.speakerRef.speakerId,
  );

  const batch = writeBatch(db);
  batch.update(invitationRef, {
    "response.acknowledgedAt": serverTimestamp(),
    "response.acknowledgedBy": input.bishopUid,
  });
  batch.update(participantRef, {
    status: newStatus,
    statusSource: "speaker-response",
    statusSetBy: input.bishopUid,
    statusSetAt: serverTimestamp(),
  });
  await batch.commit();
}
