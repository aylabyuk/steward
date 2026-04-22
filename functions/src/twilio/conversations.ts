import { getTwilioClient } from "./client.js";

function service() {
  const serviceSid = process.env.TWILIO_CONVERSATIONS_SERVICE_SID;
  if (!serviceSid) throw new Error("TWILIO_CONVERSATIONS_SERVICE_SID missing.");
  return getTwilioClient().conversations.v1.services(serviceSid);
}

export interface CreateConversationInput {
  friendlyName: string;
  attributes?: Record<string, unknown>;
}

export async function createConversation(input: CreateConversationInput): Promise<string> {
  const convo = await service().conversations.create({
    friendlyName: input.friendlyName,
    ...(input.attributes ? { attributes: JSON.stringify(input.attributes) } : {}),
  });
  return convo.sid;
}

/** Chat participant identified by a persistent string (not a phone
 *  binding). Used for every bishopric / clerk in the ward (identity
 *  `uid:{firebaseUid}`) plus the speaker (`speaker:{token}`).
 *
 *  Attributes travel with the participant and are readable by every
 *  other client — that's how we carry display-name + role down so
 *  the message list can show "Bishop Haymond" instead of a raw
 *  `uid:abc123` on each bubble. */
export async function addChatParticipant(
  conversationSid: string,
  identity: string,
  attributes?: { displayName?: string; role?: "speaker" | "bishopric" | "clerk" },
): Promise<string> {
  const p = await service()
    .conversations(conversationSid)
    .participants.create({
      identity,
      ...(attributes ? { attributes: JSON.stringify(attributes) } : {}),
    });
  return p.sid;
}

/** Speaker-side SMS participant. Twilio bridges messages in this
 *  conversation to/from the speaker's phone automatically. Returns
 *  the participant SID; throws if Twilio rejects (bad phone format,
 *  cross-border 10DLC block, etc.). */
export async function addSmsParticipant(
  conversationSid: string,
  speakerPhoneE164: string,
  twilioFromNumber: string,
): Promise<string> {
  const p = await service()
    .conversations(conversationSid)
    .participants.create({
      "messagingBinding.address": speakerPhoneE164,
      "messagingBinding.proxyAddress": twilioFromNumber,
    });
  return p.sid;
}

export interface PostMessageInput {
  conversationSid: string;
  author: string;
  body: string;
  attributes?: Record<string, unknown>;
}

/** Hard-deletes a Twilio Conversation by SID. Used to free up an
 *  SMS binding (phone + proxy) before creating a new conversation for
 *  the same speaker — Twilio enforces one binding per phone per
 *  proxy and rejects `addSmsParticipant` otherwise. Safe to call on
 *  an already-deleted SID: Twilio returns 404 which we let bubble. */
export async function deleteConversation(conversationSid: string): Promise<void> {
  await service().conversations(conversationSid).remove();
}

export async function postMessage(input: PostMessageInput): Promise<string> {
  const m = await service()
    .conversations(input.conversationSid)
    .messages.create({
      author: input.author,
      body: input.body,
      ...(input.attributes ? { attributes: JSON.stringify(input.attributes) } : {}),
    });
  return m.sid;
}
