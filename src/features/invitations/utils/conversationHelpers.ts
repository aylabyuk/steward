import type { Message, Participant } from "@twilio/conversations";
import type { AuthorInfo, ChatMessage } from "../hooks/useConversation";

export function toChatMessage(m: Message): ChatMessage {
  let attributes: Record<string, unknown> | null = null;
  const raw = m.attributes;
  if (raw && typeof raw === "object") attributes = raw as Record<string, unknown>;
  return {
    sid: m.sid,
    index: m.index,
    author: m.author ?? "",
    body: m.body ?? "",
    dateCreated: m.dateCreated ?? null,
    dateUpdated: m.dateUpdated ?? null,
    attributes,
  };
}

export function parseAuthorInfo(p: Participant): AuthorInfo | null {
  const attrs = p.attributes as {
    displayName?: string;
    role?: AuthorInfo["role"];
    email?: string;
  } | null;
  if (!attrs?.displayName) return null;
  const info: AuthorInfo = { displayName: attrs.displayName };
  if (attrs.role) info.role = attrs.role;
  if (attrs.email) info.email = attrs.email;
  return info;
}
