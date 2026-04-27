import { httpsCallable, type Functions } from "firebase/functions";
import { functions, inviteFunctions } from "@/lib/firebase";

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
  /** Lexical EditorState JSON, post-interpolation. Optional during
   *  the WYSIWYG-renderer migration window. */
  editorStateJson?: string;
  speakerEmail?: string;
  speakerPhone?: string;
  bishopReplyToEmail: string;
  expiresAtMillis: number;
  /** Dev-mode override (allowlisted callers only). Server silently
   *  downgrades to the production number for non-allowlisted callers. */
  useTestingNumber?: boolean;
}

export interface RotateInvitationRequest {
  mode: "rotate";
  wardId: string;
  invitationId: string;
  channels: ("email" | "sms")[];
}

export type SendSpeakerInvitationRequest = FreshInvitationRequest | RotateInvitationRequest;

export interface DeliveryEntry {
  channel: "email" | "sms";
  status: "sent" | "failed";
  providerId?: string;
  error?: string;
  at: string;
}

export interface FreshInvitationResponse {
  mode: "fresh";
  token: string;
  conversationSid: string;
  deliveryRecord: DeliveryEntry[];
}

export interface RotateInvitationResponse {
  mode: "rotate";
  deliveryRecord: DeliveryEntry[];
}

export type SendSpeakerInvitationResponse = FreshInvitationResponse | RotateInvitationResponse;

export async function callSendSpeakerInvitation(
  input: FreshInvitationRequest,
): Promise<FreshInvitationResponse> {
  const fn = httpsCallable<FreshInvitationRequest, FreshInvitationResponse>(
    functions,
    "sendSpeakerInvitation",
  );
  const { data } = await fn(input);
  return data;
}

/** Bishop-driven: rotate the capability token on an existing
 *  invitation and redeliver via email/SMS. The fresh plaintext URL
 *  is embedded in the delivery body and never returned to the caller. */
export async function callRotateInvitationLink(
  input: RotateInvitationRequest,
): Promise<RotateInvitationResponse> {
  const fn = httpsCallable<RotateInvitationRequest, RotateInvitationResponse>(
    functions,
    "sendSpeakerInvitation",
  );
  const { data } = await fn(input);
  return data;
}

export interface IssueSpeakerSessionRequest {
  wardId: string;
  /** Firestore doc ID of the invitation. Required for speaker sign-in
   *  + refresh; bishopric callers omit. */
  invitationId?: string;
  /** Capability value from the invitation URL. Hashed server-side
   *  and compared to the stored hash. Required on first exchange;
   *  omitted on speaker refresh once they're already signed in. */
  invitationToken?: string;
}

export type IssueSpeakerSessionResponse =
  | {
      status: "ready";
      /** Firebase custom token minted by issueSpeakerSession. Empty
       *  string on bishopric + already-signed-in-speaker paths; the
       *  client skips signInWithCustomToken when empty. */
      firebaseCustomToken?: string;
      twilioToken: string;
      identity: string;
      expiresInSeconds: number;
    }
  | { status: "rotated"; phoneLast4: string | null }
  | { status: "rate-limited" }
  | { status: "invalid" };

/** Route the callable through either the main `functions` instance
 *  (for bishopric callers) or the isolated `inviteFunctions` instance
 *  (for speaker callers on the invite page). The invite page MUST
 *  use `inviteFunctions` so the Firebase session it creates lives on
 *  the named `invite` app, keeping the main app's Google session
 *  untouched. */
export async function callIssueSpeakerSession(
  input: IssueSpeakerSessionRequest,
  options: { useInviteApp?: boolean } = {},
): Promise<IssueSpeakerSessionResponse> {
  const target: Functions = options.useInviteApp ? inviteFunctions : functions;
  const fn = httpsCallable<IssueSpeakerSessionRequest, IssueSpeakerSessionResponse>(
    target,
    "issueSpeakerSession",
  );
  const { data } = await fn(input);
  return data;
}
