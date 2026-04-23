import { interpolate } from "./messageTemplates.js";
import type { SpeakerInvitationShape } from "./invitationTypes.js";

export interface ReceiptBuildArgs {
  invitation: SpeakerInvitationShape;
  bishopricViewUrl?: string;
  acknowledgedByName?: string | undefined;
  respondedAt?: Date | undefined;
  /** Body of the matching server-side message template —
   *  `speakerResponseAccepted` / `speakerResponseDeclined` for
   *  `buildSpeakerReceipt`, `bishopricResponseReceipt` for
   *  `buildBishopricReceipt`. Caller loads the template via
   *  `readMessageTemplate` so builders stay pure. */
  headerTemplate: string;
  /** Freshly-rotated invite URL for `buildSpeakerReceipt`. Optional —
   *  rotation can fail, in which case the receipt falls back to the
   *  no-link shape (the speaker still has the original SMS/email). */
  inviteUrl?: string;
}

export interface ReceiptContent {
  subject: string;
  text: string;
  html: string;
}

function letterHtml(invitation: SpeakerInvitationShape): string {
  return [
    `<p style="color:#4a3a30;">${escapeHtml(invitation.sentOn)}</p>`,
    `<p>Dear ${escapeHtml(invitation.speakerName)},</p>`,
    // Invitation bodies are authored as Markdown. We render as
    // paragraphs preserving newlines — full Markdown-to-HTML is not
    // worth pulling into Functions for the receipt path; the raw body
    // reads cleanly enough.
    ...invitation.bodyMarkdown
      .split(/\n{2,}/)
      .filter((p) => p.trim().length > 0)
      .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`),
    `<p style="color:#4a3a30;font-size:13px;">${escapeHtml(invitation.footerMarkdown)}</p>`,
    `<p style="color:#666;font-size:12px;">— ${escapeHtml(invitation.wardName)}</p>`,
  ].join("\n");
}

function letterText(invitation: SpeakerInvitationShape): string {
  return [
    invitation.sentOn,
    "",
    `Dear ${invitation.speakerName},`,
    "",
    invitation.bodyMarkdown,
    "",
    invitation.footerMarkdown,
    "",
    `— ${invitation.wardName}`,
  ].join("\n");
}

/** Email sent to the speaker when their Yes/No lands on the invitation
 *  doc (or flips). Confirms what was recorded and carries a freshly
 *  rotated invite link so the speaker can reopen the chat even if
 *  they've deleted the original SMS. `inviteUrl` is optional — if
 *  rotation failed upstream, the receipt falls back to the no-link
 *  shape (the original SMS is still a valid entry point). */
export function buildSpeakerReceipt(args: ReceiptBuildArgs): ReceiptContent {
  const { invitation, headerTemplate, inviteUrl } = args;
  const answer = invitation.response?.answer;
  if (!answer) throw new Error("speaker receipt requires a recorded response");
  const verb = answer === "yes" ? "accepted" : "declined";

  const subject = `You ${verb} the speaking invitation — ${invitation.assignedDate}`;
  const headerText = interpolate(headerTemplate, {
    speakerName: invitation.speakerName,
    assignedDate: invitation.assignedDate,
    reason: invitation.response?.reason ?? "",
  });
  const text = [
    headerText,
    "",
    invitation.response?.reason ? `Your note: ${invitation.response.reason}` : null,
    invitation.response?.reason ? "" : null,
    inviteUrl ? `Open your invitation page: ${inviteUrl}` : null,
    inviteUrl ? "" : null,
    "For reference, the original letter you received:",
    "",
    letterText(invitation),
    "",
    "If this wasn't you, please contact the bishopric right away.",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
  const html = `
<p>${escapeHtml(headerText)}</p>
${
  invitation.response?.reason
    ? `<blockquote style="margin:0 0 16px 0;padding-left:10px;border-left:3px solid #bca788;color:#4a3a30;"><em>${escapeHtml(invitation.response.reason)}</em></blockquote>`
    : ""
}
${inviteUrl ? `<p><a href="${inviteUrl}">Open your invitation page</a></p>` : ""}
<hr style="border:none;border-top:1px solid #ddd;margin:18px 0;">
<p style="color:#666;font-size:12px;margin:0 0 6px 0;">For reference, the original letter you received:</p>
${letterHtml(invitation)}
<hr style="border:none;border-top:1px solid #ddd;margin:18px 0;">
<p style="color:#a00;font-size:12px;">If this wasn't you, please contact the bishopric right away.</p>
`.trim();

  return { subject, text, html };
}

/** Email sent to every active bishopric/clerk when the Apply action
 *  mirrors a response to `speaker.status`. Includes the letter inline
 *  for archival + a link to the read-only invitation view. */
export function buildBishopricReceipt(args: ReceiptBuildArgs): ReceiptContent {
  const { invitation, bishopricViewUrl, acknowledgedByName, respondedAt, headerTemplate } = args;
  const answer = invitation.response?.answer;
  if (!answer) throw new Error("bishopric receipt requires a recorded response");
  const verb = answer === "yes" ? "accepted" : "declined";

  const subject = `${invitation.speakerName} ${verb} the speaking invitation — ${invitation.assignedDate}`;
  const responseLine = interpolate(headerTemplate, {
    speakerName: invitation.speakerName,
    verb,
    assignedDate: invitation.assignedDate,
  });
  const metaLines: string[] = [];
  if (respondedAt) metaLines.push(`Responded: ${respondedAt.toLocaleString()}`);
  if (acknowledgedByName) metaLines.push(`Applied by: ${acknowledgedByName}`);
  if (invitation.response?.reason)
    metaLines.push(`Note from speaker: ${invitation.response.reason}`);

  const text = [
    responseLine,
    "",
    ...metaLines,
    metaLines.length > 0 ? "" : null,
    "Original letter sent:",
    "",
    letterText(invitation),
    "",
    bishopricViewUrl ? `View this invitation in Steward: ${bishopricViewUrl}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  const html = `
<p><strong>${escapeHtml(responseLine)}</strong></p>
${metaLines.length > 0 ? `<p style="color:#4a3a30;font-size:13px;margin:0 0 12px 0;">${metaLines.map(escapeHtml).join("<br>")}</p>` : ""}
<hr style="border:none;border-top:1px solid #ddd;margin:18px 0;">
<p style="color:#666;font-size:12px;margin:0 0 6px 0;">Original letter sent:</p>
${letterHtml(invitation)}
${
  bishopricViewUrl
    ? `<hr style="border:none;border-top:1px solid #ddd;margin:18px 0;">
<p><a href="${bishopricViewUrl}">View this invitation in Steward</a></p>`
    : ""
}
`.trim();

  return { subject, text, html };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c;
  });
}
