import {
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface SpeakerResponseInput {
  wardId: string;
  token: string;
  answer: "yes" | "no";
  reason?: string;
  actorUid: string;
  /** One of these identifies the verified signer. Phone-authed
   *  speakers pass `actorPhone`; legacy email/Google-authed callers
   *  pass `actorEmail`. Both optional at the type level so callers
   *  can choose; the Firestore rule enforces at least phone-match. */
  actorEmail?: string;
  actorPhone?: string;
}

/** Speaker-side: writes the `response` subtree on the invitation
 *  doc. Passes through the phone-matched Firestore rule (see
 *  firestore.rules). */
export async function writeSpeakerResponse(input: SpeakerResponseInput): Promise<void> {
  const ref = doc(db, "wards", input.wardId, "speakerInvitations", input.token);
  await updateDoc(ref, {
    response: {
      answer: input.answer,
      ...(input.reason ? { reason: input.reason } : {}),
      respondedAt: serverTimestamp(),
      actorUid: input.actorUid,
      ...(input.actorEmail ? { actorEmail: input.actorEmail } : {}),
      ...(input.actorPhone ? { actorPhone: input.actorPhone } : {}),
    },
  });
}

export interface ApplyResponseInput {
  wardId: string;
  token: string;
  bishopUid: string;
}

/** Bishop-side: applies the speaker's response to `speaker.status`
 *  (confirmed for yes, declined for no) and stamps the invitation's
 *  acknowledgement. Batched so either both writes land or neither. */
export async function applyResponseToSpeaker(input: ApplyResponseInput): Promise<void> {
  const invitationRef = doc(
    db,
    "wards",
    input.wardId,
    "speakerInvitations",
    input.token,
  );
  const snap = await getDoc(invitationRef);
  if (!snap.exists()) throw new Error("Invitation not found.");
  const data = snap.data() as {
    response?: { answer: "yes" | "no" };
    speakerRef: { meetingDate: string; speakerId: string };
  };
  const answer = data.response?.answer;
  if (!answer) throw new Error("No response to apply.");

  const newStatus: "confirmed" | "declined" = answer === "yes" ? "confirmed" : "declined";
  const speakerRef = doc(
    db,
    "wards",
    input.wardId,
    "meetings",
    data.speakerRef.meetingDate,
    "speakers",
    data.speakerRef.speakerId,
  );

  const batch = writeBatch(db);
  batch.update(invitationRef, {
    "response.acknowledgedAt": serverTimestamp(),
    "response.acknowledgedBy": input.bishopUid,
  });
  batch.update(speakerRef, { status: newStatus });
  await batch.commit();
}
