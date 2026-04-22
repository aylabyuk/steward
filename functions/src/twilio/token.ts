import twilio from "twilio";

const { AccessToken } = twilio.jwt;
const { ChatGrant } = AccessToken;

export interface ChatTokenInput {
  identity: string;
  /** Specific conversationSid to scope the grant to. When omitted, the
   *  grant covers the whole Conversations service (bishopric path). */
  conversationSid?: string;
  ttlSeconds?: number;
}

/** Mints a short-lived Twilio Access Token (JWT) for a chat client.
 *  Uses the dedicated API Key SID + Secret (not the Account Auth
 *  Token) so rotating signing keys doesn't break server-side REST.
 *
 *  Note on scoping: the Twilio Conversations SDK uses ChatGrant +
 *  serviceSid. Per-conversation scoping isn't directly enforced by
 *  the grant — Twilio instead relies on conversation membership
 *  (participants). We control membership via addParticipant at send
 *  time, so a JWT minted for `speaker:{token}` can only see the
 *  conversations that identity is a participant of. */
export function issueChatToken({ identity, ttlSeconds = 3600 }: ChatTokenInput): string {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKeySid = process.env.TWILIO_API_KEY_SID;
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
  const serviceSid = process.env.TWILIO_CONVERSATIONS_SERVICE_SID;
  if (!accountSid || !apiKeySid || !apiKeySecret || !serviceSid) {
    throw new Error("Twilio JWT credentials missing.");
  }
  const token = new AccessToken(accountSid, apiKeySid, apiKeySecret, {
    identity,
    ttl: ttlSeconds,
  });
  token.addGrant(new ChatGrant({ serviceSid }));
  return token.toJwt();
}
