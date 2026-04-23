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
  speakerEmail?: string;
  /** E.164 format, e.g. `+14165551234`. */
  speakerPhone?: string;
  bishopReplyToEmail: string;
  expiresAtMillis: number;
}

/** Rotate-link path: generates a fresh capability token on an
 *  existing invitation, preserving the conversationSid + chat
 *  history. `channels` may be empty — the bishop may want to copy
 *  the URL to their clipboard without triggering another SMS/email. */
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
  /** Freshly-rotated URL carrying a new capability token. Plaintext
   *  leaves the server here exactly once; Firestore stores only the
   *  new hash. */
  inviteUrl: string;
  deliveryRecord: DeliveryEntry[];
}

export type SendSpeakerInvitationResponse = FreshInvitationResponse | RotateInvitationResponse;
