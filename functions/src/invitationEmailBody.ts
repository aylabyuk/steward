export interface BuildEmailArgs {
  speakerName: string;
  inviterName: string;
  assignedDate: string;
  wardName: string;
  inviteUrl: string;
}

export function buildEmailText(a: BuildEmailArgs): string {
  return [
    `Dear ${a.speakerName},`,
    "",
    `${a.inviterName} has invited you to speak on ${a.assignedDate}.`,
    "",
    `Read the full invitation here:`,
    a.inviteUrl,
    "",
    `— ${a.wardName}`,
  ].join("\n");
}

export function buildEmailHtml(a: BuildEmailArgs): string {
  return `<p>Dear ${escapeHtml(a.speakerName)},</p>
<p>${escapeHtml(a.inviterName)} has invited you to speak on <strong>${escapeHtml(a.assignedDate)}</strong>.</p>
<p><a href="${a.inviteUrl}">Read the full invitation</a>.</p>
<p style="color:#666;font-size:12px;">— ${escapeHtml(a.wardName)}</p>`;
}

export function buildSmsBody(a: BuildEmailArgs): string {
  return (
    `${a.inviterName} (${a.wardName}) has invited you to speak on ${a.assignedDate}. ` +
    `Read the full invitation: ${a.inviteUrl}. ` +
    `Reply STOP to unsubscribe.`
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
