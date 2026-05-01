/**
 * Seed copy for the prayer-giver invitation email body — sent by the
 * Cloud Function when a bishopric member invites someone to give the
 * opening or closing prayer. Mirrors `DEFAULT_SPEAKER_EMAIL_BODY` but
 * phrases the assignment with `{{prayerType}}` so the same template
 * works for both prayer roles. Wards can edit at
 * `/settings/templates?audience=prayer`.
 *
 * Variables: {{speakerName}}, {{date}}, {{wardName}}, {{inviterName}},
 * {{prayerType}}, {{inviteUrl}}.
 */

export const DEFAULT_PRAYER_EMAIL_BODY = `Dear {{speakerName}},

We have prayerfully considered the needs of our ward and feel inspired to invite you to give the {{prayerType}} in sacrament meeting on {{date}}. The full invitation letter is at the link below. Please let a member of the bishopric know if this Sunday works for you, or if you would prefer a different date.

{{inviteUrl}}

With gratitude,
{{inviterName}}
{{wardName}} bishopric`;
