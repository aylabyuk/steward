import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { speakerLetterTemplateSchema, type SpeakerInvitation, wardSchema } from "@/lib/types";
import { reportSaved, reportSaveError, reportSaving } from "@/stores/saveStatusStore";
import {
  DEFAULT_SPEAKER_LETTER_BODY,
  DEFAULT_SPEAKER_LETTER_FOOTER,
} from "./speakerLetterDefaults";
import { interpolate } from "./interpolate";

export interface SendSpeakerInvitationInput {
  wardId: string;
  meetingDate: string; // ISO YYYY-MM-DD
  speakerId: string;
  speakerName: string;
  speakerTopic?: string | undefined;
  inviterName: string;
}

/**
 * Snapshot the current ward template + speaker details into a new
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
    const [templateSnap, wardSnap] = await Promise.all([
      getDoc(doc(db, "wards", input.wardId, "templates", "speakerLetter")),
      getDoc(doc(db, "wards", input.wardId)),
    ]);
    const parsedTemplate = templateSnap.exists()
      ? speakerLetterTemplateSchema.safeParse(templateSnap.data())
      : null;
    const template = parsedTemplate?.success ? parsedTemplate.data : null;
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

    const bodyMarkdown = interpolate(template?.bodyMarkdown ?? DEFAULT_SPEAKER_LETTER_BODY, vars);
    const footerMarkdown = interpolate(
      template?.footerMarkdown ?? DEFAULT_SPEAKER_LETTER_FOOTER,
      vars,
    );

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

function formatAssignedDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatToday(): string {
  return new Date().toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
