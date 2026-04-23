import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { ConversationAvatar } from "./ConversationAvatar";
import { ConversationBubble, bubblePositionOf } from "./ConversationBubble";
import type { AuthorInfo, AuthorMap, ChatMessage } from "./useConversation";

interface Props {
  messages: readonly ChatMessage[];
  currentIdentity: string | null;
  authors: AuthorMap;
  loading?: boolean;
}

interface MessageGroup {
  key: string;
  author: string;
  mine: boolean;
  info: AuthorInfo;
  messages: readonly ChatMessage[];
}

/** Bubble list styled after Messenger: consecutive messages by the
 *  same author collapse into one group, one avatar at the bottom
 *  (theirs) or no avatar (mine), bubbles stack tight with shaped
 *  border-radius so the group reads as a single connected shape on
 *  the avatar-facing side. */
export function ConversationThread({
  messages,
  currentIdentity,
  authors,
  loading,
}: Props): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  if (loading) {
    return <p className="font-serif italic text-[14px] text-walnut-3 p-4">Loading conversation…</p>;
  }
  if (messages.length === 0) {
    return (
      <p className="font-serif italic text-[14px] text-walnut-3 p-4">
        Say hello — messages appear live for everyone in the conversation.
      </p>
    );
  }

  const groups = groupMessages(messages, currentIdentity, authors);

  return (
    <div ref={scrollRef} className="flex flex-col gap-4 p-4 overflow-y-auto max-h-[60vh]">
      {groups.map((g) => (
        <Group key={g.key} group={g} />
      ))}
    </div>
  );
}

function groupMessages(
  messages: readonly ChatMessage[],
  currentIdentity: string | null,
  authors: AuthorMap,
): MessageGroup[] {
  const groups: MessageGroup[] = [];
  for (const m of messages) {
    const last = groups.at(-1);
    if (last && last.author === m.author) {
      last.messages = [...last.messages, m];
      continue;
    }
    groups.push({
      key: m.sid,
      author: m.author,
      mine: m.author === currentIdentity,
      info: authors.get(m.author) ?? fallbackAuthor(m.author),
      messages: [m],
    });
  }
  return groups;
}

function fallbackAuthor(identity: string): AuthorInfo {
  if (identity.startsWith("speaker:")) return { displayName: "Speaker", role: "speaker" };
  if (identity.startsWith("uid:")) return { displayName: "Bishopric" };
  return { displayName: "Unknown" };
}

function Group({ group }: { group: MessageGroup }) {
  const lastMessage = group.messages.at(-1)!;
  const timestamp = lastMessage.dateCreated?.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return (
    <div className={cn("flex flex-col gap-1", group.mine ? "items-end" : "items-start")}>
      <div
        className={cn(
          "flex items-end gap-2 max-w-[85%]",
          group.mine ? "flex-row-reverse" : "flex-row",
        )}
      >
        {!group.mine && <ConversationAvatar author={group.info} />}
        <div
          className={cn("flex flex-col gap-0.5 min-w-0", group.mine ? "items-end" : "items-start")}
        >
          {!group.mine && (
            <span className="font-mono text-[9.5px] tracking-[0.08em] text-walnut-3 mb-0.5 max-w-full truncate">
              {group.info.email ?? group.info.displayName}
            </span>
          )}
          {group.messages.map((m, i) => (
            <ConversationBubble
              key={m.sid}
              message={m}
              mine={group.mine}
              position={bubblePositionOf(i, group.messages.length)}
            />
          ))}
          {timestamp && (
            <span className="font-mono text-[9.5px] text-walnut-3 mt-0.5">{timestamp}</span>
          )}
        </div>
      </div>
    </div>
  );
}
