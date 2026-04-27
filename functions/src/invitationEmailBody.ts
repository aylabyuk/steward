export interface BuildEmailArgs {
  speakerName: string;
  inviterName: string;
  assignedDate: string;
  wardName: string;
  inviteUrl: string;
  /** Set for prayer invitations — e.g. "opening prayer" or
   *  "benediction". When present the body wording switches from
   *  "speak on …" to "give the {prayerType} on …". */
  prayerType?: string;
}

function inviteAction(a: BuildEmailArgs): string {
  return a.prayerType
    ? `give the ${a.prayerType} on ${a.assignedDate}`
    : `speak on ${a.assignedDate}`;
}

function inviteActionHtml(a: BuildEmailArgs): string {
  const date = `<strong>${escapeHtml(a.assignedDate)}</strong>`;
  return a.prayerType ? `give the ${escapeHtml(a.prayerType)} on ${date}` : `speak on ${date}`;
}

export function buildEmailText(a: BuildEmailArgs): string {
  return [
    `Dear ${a.speakerName},`,
    "",
    `${a.inviterName} has invited you to ${inviteAction(a)}.`,
    "",
    `Read the full invitation here:`,
    a.inviteUrl,
    "",
    `— ${a.wardName}`,
  ].join("\n");
}

export function buildEmailHtml(a: BuildEmailArgs): string {
  return `<p>Dear ${escapeHtml(a.speakerName)},</p>
<p>${escapeHtml(a.inviterName)} has invited you to ${inviteActionHtml(a)}.</p>
<p><a href="${a.inviteUrl}">Read the full invitation</a>.</p>
<p style="color:#666;font-size:12px;">— ${escapeHtml(a.wardName)}</p>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
