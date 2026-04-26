import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { wardSchema } from "@/lib/types";
import { reportSaved, reportSaveError, reportSaving } from "@/stores/saveStatusStore";
import {
  callSendSpeakerInvitation,
  type FreshInvitationResponse,
} from "@/features/invitations/invitationsCallable";
import { resolveChipsInState } from "@/features/page-editor/serializeForInterpolation";
import { interpolate } from "./interpolate";
import { formatAssignedDate, formatToday } from "./letterDates";

export interface SendSpeakerInvitationInput {
  wardId: string;
  meetingDate: string; // ISO YYYY-MM-DD
  speakerId: string;
  speakerName: string;
  speakerTopic?: string | undefined;
  speakerEmail: string;
  speakerPhone: string;
  inviterName: string;
  /** Bishop's personal email — used as Reply-To so a speaker replying
   *  to the SendGrid email lands in the bishop's inbox naturally. */
  bishopReplyToEmail: string;
  /** Letter body Markdown (may still contain `{{tokens}}` like
   *  `{{today}}` that we resolve here at send time). */
  bodyMarkdown: string;
  footerMarkdown: string;
  /** Lexical EditorState JSON the bishop authored. Pre-interpolation
   *  — token-replacement happens here so the snapshot stores a
   *  ready-to-render JSON string. Optional: callers without a
   *  WYSIWYG-authored template (legacy markdown only) omit it. */
  editorStateJson?: string | undefined;
  /** Which channels to deliver on. Driven by the bishop's button
   *  choice (Send / Send SMS) in the Prepare Invitation UI. */
  channels: ("email" | "sms")[];
}

/**
 * Calls the `sendSpeakerInvitation` Cloud Function, which:
 *  1. Creates the Twilio Conversation,
 *  2. Writes the `speakerInvitations/{autoId}` snapshot doc,
 *  3. Delivers via Resend (email) and/or Twilio Conversations (SMS),
 *  4. Returns the token + conversationSid + per-channel deliveryRecord.
 *
 * We still do client-side template interpolation here so the bishop's
 * local "today" string / assigned-date string match what the preview
 * renders — the server just trusts what we pass in.
 */
export async function sendSpeakerInvitation(
  input: SendSpeakerInvitationInput,
): Promise<FreshInvitationResponse> {
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
    // Two-pass resolution on the editor state JSON before it lands on
    // the snapshot:
    //   1. interpolate() handles {{token}} STRINGS embedded in custom
    //      node props (e.g. Letterhead.eyebrow = "Sacrament Meeting ·
    //      {{wardName}}"), and any text nodes that still carry literal
    //      {{token}} text from the markdown-hydration path.
    //   2. resolveChipsInState() walks the parsed tree and replaces
    //      every VariableChipNode with a plain text node carrying the
    //      resolved value — chips don't store {{...}} braces in their
    //      JSON shape so interpolate() alone misses them.
    // Net effect: the snapshot stores a fully-baked editor state. The
    // speaker page just renders text.
    const editorStateJson = input.editorStateJson
      ? resolveChipsInState(interpolate(input.editorStateJson, vars), vars)
      : undefined;
    const expiresAtMillis = computeExpiresAt(input.meetingDate);

    const res = await callSendSpeakerInvitation({
      wardId: input.wardId,
      speakerId: input.speakerId,
      meetingDate: input.meetingDate,
      channels: input.channels,
      speakerName: input.speakerName,
      ...(input.speakerTopic ? { speakerTopic: input.speakerTopic } : {}),
      inviterName: input.inviterName,
      wardName,
      assignedDate: vars.date,
      sentOn: vars.today,
      bodyMarkdown,
      footerMarkdown,
      ...(editorStateJson ? { editorStateJson } : {}),
      ...(input.speakerEmail.trim() ? { speakerEmail: input.speakerEmail.trim() } : {}),
      ...(input.speakerPhone.trim() ? { speakerPhone: input.speakerPhone.trim() } : {}),
      bishopReplyToEmail: input.bishopReplyToEmail,
      expiresAtMillis,
    });
    reportSaved();
    return res;
  } catch (e) {
    reportSaveError(e);
    throw e;
  }
}

/** Monday 00:00 local to the sender after the meeting's Sunday. */
function computeExpiresAt(meetingDate: string): number {
  const [y, m, d] = meetingDate.split("-").map(Number);
  if (!y || !m || !d) return Date.now();
  const local = new Date(y, m - 1, d);
  local.setDate(local.getDate() + 1);
  local.setHours(0, 0, 0, 0);
  return local.getTime();
}
