import type { Conversation } from "@twilio/conversations";
import { doc, updateDoc } from "firebase/firestore";
import { formatShortSunday } from "@/features/schedule/dateFormat";
import { db } from "@/lib/firebase";
import type { SpeakerStatus } from "@/lib/types";

/** Wording for the neutral status-change messages. Kept free of
 *  "the bishopric" framing so the line reads as a calm record update
 *  rather than a rebuke — the message is rendered as a centered
 *  system notice in the thread, not attributed to any participant.
 *  The meeting date is substituted in place of the ambiguous "this
 *  Sunday" so the line is unambiguous for a speaker scrolling back
 *  through an older thread. */
function bodyFor(status: "confirmed" | "declined", meetingDateIso: string): string {
  const when = formatShortSunday(meetingDateIso);
  if (status === "confirmed") return `Assignment confirmed — thank you for speaking on ${when}.`;
  return `Assignment updated to declined. Thank you for letting us know.`;
}

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
  /** ISO `YYYY-MM-DD` of the meeting the speaker is assigned to —
   *  substituted into the system-notice body so the message reads
   *  "speaking on Sun May 20" instead of the ambiguous "this
   *  Sunday". */
  meetingDate: string;
  status: SpeakerStatus;
  conversation: Conversation | null;
}): Promise<void> {
  const { wardId, invitationId, meetingDate, status, conversation } = args;
  await updateDoc(doc(db, "wards", wardId, "speakerInvitations", invitationId), {
    currentSpeakerStatus: status,
  }).catch((err) => {
    // Non-fatal — the speaker page falls back to the response-based
    // banner when the field is missing. Log and keep going so the
    // chat message still posts.
    console.warn("[steward] currentSpeakerStatus mirror failed", err);
  });
  if (status !== "confirmed" && status !== "declined") return;
  if (!conversation) return;
  const body = bodyFor(status, meetingDate);
  const attributes: StatusChangeAttributes = { kind: "status-change", status };
  try {
    await conversation.sendMessage(body, attributes);
  } catch (err) {
    console.warn("[steward] status-change chat message failed", err);
  }
}
