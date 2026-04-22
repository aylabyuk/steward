import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type SpeakerInvitation, wardSchema } from "@/lib/types";
import { reportSaved, reportSaveError, reportSaving } from "@/stores/saveStatusStore";
import { interpolate } from "./interpolate";
import { formatAssignedDate, formatToday } from "./letterDates";

export interface SendSpeakerInvitationInput {
  wardId: string;
  meetingDate: string; // ISO YYYY-MM-DD
  speakerId: string;
  speakerName: string;
  speakerTopic?: string | undefined;
  inviterName: string;
  /** Letter body Markdown (may still contain `{{tokens}}` like
   *  `{{today}}` that we resolve here at send time). Caller resolves
   *  override > ward template > default before passing in. */
  bodyMarkdown: string;
  /** Letter footer Markdown (may still contain `{{tokens}}`). */
  footerMarkdown: string;
}

/**
 * Snapshot the letter into a new
 * `wards/{wardId}/speakerInvitations/{autoId}` doc and return the
 * token (= doc ID). The caller uses the token to build the public
 * landing URL.
 *
 * The returned invitation is self-contained: the recipient never
 * reads the template or speaker doc, so we don't need cross-doc
 * public reads.
 */
export async function sendSpeakerInvitation(
  input: SendSpeakerInvitationInput,
): Promise<{ token: string }> {
  reportSaving();
  try {
    const wardSnap = await getDoc(doc(db, "wards", input.wardId));
    const wardName = wardSnap.exists() ? wardSchema.parse(wardSnap.data()).name : "";

    const vars = {
      speakerName: input.speakerName,
      topic:
        input.speakerTopic && input.speakerTopic.trim().length > 0
          ? input.speakerTopic
          : "a topic of your choosing",
      date: formatAssignedDate(input.meetingDate),
      today: formatToday(),
      wardName,
      inviterName: input.inviterName,
    };

    const bodyMarkdown = interpolate(input.bodyMarkdown, vars);
    const footerMarkdown = interpolate(input.footerMarkdown, vars);

    const payload: Omit<SpeakerInvitation, "createdAt"> = {
      speakerRef: { meetingDate: input.meetingDate, speakerId: input.speakerId },
      assignedDate: vars.date,
      sentOn: vars.today,
      wardName,
      speakerName: input.speakerName,
      speakerTopic: input.speakerTopic,
      inviterName: input.inviterName,
      bodyMarkdown,
      footerMarkdown,
    };

    const ref = await addDoc(collection(db, "wards", input.wardId, "speakerInvitations"), {
      ...payload,
      createdAt: serverTimestamp(),
    });
    reportSaved();
    return { token: ref.id };
  } catch (e) {
    reportSaveError(e);
    throw e;
  }
}
