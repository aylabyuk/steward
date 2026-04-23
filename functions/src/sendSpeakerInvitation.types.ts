export interface SendSpeakerInvitationRequest {
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

export interface DeliveryEntry {
  channel: "email" | "sms";
  status: "sent" | "failed";
  providerId?: string;
  error?: string;
  at: Date;
}

export interface SendSpeakerInvitationResponse {
  token: string;
  conversationSid: string;
  deliveryRecord: DeliveryEntry[];
}
