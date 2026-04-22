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

We have prayerfully considered the needs of our ward and feel inspired to invite you to speak in sacrament meeting on {{date}}. The full invitation letter — including our suggested topic and length — is at the link below. Please let a member of the bishopric know if this Sunday works for you, or if you would prefer a different date.

{{inviteUrl}}

With gratitude,
{{inviterName}}
{{wardName}} bishopric`;
