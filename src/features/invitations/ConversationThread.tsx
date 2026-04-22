import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { ConversationAvatar } from "./ConversationAvatar";
import type { AuthorInfo, AuthorMap, ChatMessage } from "./useConversation";

interface Props {
  messages: readonly ChatMessage[];
  currentIdentity: string | null;
  /** Resolves author identity → `{ displayName, role, photoURL? }`.
   *  Merged across Twilio participant attributes + ward-members
   *  fallback + the current user's auth profile before being passed
   *  in. Used for bubble labels + avatars. */
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

/** Bubble list for a Twilio conversation. Consecutive messages by
 *  the same author are collapsed into one group — one avatar + one
 *  author label + a tight stack of bubbles + a single timestamp at
 *  the end of the group. Mine = right-aligned; others = left. */
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
    <div ref={scrollRef} className="flex flex-col gap-3 p-4 overflow-y-auto max-h-[60vh]">
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
  return (
    <div
      className={cn(
        "flex items-start gap-2 max-w-[85%]",
        group.mine ? "self-end flex-row-reverse" : "self-start",
      )}
    >
      <ConversationAvatar author={group.info} />
      <div className={cn("flex flex-col gap-0.5 min-w-0", group.mine ? "items-end" : "items-start")}>
        <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-walnut-3">
          {group.info.displayName}
        </span>
        <div className={cn("flex flex-col gap-0.5", group.mine ? "items-end" : "items-start")}>
          {group.messages.map((m) => (
            <Bubble key={m.sid} message={m} mine={group.mine} />
          ))}
        </div>
        {lastMessage.dateCreated && (
          <span className="font-mono text-[9.5px] text-walnut-3 mt-0.5">
            {lastMessage.dateCreated.toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
    </div>
  );
}

function Bubble({ message, mine }: { message: ChatMessage; mine: boolean }) {
  const responseType = message.attributes?.responseType as "yes" | "no" | undefined;
  return (
    <div className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
      {responseType && (
        <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brass-deep mb-0.5">
          {responseType === "yes" ? "Response · Yes" : "Response · No"}
        </span>
      )}
      <div
        className={cn(
          "rounded-[12px] px-3 py-2 text-[13.5px] leading-snug whitespace-pre-wrap wrap-break-word",
          mine ? "bg-bordeaux text-parchment" : "bg-parchment-2 border border-border text-walnut",
          responseType === "yes" && "border-success border-2",
          responseType === "no" && "border-bordeaux border-2",
        )}
      >
        {message.body}
      </div>
    </div>
  );
}

