import { logger } from "firebase-functions/v2";
import { interpolate, readMessageTemplate } from "./messageTemplates.js";
import { sendEmail } from "./sendgrid/client.js";
import { getFirestore } from "firebase-admin/firestore";
import type { SpeakerInvitationShape } from "./invitationTypes.js";

export interface ResolvedInvitation extends SpeakerInvitationShape {
  wardId: string;
  token: string;
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
