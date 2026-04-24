import type { Conversation } from "@twilio/conversations";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { SpeakerStatus } from "@/lib/types";

/** Wording for the neutral status-change messages. Kept free of
 *  "the bishopric" framing so the line reads as a calm record update
 *  rather than a rebuke — the message is rendered as a centered
 *  system notice in the thread, not attributed to any participant. */
const BODY_BY_STATUS: Partial<Record<SpeakerStatus, string>> = {
  confirmed: "Assignment confirmed — thank you for speaking this Sunday.",
  declined: "Assignment updated to declined. Thank you for letting us know.",
};

/** Marker on the Twilio Message's attributes subtree. The thread
 *  renderer keys off this and drops the message out of the normal
 *  grouped-bubble flow, rendering it as a muted system line instead. */
export interface StatusChangeAttributes {
  kind: "status-change";
  status: Exclude<SpeakerStatus, "planned" | "invited">;
}

/** After an authoritative bishop-driven status transition
 *  (invited/planned → confirmed or declined), mirror the new value
 *  onto the invitation doc and — if the Twilio Conversation is
 *  already online for this session — post a plain-English status
 *  line into the thread. The speaker page's response banner reads
 *  `invitation.currentSpeakerStatus` to switch its wording (green
 *  "confirmed" / neutral "updated to declined") even if the speaker
 *  originally replied the opposite. */
export async function noteBishopStatusChange(args: {
  wardId: string;
  invitationId: string;
  status: SpeakerStatus;
  conversation: Conversation | null;
}): Promise<void> {
  const { wardId, invitationId, status, conversation } = args;
  await updateDoc(doc(db, "wards", wardId, "speakerInvitations", invitationId), {
    currentSpeakerStatus: status,
  }).catch((err) => {
    // Non-fatal — the speaker page falls back to the response-based
    // banner when the field is missing. Log and keep going so the
    // chat message still posts.
    console.warn("[steward] currentSpeakerStatus mirror failed", err);
  });
  const body = BODY_BY_STATUS[status];
  if (!body || !conversation) return;
  if (status !== "confirmed" && status !== "declined") return;
  const attributes: StatusChangeAttributes = { kind: "status-change", status };
  try {
    await conversation.sendMessage(body, attributes);
  } catch (err) {
    console.warn("[steward] status-change chat message failed", err);
  }
}
