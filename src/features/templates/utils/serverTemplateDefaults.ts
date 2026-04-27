import type { MessageTemplateKey } from "@/lib/types";

/**
 * Defaults for the six server-side messaging templates. Strings here
 * match the current hardcoded copy in the Cloud Functions so wards
 * without a Firestore override see identical behavior.
 *
 * **Keep in sync with `functions/src/messageTemplateDefaults.ts`.**
 * The two files can't share a module (separate pnpm workspaces), so a
 * test asserts the values match — see `functions/src/messageTemplates.test.ts`.
 *
 * Variables use the `{{name}}` syntax that `interpolate()` understands.
 * See src/features/templates/interpolate.ts.
 */

/** Twilio SMS body sent when a bishop first invites a speaker. */
export const DEFAULT_INITIAL_INVITATION_SMS =
  "{{inviterName}} ({{wardName}}) has invited you to speak on {{assignedDate}}. " +
  "Read the full invitation: {{inviteUrl}}. Reply STOP to unsubscribe.";

/** Narrative header of the SendGrid email the speaker receives when
 *  they submit Yes on the invitation page. The letter excerpt and
 *  safety warning are structural and stay hardcoded around this
 *  string. */
export const DEFAULT_SPEAKER_RESPONSE_ACCEPTED =
  "You accepted the invitation to speak on {{assignedDate}}. Thank you.";

/** Same shape for the declined branch. */
export const DEFAULT_SPEAKER_RESPONSE_DECLINED =
  "You declined the invitation to speak on {{assignedDate}}. Thank you for letting us know.";

/** Opening line of the bishopric receipt when the Apply action mirrors
 *  a response to `speaker.status`. The meta lines (responded-at,
 *  applied-by, reason) and the inline letter rendering are structural. */
export const DEFAULT_BISHOPRIC_RESPONSE_RECEIPT =
  "{{speakerName}} {{verb}} the invitation to speak on {{assignedDate}}.";

/** Twilio SMS the speaker gets when the bishopric replies in chat and
 *  the speaker's web session isn't presumed online. The `{{inviteUrl}}`
 *  may be absent (rotation failure) — the Cloud Function's hardcoded
 *  fallback kicks in for that edge case. */
export const DEFAULT_BISHOP_REPLY_SMS =
  '{{wardName}}: new message from the bishopric about your speaking assignment — "{{preview}}". Open: {{inviteUrl}}';

/** SendGrid email sent alongside the reply SMS (or on its own when
 *  the speaker has email but no phone on file). Text body — the HTML
 *  variant is derived paragraph-by-paragraph server-side. */
export const DEFAULT_BISHOP_REPLY_EMAIL = [
  "{{inviterName}} replied to your invitation for {{assignedDate}}:",
  "",
  "{{preview}}",
  "",
  "To reply back, open the invitation link in the text message we sent you.",
  "",
  "— {{wardName}}",
].join("\n");

/** Twilio SMS body sent when a bishop first invites a prayer-giver.
 *  Mirrors the speaker-side wording with prayer phrasing in place of
 *  "speak". `{{prayerType}}` resolves to "opening prayer" or
 *  "benediction" per the prayer participant's role. */
export const DEFAULT_PRAYER_INITIAL_INVITATION_SMS =
  "{{inviterName}} ({{wardName}}) has invited you to give the {{prayerType}} on {{assignedDate}}. " +
  "Read the full invitation: {{inviteUrl}}. Reply STOP to unsubscribe.";

/** Speaker-side acceptance receipt for prayer invitations. */
export const DEFAULT_PRAYER_RESPONSE_ACCEPTED =
  "You accepted the invitation to give the {{prayerType}} on {{assignedDate}}. Thank you.";

/** Speaker-side decline receipt for prayer invitations. */
export const DEFAULT_PRAYER_RESPONSE_DECLINED =
  "You declined the invitation to give the {{prayerType}} on {{assignedDate}}. Thank you for letting us know.";

/** Bishopric-side receipt opening line for prayer invitations. */
export const DEFAULT_PRAYER_BISHOPRIC_RESPONSE_RECEIPT =
  "{{speakerName}} {{verb}} the invitation to give the {{prayerType}} on {{assignedDate}}.";

export const DEFAULT_MESSAGE_TEMPLATES: Record<MessageTemplateKey, string> = {
  initialInvitationSms: DEFAULT_INITIAL_INVITATION_SMS,
  speakerResponseAccepted: DEFAULT_SPEAKER_RESPONSE_ACCEPTED,
  speakerResponseDeclined: DEFAULT_SPEAKER_RESPONSE_DECLINED,
  bishopricResponseReceipt: DEFAULT_BISHOPRIC_RESPONSE_RECEIPT,
  bishopReplySms: DEFAULT_BISHOP_REPLY_SMS,
  bishopReplyEmail: DEFAULT_BISHOP_REPLY_EMAIL,
  prayerInitialInvitationSms: DEFAULT_PRAYER_INITIAL_INVITATION_SMS,
  prayerResponseAccepted: DEFAULT_PRAYER_RESPONSE_ACCEPTED,
  prayerResponseDeclined: DEFAULT_PRAYER_RESPONSE_DECLINED,
  prayerBishopricResponseReceipt: DEFAULT_PRAYER_BISHOPRIC_RESPONSE_RECEIPT,
};
