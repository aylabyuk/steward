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
