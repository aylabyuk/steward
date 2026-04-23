import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { sendAndPrune } from "./fcm.js";
import { filterRecipients, type RecipientCandidate } from "./recipients.js";
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
 *  alive so the SMS fan-out still fires.
 *
 *  We intentionally omit an invite URL here: the speaker's original
 *  SMS carries the capability token and opens the chat directly.
 *  Linking back from the reply email would either 404 (no token) or
 *  spend a daily rotation (consumed token → fresh SMS), so we point
 *  them at their SMS instead. */
export async function emailSpeaker(inv: ResolvedInvitation, body: string): Promise<void> {
  if (!inv.speakerEmail) return;
  const preview = truncate(body, 180);
  const text = [
    `${inv.inviterName} replied to your invitation for ${inv.assignedDate}:`,
    "",
    preview,
    "",
    "To reply back, open the invitation link in the text message we sent you.",
    "",
    `— ${inv.wardName}`,
  ].join("\n");
  const html = `<p>${escapeHtml(inv.inviterName)} replied to your invitation for <strong>${escapeHtml(
    inv.assignedDate,
  )}</strong>:</p>
<blockquote style="margin:0 0 12px 0;padding-left:10px;border-left:3px solid #bca788;color:#4a3a30;"><em>${escapeHtml(preview)}</em></blockquote>
<p style="color:#666;font-size:13px;">To reply back, open the invitation link in the text message we sent you.</p>
<p style="color:#666;font-size:12px;">— ${escapeHtml(inv.wardName)}</p>`;
  try {
    await sendEmail({
      to: inv.speakerEmail,
      fromDisplayName: `${inv.inviterName} (via Steward)`,
      subject: `New message from ${inv.inviterName} · ${inv.wardName}`,
      text,
      html,
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
