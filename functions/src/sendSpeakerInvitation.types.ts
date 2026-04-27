export interface DeliveryEntry {
  channel: "email" | "sms";
  status: "sent" | "failed";
  providerId?: string;
  error?: string;
  at: Date;
}

/** Create-new path: builds a new invitation doc + conversation. */
export interface FreshInvitationRequest {
  mode?: "fresh";
  wardId: string;
  speakerId: string;
  meetingDate: string;
  channels: ("email" | "sms")[];
  speakerName: string;
  speakerTopic?: string;
  /** Discriminator for the kind of participant being invited. Default
   *  "speaker" preserves back-compat. When "prayer", `prayerRole` is
   *  required; the SMS body uses `prayerInitialInvitationSms` and the
   *  receipt copy uses the `prayer*` template keys. The same Twilio
   *  Conversation + capability-token plumbing is reused — full chat
   *  parity with speakers per product spec. */
  kind?: "speaker" | "prayer";
  /** Required when `kind === "prayer"`. Persisted on the invitation
   *  doc so the speaker landing page + receipt builders can resolve
   *  the right copy + variables (`{{prayerType}}`). */
  prayerRole?: "opening" | "benediction";
  inviterName: string;
  wardName: string;
  assignedDate: string;
  sentOn: string;
  bodyMarkdown: string;
  footerMarkdown: string;
  /** Lexical EditorState as a JSON string — the WYSIWYG-authored
   *  letter the bishop saw on screen. Stored on the invitation
   *  snapshot so the speaker landing page can re-render the exact
   *  letterhead / callout / signature components the bishop chose,
   *  not just the derived markdown. Optional during the migration
   *  window — invitations created before this rolled out won't have
   *  the field, and the renderer falls back to the markdown +
   *  hardcoded chrome path for those. */
  editorStateJson?: string;
  speakerEmail?: string;
  /** E.164 format, e.g. `+14165551234`. */
  speakerPhone?: string;
  bishopReplyToEmail: string;
  expiresAtMillis: number;
  /** Dev-mode override: when true, this invitation routes outbound
   *  SMS through TWILIO_FROM_NUMBER_TESTING instead of the production
   *  default. Honored only for callers on the email allowlist —
   *  silently ignored for everyone else. Persisted on the invitation
   *  doc as `fromNumberMode` so subsequent sends in the same thread
   *  (rotation, bishop-reply notification) stay on the same number. */
  useTestingNumber?: boolean;
}

/** Rotate-link path: generates a fresh capability token on an
 *  existing invitation, preserving the conversationSid + chat
 *  history. `channels` lists the delivery channels to re-deliver on;
 *  the plaintext URL is never returned to the caller — it only ever
 *  reaches the speaker via SMS/email. */
export interface RotateInvitationRequest {
  mode: "rotate";
  wardId: string;
  invitationId: string;
  channels: ("email" | "sms")[];
}

export type SendSpeakerInvitationRequest = FreshInvitationRequest | RotateInvitationRequest;

export interface FreshInvitationResponse {
  mode: "fresh";
  /** Firestore invitationId. Named `token` historically — it is
   *  never the plaintext capability value. */
  token: string;
  conversationSid: string;
  deliveryRecord: DeliveryEntry[];
}

export interface RotateInvitationResponse {
  mode: "rotate";
  deliveryRecord: DeliveryEntry[];
}

export type SendSpeakerInvitationResponse = FreshInvitationResponse | RotateInvitationResponse;
