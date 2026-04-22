import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { sendAndPrune } from "./fcm.js";
import { buildEmailHtml, buildEmailText } from "./invitationEmailBody.js";
import { filterRecipients, type RecipientCandidate } from "./recipients.js";
import { STEWARD_ORIGIN } from "./secrets.js";
import { sendEmail } from "./sendgrid/client.js";
import { sendSmsDirect } from "./twilio/messaging.js";
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

/** Bishop posted → one-off SMS to the speaker via Twilio Messaging
 *  REST. We used to rely on the conversation's SMS participant
 *  binding to auto-deliver; after switching the speaker to a chat
 *  participant, that path is gone, so the webhook fires this
 *  directly. Silently no-op if the invitation has no phone on file. */
export async function smsSpeaker(inv: ResolvedInvitation, body: string): Promise<void> {
  if (!inv.speakerPhone) return;
  const preview = truncate(body, 300);
  const text = `${inv.inviterName} (Steward): ${preview}`;
  try {
    await sendSmsDirect({ to: inv.speakerPhone, body: text });
  } catch (err) {
    logger.error("reply SMS failed", { err: (err as Error).message, token: inv.token });
  }
}

/** Bishop posted → SendGrid email to the speaker with a preview.
 *  No-ops if the invitation has no email on file or if SendGrid
 *  isn't configured — the surrounding try/catch keeps the webhook
 *  alive so the SMS fan-out still fires. */
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
