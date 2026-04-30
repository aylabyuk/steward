import type { Conversation, Message } from "@twilio/conversations";
import { mergeReactionsIntoAttributes, parseReactions, toggleReaction } from "./reactions";

/** Look up a Twilio Message by sid. Pulls the most recent 1000
 *  messages — the edit/delete affordances are gated to the last five
 *  so the sid is always in-window. */
async function findMessage(conversation: Conversation, sid: string): Promise<Message> {
  const page = await conversation.getMessages(1000);
  const found = page.items.find((m) => m.sid === sid);
  if (!found) throw new Error("Message not found.");
  return found;
}

/** Hard-delete a single message. Twilio fires `messageRemoved` on
 *  the conversation, which `useConversation` listens for — the
 *  bubble disappears from every live subscriber without extra
 *  plumbing. */
export async function removeMessage(conversation: Conversation | null, sid: string): Promise<void> {
  if (!conversation) throw new Error("Conversation not connected.");
  const message = await findMessage(conversation, sid);
  await message.remove();
}

/** Update a message body in place. `messageUpdated` fires on the
 *  conversation and `useConversation` replaces the existing
 *  `ChatMessage`. `dateUpdated` moves past `dateCreated`, which the
 *  bubble uses to render the "Edited" indicator. */
export async function updateMessageBody(
  conversation: Conversation | null,
  sid: string,
  nextBody: string,
): Promise<void> {
  if (!conversation) throw new Error("Conversation not connected.");
  const message = await findMessage(conversation, sid);
  await message.updateBody(nextBody);
}

/** Toggle a reaction on a message. Reads the current attributes,
 *  flips the (emoji, identity) pair via `toggleReaction`, and
 *  writes the merged blob back via `updateAttributes` — Twilio
 *  doesn't expose a patch API, so this is read-merge-write.
 *  Last-write-wins on simultaneous taps from different clients
 *  (acceptable for the small bishopric audience). */
export async function toggleMessageReaction(
  conversation: Conversation | null,
  sid: string,
  identity: string,
  emoji: string,
): Promise<void> {
  if (!conversation) throw new Error("Conversation not connected.");
  const message = await findMessage(conversation, sid);
  const raw =
    message.attributes && typeof message.attributes === "object"
      ? (message.attributes as Record<string, unknown>)
      : null;
  const current = parseReactions(raw);
  const next = toggleReaction(current, emoji, identity);
  const merged = mergeReactionsIntoAttributes(next, raw);
  await message.updateAttributes(merged);
}
