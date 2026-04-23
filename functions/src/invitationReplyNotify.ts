import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { sendDisplayPush } from "./fcm.js";
import { rotateTokenForBishopNotification } from "./issueSpeakerSession.helpers.js";
import { interpolate, readMessageTemplate } from "./messageTemplates.js";
import { filterRecipients, type RecipientCandidate } from "./recipients.js";
import { STEWARD_ORIGIN } from "./secrets.js";
import { buildInviteUrl } from "./sendSpeakerInvitation.helpers.js";
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
 *  pruning helpers that the mention notifications already use.
 *
 *  The payload carries `webpush.fcmOptions.link` so a tap deep-links
 *  to the speaker's chat dialog on the Schedule page; the SW
 *  `notificationclick` handler reads the same shape for browsers that
 *  don't honor `fcmOptions.link` natively. */
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
  await sendDisplayPush(inv.wardId, tokensByUid, {
    title: `${inv.speakerName} replied`,
    body: truncate(body, 120),
    data: { wardId: inv.wardId, invitationId: inv.token, kind: "invitation-reply" },
  });
}

/** Max age of the speaker's `speakerLastSeenAt` heartbeat before we
 *  treat the chat as "closed". The invite page pings every 60s while
 *  the tab is visible; 2× that cadence gives one missed ping of slack
 *  before we fall back to SMS. */
const HEARTBEAT_FRESH_MS = 120_000;

/** Bishop posted → SMS the speaker with a fresh resume link (unless
 *  the speaker's heartbeat shows they're actively viewing the chat).
 *  Rotates the invitation's capability token (bishop-initiated, so it
 *  does NOT count against `tokenRotationsByDay`) and appends the fresh
 *  URL — the speaker can tap it to re-enter the chat with prior
 *  messages preserved (same conversationSid). No-op when the invitation
 *  has no phone on file. */
export async function smsSpeaker(inv: ResolvedInvitation, body: string): Promise<void> {
  if (!inv.speakerPhone) return;
  if (isSpeakerOnline(inv)) return;
  let inviteUrl: string | null = null;
  try {
    const rotated = await rotateTokenForBishopNotification(inv.wardId, inv.token);
    if (rotated) {
      const origin = process.env.STEWARD_ORIGIN ?? STEWARD_ORIGIN.value();
      inviteUrl = buildInviteUrl(origin, inv.wardId, inv.token, rotated.newToken);
    }
  } catch (err) {
    logger.warn("reply SMS token rotation failed — falling back to preview-only", {
      token: inv.token,
      err: (err as Error).message,
    });
  }
  const preview = truncate(body, 240);
  // Rotation-failed path stays hardcoded: it's an error fallback, not
  // a user-authored message — we don't want a bishopric-edited template
  // to leak a placeholder `{{inviteUrl}}` token into an SMS.
  let text: string;
  if (inviteUrl) {
    const template = await readMessageTemplate(getFirestore(), inv.wardId, "bishopReplySms");
    text = interpolate(template, { wardName: inv.wardName, preview, inviteUrl });
  } else {
    text = `${inv.inviterName} (Steward): ${preview}`;
  }
  try {
    await sendSmsDirect({ to: inv.speakerPhone, body: text });
  } catch (err) {
    logger.error("reply SMS failed", { err: (err as Error).message, token: inv.token });
  }
}

function isSpeakerOnline(inv: ResolvedInvitation): boolean {
  const ts = inv.speakerLastSeenAt;
  if (!ts) return false;
  return Date.now() - ts.toMillis() < HEARTBEAT_FRESH_MS;
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
  const template = await readMessageTemplate(getFirestore(), inv.wardId, "bishopReplyEmail");
  const text = interpolate(template, {
    inviterName: inv.inviterName,
    assignedDate: inv.assignedDate,
    preview,
    wardName: inv.wardName,
  });
  const html = textToParagraphHtml(text);
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

/** Render an author-editable plain-text email body into HTML: split
 *  on blank lines for paragraphs, `<br>` for single newlines, escape
 *  everything. Bishoprics author in text; we don't ask them to reason
 *  about HTML. */
function textToParagraphHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .filter((p) => p.trim().length > 0)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c;
  });
}
