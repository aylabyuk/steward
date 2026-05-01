import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type PrayerRole, wardSchema } from "@/lib/types";
import { reportSaved, reportSaveError, reportSaving } from "@/stores/saveStatusStore";
import { useDevModeStore } from "@/stores/devModeStore";
import {
  callSendSpeakerInvitation,
  type FreshInvitationResponse,
} from "@/features/invitations/utils/invitationsCallable";
import { resolveChipsInState } from "@/features/page-editor/utils/serializeForInterpolation";
import { interpolate } from "@/features/templates/utils/interpolate";
import { formatAssignedDate, formatToday } from "@/features/templates/utils/letterDates";

export interface SendPrayerInvitationInput {
  wardId: string;
  meetingDate: string;
  role: PrayerRole;
  prayerGiverName: string;
  prayerGiverEmail: string;
  prayerGiverPhone: string;
  inviterName: string;
  bishopReplyToEmail: string;
  bodyMarkdown: string;
  footerMarkdown: string;
  editorStateJson?: string | undefined;
  channels: ("email" | "sms")[];
}

/** Client wrapper that calls the unified `sendSpeakerInvitation`
 *  Cloud Function with `kind: "prayer"`. The function name still
 *  reads "speaker" — see the follow-up rename issue — but it routes
 *  prayer-keyed copy + persists `prayerRole` on the invitation. */
export async function sendPrayerInvitation(
  input: SendPrayerInvitationInput,
): Promise<FreshInvitationResponse> {
  reportSaving();
  try {
    const wardSnap = await getDoc(doc(db, "wards", input.wardId));
    const wardName = wardSnap.exists() ? wardSchema.parse(wardSnap.data()).name : "";

    const vars = {
      speakerName: input.prayerGiverName,
      prayerGiverName: input.prayerGiverName,
      prayerType: input.role === "opening" ? "opening prayer" : "closing prayer",
      date: formatAssignedDate(input.meetingDate),
      today: formatToday(),
      wardName,
      inviterName: input.inviterName,
    };

    const bodyMarkdown = interpolate(input.bodyMarkdown, vars);
    const footerMarkdown = interpolate(input.footerMarkdown, vars);
    const editorStateJson = input.editorStateJson
      ? resolveChipsInState(interpolate(input.editorStateJson, vars), vars)
      : undefined;
    const expiresAtMillis = computeExpiresAt(input.meetingDate);

    const useTestingNumber = useDevModeStore.getState().useTestingNumber;
    const res = await callSendSpeakerInvitation({
      wardId: input.wardId,
      // For prayer invitations the participant identifier is the role.
      // The CF persists this in `speakerRef.speakerId` so existing
      // helpers (cleanupPriorConversations, etc.) keep working.
      speakerId: input.role,
      meetingDate: input.meetingDate,
      channels: input.channels,
      kind: "prayer",
      prayerRole: input.role,
      speakerName: input.prayerGiverName,
      inviterName: input.inviterName,
      wardName,
      assignedDate: vars.date,
      sentOn: vars.today,
      bodyMarkdown,
      footerMarkdown,
      ...(editorStateJson ? { editorStateJson } : {}),
      ...(input.prayerGiverEmail.trim() ? { speakerEmail: input.prayerGiverEmail.trim() } : {}),
      ...(input.prayerGiverPhone.trim() ? { speakerPhone: input.prayerGiverPhone.trim() } : {}),
      bishopReplyToEmail: input.bishopReplyToEmail,
      expiresAtMillis,
      ...(useTestingNumber ? { useTestingNumber: true } : {}),
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
