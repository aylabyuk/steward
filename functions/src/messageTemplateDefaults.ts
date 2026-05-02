/**
 * Server-side defaults for the six editable messaging templates.
 * Each string reproduces the copy the Cloud Function sent before the
 * template became editable — so wards without a Firestore override
 * see identical behavior.
 *
 * **Keep in sync with `src/features/templates/serverTemplateDefaults.ts`.**
 * The two files can't share a module (separate pnpm workspaces); a
 * drift test in `messageTemplates.test.ts` asserts they stay aligned.
 *
 * Variables use the `{{name}}` syntax — see `interpolate` in
 * `messageTemplates.ts`.
 */

export const DEFAULT_INITIAL_INVITATION_SMS = [
  "Hi {{speakerName}} — {{inviterName}} ({{wardName}}) invites you to speak on {{assignedDate}}. Topic: {{topic}}.",
  "",
  "Tap to read the full letter and reply via chat (richer than SMS, and the bishopric prefers to keep the conversation in one place): {{inviteUrl}}",
  "",
  "Reply STOP to opt out.",
].join("\n");

export const DEFAULT_SPEAKER_RESPONSE_ACCEPTED =
  "You accepted the invitation to speak on {{assignedDate}}. Thank you.";

export const DEFAULT_SPEAKER_RESPONSE_DECLINED =
  "You declined the invitation to speak on {{assignedDate}}. Thank you for letting us know.";

export const DEFAULT_BISHOPRIC_RESPONSE_RECEIPT =
  "{{speakerName}} {{verb}} the invitation to speak on {{assignedDate}}.";

export const DEFAULT_BISHOP_REPLY_SMS =
  '{{wardName}}: new message from the bishopric about your speaking assignment — "{{preview}}". Open: {{inviteUrl}}';

export const DEFAULT_BISHOP_REPLY_EMAIL = [
  "{{inviterName}} replied to your invitation for {{assignedDate}}:",
  "",
  "{{preview}}",
  "",
  "To reply back, open the invitation link in the text message we sent you.",
  "",
  "— {{wardName}}",
].join("\n");

export const DEFAULT_PRAYER_INITIAL_INVITATION_SMS = [
  "Hi {{speakerName}} — {{inviterName}} ({{wardName}}) invites you to give the {{prayerType}} on {{assignedDate}}.",
  "",
  "Tap to read the full letter and reply via chat (richer than SMS, and the bishopric prefers to keep the conversation in one place): {{inviteUrl}}",
  "",
  "Reply STOP to opt out.",
].join("\n");

export const DEFAULT_PRAYER_RESPONSE_ACCEPTED =
  "You accepted the invitation to give the {{prayerType}} on {{assignedDate}}. Thank you.";

export const DEFAULT_PRAYER_RESPONSE_DECLINED =
  "You declined the invitation to give the {{prayerType}} on {{assignedDate}}. Thank you for letting us know.";

export const DEFAULT_PRAYER_BISHOPRIC_RESPONSE_RECEIPT =
  "{{speakerName}} {{verb}} the invitation to give the {{prayerType}} on {{assignedDate}}.";

export const DEFAULT_SPEAKER_RESPONSE_ACCEPTED_SMS =
  "Thanks {{speakerName}} — your acceptance to speak on {{assignedDate}} is recorded. — {{wardName}}";

export const DEFAULT_SPEAKER_RESPONSE_DECLINED_SMS =
  "Thanks {{speakerName}} — your decline of the speaking invitation for {{assignedDate}} is recorded. — {{wardName}}";

export const DEFAULT_PRAYER_RESPONSE_ACCEPTED_SMS =
  "Thanks {{speakerName}} — your acceptance to give the {{prayerType}} on {{assignedDate}} is recorded. — {{wardName}}";

export const DEFAULT_PRAYER_RESPONSE_DECLINED_SMS =
  "Thanks {{speakerName}} — your decline of the {{prayerType}} for {{assignedDate}} is recorded. — {{wardName}}";

export type MessageTemplateKey =
  | "initialInvitationSms"
  | "speakerResponseAccepted"
  | "speakerResponseDeclined"
  | "speakerResponseAcceptedSms"
  | "speakerResponseDeclinedSms"
  | "bishopricResponseReceipt"
  | "bishopReplySms"
  | "bishopReplyEmail"
  | "prayerInitialInvitationSms"
  | "prayerResponseAccepted"
  | "prayerResponseDeclined"
  | "prayerResponseAcceptedSms"
  | "prayerResponseDeclinedSms"
  | "prayerBishopricResponseReceipt";

export const DEFAULT_MESSAGE_TEMPLATES: Record<MessageTemplateKey, string> = {
  initialInvitationSms: DEFAULT_INITIAL_INVITATION_SMS,
  speakerResponseAccepted: DEFAULT_SPEAKER_RESPONSE_ACCEPTED,
  speakerResponseDeclined: DEFAULT_SPEAKER_RESPONSE_DECLINED,
  speakerResponseAcceptedSms: DEFAULT_SPEAKER_RESPONSE_ACCEPTED_SMS,
  speakerResponseDeclinedSms: DEFAULT_SPEAKER_RESPONSE_DECLINED_SMS,
  bishopricResponseReceipt: DEFAULT_BISHOPRIC_RESPONSE_RECEIPT,
  bishopReplySms: DEFAULT_BISHOP_REPLY_SMS,
  bishopReplyEmail: DEFAULT_BISHOP_REPLY_EMAIL,
  prayerInitialInvitationSms: DEFAULT_PRAYER_INITIAL_INVITATION_SMS,
  prayerResponseAccepted: DEFAULT_PRAYER_RESPONSE_ACCEPTED,
  prayerResponseDeclined: DEFAULT_PRAYER_RESPONSE_DECLINED,
  prayerResponseAcceptedSms: DEFAULT_PRAYER_RESPONSE_ACCEPTED_SMS,
  prayerResponseDeclinedSms: DEFAULT_PRAYER_RESPONSE_DECLINED_SMS,
  prayerBishopricResponseReceipt: DEFAULT_PRAYER_BISHOPRIC_RESPONSE_RECEIPT,
};
