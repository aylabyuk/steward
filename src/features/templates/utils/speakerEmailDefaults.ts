/**
 * Seed copy for the speaker invitation **email body** (the mailto: body
 * the bishop's mail client sends — NOT the rich letter on the landing
 * page). The default names purpose, sender, and Sunday upfront so the
 * message doesn't read as a phishing link. Wards can edit this at
 * `/settings/templates/speaker-email`.
 *
 * Variables: {{speakerName}}, {{date}}, {{wardName}}, {{inviterName}},
 * {{topic}}, {{inviteUrl}}.
 */

export const DEFAULT_SPEAKER_EMAIL_BODY = `Dear {{speakerName}},

We have prayerfully considered the needs of our ward and feel inspired to invite you to speak in sacrament meeting on {{date}}. Suggested topic: {{topic}}.

The full invitation letter is at the link below. Please use the chat on that page to reply directly to the bishopric — it keeps everything in one thread and is the most reliable way for us to follow up.

{{inviteUrl}}

With gratitude,
{{inviterName}}
{{wardName}} bishopric`;
