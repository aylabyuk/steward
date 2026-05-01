import { interpolate } from "./messageTemplates.js";

/**
 * Defaults for the speaker / prayer invitation email body. Kept in
 * sync with `src/features/templates/utils/{speakerEmail,prayerEmail}Defaults.ts`
 * so a fresh ward (no Firestore template doc yet) sees identical copy
 * client-side and server-side. A test asserts the values match — see
 * `functions/src/emailTemplateBody.test.ts` (added with this change).
 *
 * Variables available for interpolation: `{{speakerName}}`,
 * `{{date}}`, `{{wardName}}`, `{{inviterName}}`, `{{inviteUrl}}`, plus
 * `{{topic}}` (speaker-only) or `{{prayerType}}` (prayer-only).
 */

export const DEFAULT_SPEAKER_EMAIL_BODY = `Dear {{speakerName}},

We have prayerfully considered the needs of our ward and feel inspired to invite you to speak in sacrament meeting on {{date}}. Suggested topic: {{topic}}.

The full invitation letter is at the link below. Please use the chat on that page to reply directly to the bishopric — it keeps everything in one thread and is the most reliable way for us to follow up.

{{inviteUrl}}

With gratitude,
{{inviterName}}
{{wardName}} bishopric`;

export const DEFAULT_PRAYER_EMAIL_BODY = `Dear {{speakerName}},

We have prayerfully considered the needs of our ward and feel inspired to invite you to give the {{prayerType}} in sacrament meeting on {{date}}.

The full invitation letter is at the link below. Please use the chat on that page to reply directly to the bishopric — it keeps everything in one thread and is the most reliable way for us to follow up.

{{inviteUrl}}

With gratitude,
{{inviterName}}
{{wardName}} bishopric`;

export type EmailKind = "speaker" | "prayer";

export interface EmailTemplateVars {
  speakerName: string;
  date: string;
  wardName: string;
  inviterName: string;
  inviteUrl: string;
  topic?: string;
  prayerType?: string;
}

/**
 * Reads the bishopric-authored invitation email body from
 * `wards/{wardId}/templates/{speakerEmail|prayerEmail}`. Falls back to
 * the matching default (above) when the doc is missing or malformed.
 * Never throws.
 */
export async function readEmailTemplate(
  db: FirebaseFirestore.Firestore,
  wardId: string,
  kind: EmailKind,
): Promise<string> {
  const docName = kind === "prayer" ? "prayerEmail" : "speakerEmail";
  const fallback = kind === "prayer" ? DEFAULT_PRAYER_EMAIL_BODY : DEFAULT_SPEAKER_EMAIL_BODY;
  try {
    const snap = await db.doc(`wards/${wardId}/templates/${docName}`).get();
    if (!snap.exists) return fallback;
    const body = snap.get("bodyMarkdown");
    return typeof body === "string" && body.length > 0 ? body : fallback;
  } catch {
    return fallback;
  }
}

/** Plain-text email body. The bishopric authors free-form text in the
 *  template editor; we just interpolate variables and ship it. */
export function buildEmailTextFromTemplate(body: string, vars: EmailTemplateVars): string {
  return interpolate(body, vars as unknown as Record<string, string>);
}

/** HTML email body. Variables are HTML-escaped before interpolation so
 *  a `{{wardName}}` containing literal markup can't inject HTML; the
 *  body itself is then escaped + wrapped paragraph-by-paragraph in `<p>`. */
export function buildEmailHtmlFromTemplate(body: string, vars: EmailTemplateVars): string {
  const escapedVars: Record<string, string> = {};
  for (const [k, v] of Object.entries(vars)) {
    if (typeof v === "string") escapedVars[k] = escapeHtml(v);
  }
  const interpolated = interpolate(escapeHtml(body), escapedVars);
  return interpolated
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, "<br />")}</p>`)
    .join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
