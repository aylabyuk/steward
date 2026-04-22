import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

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
  speakerPhone?: string;
  bishopReplyToEmail: string;
  expiresAtMillis: number;
}

export interface DeliveryEntry {
  channel: "email" | "sms";
  status: "sent" | "failed";
  providerId?: string;
  error?: string;
  at: string;
}

export interface SendSpeakerInvitationResponse {
  token: string;
  conversationSid: string;
  deliveryRecord: DeliveryEntry[];
}

export async function callSendSpeakerInvitation(
  input: SendSpeakerInvitationRequest,
): Promise<SendSpeakerInvitationResponse> {
  const fn = httpsCallable<SendSpeakerInvitationRequest, SendSpeakerInvitationResponse>(
    functions,
    "sendSpeakerInvitation",
  );
  const { data } = await fn(input);
  return data;
}

export interface IssueTwilioTokenRequest {
  wardId: string;
  invitationToken?: string;
}

export interface IssueTwilioTokenResponse {
  jwt: string;
  identity: string;
  expiresInSeconds: number;
}

export async function callIssueTwilioToken(
  input: IssueTwilioTokenRequest,
): Promise<IssueTwilioTokenResponse> {
  const fn = httpsCallable<IssueTwilioTokenRequest, IssueTwilioTokenResponse>(
    functions,
    "issueTwilioToken",
  );
  const { data } = await fn(input);
  return data;
}
