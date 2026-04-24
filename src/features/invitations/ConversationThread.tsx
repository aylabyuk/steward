import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { ConversationGroup } from "./ConversationGroup";
import { JumpToLatest } from "./JumpToLatest";
import { DayDivider, UnreadDivider } from "./ThreadDividers";
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
  /** When true, the thread expands to fill a flex parent (the full-
   *  screen bishop dialog does this). When false (default) the thread
   *  is capped at 60vh — right for the speaker landing page where the
   *  thread sits inside a naturally-stacking scroll column. */
  fillHeight?: boolean;
}

/** Bubble list styled after Messenger. Consecutive messages by the
 *  same author collapse into one group; day dividers separate local
 *  days; a "New" divider marks the unread horizon; a floating pill
 *  appears when the user has scrolled up and new messages land. */
export function ConversationThread({
  messages,
  currentIdentity,
  authors,
  loading,
  firstUnreadIndex,
  readHorizonIndex,
  fillHeight,
}: Props): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [unseenCount, setUnseenCount] = useState(0);
  const lastSeenIndexRef = useRef<number | null>(null);

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
    if (atBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      lastSeenIndexRef.current = messages.at(-1)?.index ?? null;
      setUnseenCount(0);
      return;
    }
    const seen = lastSeenIndexRef.current;
    setUnseenCount(messages.filter((m) => (seen === null ? true : m.index > seen)).length);
  }, [items, atBottom, messages]);

  function jumpToBottom() {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }

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
    typeof readHorizonIndex === "number" &&
    lastMineIndex !== null &&
    readHorizonIndex >= lastMineIndex
      ? lastMineIndex
      : null;

  return (
    <div className={cn("relative", fillHeight && "flex-1 flex flex-col min-h-0")}>
      <div
        ref={scrollRef}
        className={cn(
          "flex flex-col gap-4 p-4 overflow-y-auto",
          fillHeight ? "flex-1 min-h-0" : "max-h-[60vh]",
        )}
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
          if (item.kind === "system")
            return <SystemNotice key={item.key} body={item.body} status={item.status} />;
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
      {!atBottom && <JumpToLatest unseenCount={unseenCount} onJump={jumpToBottom} />}
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

/** Centered one-line system notice for status-change messages,
 *  mirroring the DayDivider rule-label-rule pattern so it reads as
 *  a thread event rather than a message. Text + rule colour pivot
 *  on status: green for confirmed, red for declined. */
function SystemNotice({ body, status }: { body: string; status: "confirmed" | "declined" }) {
  const textCls = status === "confirmed" ? "text-success" : "text-bordeaux";
  const ruleCls = status === "confirmed" ? "bg-success/40" : "bg-bordeaux/40";
  return (
    <div className="flex items-center gap-2 -my-1" role="status" aria-label={body}>
      <div aria-hidden="true" className={`flex-1 h-px ${ruleCls}`} />
      <span
        aria-hidden="true"
        className={`font-serif italic text-[12px] ${textCls} truncate`}
        title={body}
      >
        {body}
      </span>
      <div aria-hidden="true" className={`flex-1 h-px ${ruleCls}`} />
    </div>
  );
}
