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
  attributes?: {
    displayName?: string;
    role?: "speaker" | "bishopric" | "clerk";
    /** Signed-in email, carried so other clients' `AuthorMap` can
     *  render it in the bubble eyebrow + the bishop's identity
     *  banner without round-tripping to Firestore. */
    email?: string;
  },
): Promise<string> {
  const p = await service()
    .conversations(conversationSid)
    .participants.create({
      identity,
      ...(attributes ? { attributes: JSON.stringify(attributes) } : {}),
    });
  return p.sid;
}

/** Idempotent wrapper around addChatParticipant — swallows Twilio's
 *  "Participant already exists" (code 50433 / HTTP 409). Used on the
 *  backfill path when a bishopric member opens a chat for an
 *  invitation created before they joined the ward: we unconditionally
 *  attempt to add them and ignore the already-a-member case. */
export async function ensureChatParticipant(
  conversationSid: string,
  identity: string,
  attributes?: Parameters<typeof addChatParticipant>[2],
): Promise<void> {
  try {
    await addChatParticipant(conversationSid, identity, attributes);
  } catch (err) {
    const e = err as { code?: number; status?: number };
    if (e?.code === 50433 || e?.status === 409) return;
    throw err;
  }
}

export interface PostMessageInput {
  conversationSid: string;
  author: string;
  body: string;
  attributes?: Record<string, unknown>;
}

/** Hard-deletes a Twilio Conversation by SID. Retained for explicit
 *  full-purge use cases (none in the current code path — see
 *  `closeConversation` for the resend-cleanup path). Safe to call on
 *  an already-deleted SID: Twilio returns 404 which we let bubble. */
export async function deleteConversation(conversationSid: string): Promise<void> {
  await service().conversations(conversationSid).remove();
}

/** Archive a Twilio Conversation: set its `state` to `closed` and
 *  prefix the friendly name with `[archived]`. Closed conversations
 *  stop accepting new messages but the history remains in the
 *  Conversations service for audit purposes. Used by
 *  `cleanupPriorConversations` so a re-send doesn't destroy the
 *  prior thread — the speaker (in their fresh invitation) sees a new
 *  conversation under a new SID, while bishopric record-keeping
 *  retains the closed thread. */
export async function closeConversation(conversationSid: string): Promise<void> {
  const convo = service().conversations(conversationSid);
  // Fetch the current friendlyName so we can prefix it idempotently
  // (avoids `[archived] [archived] ...` if cleanup runs twice for any
  // reason, e.g. retry).
  const current = await convo.fetch();
  const prefix = "[archived] ";
  const friendlyName = current.friendlyName?.startsWith(prefix)
    ? current.friendlyName
    : `${prefix}${current.friendlyName ?? ""}`.trim();
  await convo.update({ state: "closed", friendlyName });
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
