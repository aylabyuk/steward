import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { sendAndPrune } from "./fcm.js";
import { buildEmailHtml, buildEmailText } from "./invitationEmailBody.js";
import { filterRecipients, type RecipientCandidate } from "./recipients.js";
import { STEWARD_ORIGIN } from "./secrets.js";
import { sendEmail } from "./sendgrid/client.js";
import type { FcmToken, MemberDoc, WardDoc } from "./types.js";
import type { SpeakerInvitationShape } from "./invitationTypes.js";

export interface ResolvedInvitation extends SpeakerInvitationShape {
  wardId: string;
  token: string;
}

/** Speaker posted in the conversation → FCM push to active
 *  bishopric members of the ward. Reuses the quiet-hours + token
 *  pruning helpers that the mention notifications already use. */
export async function pushToBishopric(inv: ResolvedInvitation, body: string): Promise<void> {
  const db = getFirestore();
  const wardSnap = await db.doc(`wards/${inv.wardId}`).get();
  const ward = wardSnap.data() as WardDoc | undefined;
  const timezone = ward?.settings?.timezone ?? "UTC";
  const membersSnap = await db.collection(`wards/${inv.wardId}/members`).get();
  const candidates: RecipientCandidate[] = membersSnap.docs
    .map((d) => {
      const m = d.data() as MemberDoc;
      return m.role === "bishopric" ? { uid: d.id, member: m } : null;
    })
    .filter((c): c is RecipientCandidate => c !== null);
  const recipients = filterRecipients(candidates, { now: new Date(), timezone });
  if (recipients.length === 0) return;
  const tokensByUid = new Map<string, readonly FcmToken[]>();
  for (const r of recipients) tokensByUid.set(r.uid, r.member.fcmTokens ?? []);
  await sendAndPrune(inv.wardId, tokensByUid, {
    notification: { title: `${inv.speakerName} replied`, body: truncate(body, 120) },
    data: { wardId: inv.wardId, token: inv.token, kind: "invitation-reply" },
  });
}

/** Bishop posted → SendGrid email to the speaker with a preview.
 *  Twilio already handles SMS delivery via the participant's SMS
 *  binding (if they have one); this gives them the second
 *  notification channel. */
export async function emailSpeaker(inv: ResolvedInvitation, body: string): Promise<void> {
  if (!inv.speakerEmail) return;
  const origin = process.env.STEWARD_ORIGIN ?? STEWARD_ORIGIN.value();
  const inviteUrl = `${origin}/invite/speaker/${inv.wardId}/${inv.token}`;
  const args = {
    speakerName: inv.speakerName,
    inviterName: inv.inviterName,
    assignedDate: inv.assignedDate,
    wardName: inv.wardName,
    inviteUrl,
  };
  const preview = truncate(body, 180);
  try {
    await sendEmail({
      to: inv.speakerEmail,
      fromDisplayName: `${inv.inviterName} (via Steward)`,
      subject: `New message from ${inv.inviterName} · ${inv.wardName}`,
      text: `${preview}\n\n---\n\n${buildEmailText(args)}`,
      html: `<p><em>${escapeHtml(preview)}</em></p><hr/>${buildEmailHtml(args)}`,
    });
  } catch (err) {
    logger.error("reply email failed", { err: (err as Error).message, token: inv.token });
  }
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c;
  });
}
