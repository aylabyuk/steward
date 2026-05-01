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

/** Speaker-side participant carrying BOTH a chat identity AND (when
 *  the speaker has a phone on file) an SMS messagingBinding on a
 *  single Twilio Conversations participant.
 *
 *  Why both on one participant: Twilio Conversations broadcasts every
 *  message to all participants with delivery channels. With the
 *  chat-identity and SMS binding split across two participants, a
 *  message authored by the chat-identity participant gets broadcast
 *  to the SMS-only participant — Twilio can't tell they're the same
 *  human, and the speaker receives their own web-side answer back as
 *  SMS (the "Yes, I can speak." echo). Combining identity + binding
 *  on one participant makes the de-dup automatic: Twilio knows the
 *  sender and the binding belong to the same participant and won't
 *  fan back to that channel.
 *
 *  Bonus side effect: the binding now carries the speaker's display
 *  name + role attributes, so the bishop's chat UI no longer renders
 *  SMS-originated messages as "Unknown".
 *
 *  Pass `smsBinding: undefined` for speakers with no phone on file —
 *  the participant is created chat-only, identical to bishopric
 *  participants. */
export async function addSpeakerParticipant(
  conversationSid: string,
  identity: string,
  attributes: {
    displayName: string;
    role: "speaker";
  },
  smsBinding?: { speakerPhoneE164: string; twilioFromNumber: string },
): Promise<string> {
  const params: Record<string, string> = {
    identity,
    attributes: JSON.stringify(attributes),
  };
  if (smsBinding) {
    params["messagingBinding.address"] = smsBinding.speakerPhoneE164;
    params["messagingBinding.proxyAddress"] = smsBinding.twilioFromNumber;
  }
  const p = await service().conversations(conversationSid).participants.create(params);
  return p.sid;
}

/** Frees the speaker phone's existing SMS binding(s) on this
 *  Conversations service before a new conversation tries to claim it.
 *  Twilio enforces uniqueness on (address, proxyAddress) pairs across
 *  all active conversations — without this cleanup, the second
 *  `addSpeakerParticipant` call for the same phone fails and inbound
 *  SMS routes to whichever conversation already owns the binding
 *  (often not the most recent one).
 *
 *  Real-world cases this catches:
 *  - Family-shared phone: the bishop sent invite to spouse A, then to
 *    spouse B. Most-recent-invite wins for SMS routing on that phone.
 *  - Test/staging churn: repeated invites to the same phone with
 *    different speakerIds (so `cleanupPriorConversations` doesn't
 *    catch them via its speakerId+meetingDate filter).
 *  - Stale state: any conversation orphaned by an earlier deploy
 *    error or manual cleanup that left bindings behind.
 *
 *  Removes the matching SMS-bound participant entirely (today that's
 *  the speaker's combined chat-identity + SMS-binding participant
 *  per `addSpeakerParticipant`). The prior chat history survives
 *  conversation-side; only that participant's attribution on past
 *  messages is freed. */
export async function freePhoneBindingConflicts(
  speakerPhoneE164: string,
  twilioFromNumber: string,
): Promise<void> {
  const svc = service();
  const conflicts = await svc.participantConversations.list({ address: speakerPhoneE164 });
  for (const c of conflicts) {
    const binding = c.participantMessagingBinding as
      | { address?: string; proxy_address?: string; type?: string }
      | undefined;
    if (
      binding?.type !== "sms" ||
      binding.address !== speakerPhoneE164 ||
      binding.proxy_address !== twilioFromNumber
    ) {
      continue;
    }
    if (!c.conversationSid || !c.participantSid) continue;
    await svc.conversations(c.conversationSid).participants(c.participantSid).remove();
  }
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
