import type { Conversation } from "@twilio/conversations";

/** Marker on the Twilio Message's attributes subtree. Read by
 *  `threadItems.ts` to render the message as a centered system
 *  notice instead of a normal bubble, and by `messageActions.ts`
 *  to gate the tombstone itself from being deletable. */
export interface MessageDeletedAttributes {
  kind: "message-deleted";
}

/** Format the deleter's name + a short month-day stamp into the
 *  tombstone body. Centered system notice that replaces a deleted
 *  bubble in the thread, so the conversation still reads as a
 *  record (rather than a silent gap that could feel like
 *  manipulation when the speaker returns days later). */
export function formatDeletedNoticeBody(displayName: string, deletedAt: Date): string {
  const stamp = deletedAt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return `Message removed by ${displayName} · ${stamp}`;
}

/** Post a centered "Message removed by X · Apr 28" notice to the
 *  conversation right after a `message.remove()` succeeds. The
 *  notice itself is structural (`kind: "message-deleted"`) and is
 *  excluded from the deletable-window predicate so it can never be
 *  re-deleted. Best-effort: failures are logged and don't block. */
export async function postMessageDeletedNotice(
  conversation: Conversation | null,
  displayName: string,
  deletedAt: Date = new Date(),
): Promise<void> {
  if (!conversation) return;
  const body = formatDeletedNoticeBody(displayName, deletedAt);
  const attributes: MessageDeletedAttributes = { kind: "message-deleted" };
  try {
    await conversation.sendMessage(body, attributes);
  } catch (err) {
    console.warn("[steward] message-deleted notice failed", err);
  }
}
