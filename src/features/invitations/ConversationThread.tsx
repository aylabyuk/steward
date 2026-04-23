import { useEffect, useMemo, useRef, useState } from "react";
import { ConversationGroup } from "./ConversationGroup";
import { buildThreadItems } from "./threadItems";
import type { AuthorMap, ChatMessage } from "./useConversation";

interface Props {
  messages: readonly ChatMessage[];
  currentIdentity: string | null;
  authors: AuthorMap;
  loading?: boolean;
  /** First unread Twilio message index as seen by the current
   *  participant. When set, the thread inserts a "New messages"
   *  divider just before that index. */
  firstUnreadIndex?: number | null;
  /** Highest message index the other side has marked as read. When
   *  provided, the last mine=true bubble at or below this index gets
   *  a "Read" receipt rendered under it. */
  readHorizonIndex?: number | null;
}

/** Bubble list styled after Messenger: consecutive messages by the
 *  same author collapse into one group, one avatar at the bottom
 *  (theirs) or no avatar (mine), bubbles stack tight with shaped
 *  border-radius so the group reads as a single connected shape on
 *  the avatar-facing side. Day dividers appear between messages
 *  from different local days; a "New messages" divider appears
 *  before the first unread incoming message. */
export function ConversationThread({
  messages,
  currentIdentity,
  authors,
  loading,
  firstUnreadIndex,
  readHorizonIndex,
}: Props): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);

  const items = useMemo(
    () =>
      buildThreadItems({
        messages,
        currentIdentity,
        authors,
        firstUnreadIndex: firstUnreadIndex ?? null,
      }),
    [messages, currentIdentity, authors, firstUnreadIndex],
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (atBottom) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [items, atBottom]);

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

  const lastMineIndex = findLastMineIndex(messages, currentIdentity);
  const readByOtherAt =
    typeof readHorizonIndex === "number" && lastMineIndex !== null && readHorizonIndex >= lastMineIndex
      ? lastMineIndex
      : null;

  return (
    <div
      ref={scrollRef}
      className="flex flex-col gap-4 p-4 overflow-y-auto max-h-[60vh]"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      onScroll={(e) => {
        const el = e.currentTarget;
        setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 32);
      }}
    >
      {items.map((item) => {
        if (item.kind === "day") return <DayDivider key={item.key} label={item.label} />;
        if (item.kind === "unread") return <UnreadDivider key={item.key} />;
        return (
          <ConversationGroup
            key={item.key}
            group={item.group}
            readByOther={
              item.group.mine &&
              readByOtherAt !== null &&
              item.group.messages.some((m) => m.index === readByOtherAt)
            }
          />
        );
      })}
    </div>
  );
}

function findLastMineIndex(
  messages: readonly ChatMessage[],
  currentIdentity: string | null,
): number | null {
  if (!currentIdentity) return null;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]!.author === currentIdentity) return messages[i]!.index;
  }
  return null;
}

function DayDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 -my-1" aria-label={label}>
      <div className="flex-1 h-px bg-border" />
      <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-walnut-3">
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function UnreadDivider() {
  return (
    <div className="flex items-center gap-2 -my-1" aria-label="New messages">
      <div className="flex-1 h-px bg-bordeaux/40" />
      <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-bordeaux">
        New
      </span>
      <div className="flex-1 h-px bg-bordeaux/40" />
    </div>
  );
}
