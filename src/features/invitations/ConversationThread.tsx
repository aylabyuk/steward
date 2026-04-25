import { useEffect, useMemo, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useMinuteTick } from "@/hooks/useMinuteTick";
import { cn } from "@/lib/cn";
import { ConversationGroup } from "./ConversationGroup";
import { JumpToLatest } from "./JumpToLatest";
import { SystemNotice } from "./SystemNotice";
import { DayDivider, UnreadDivider } from "./ThreadDividers";
import { buildMessagePermissions, findLastMineIndex } from "./messageActions";
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
  /** Per-message action handlers. When omitted, edit/delete UI is
   *  hidden even if permissions would otherwise allow it (the
   *  action isn't wired into the embedding chat). */
  onEditMessage?: (sid: string, nextBody: string) => Promise<void> | void;
  onDeleteMessage?: (sid: string) => Promise<void> | void;
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
  onEditMessage,
  onDeleteMessage,
}: Props): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [unseenCount, setUnseenCount] = useState(0);
  const [pendingDeleteSid, setPendingDeleteSid] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const lastSeenIndexRef = useRef<number | null>(null);
  // Drives the 30-min edit/delete cutoff — the long-press menu must
  // disappear once a message expires, even if no new traffic arrives.
  const nowMinute = useMinuteTick();

  const permissions = useMemo(
    () => buildMessagePermissions(currentIdentity, messages, nowMinute * 60_000),
    [currentIdentity, messages, nowMinute],
  );

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

  async function handleDeleteConfirm() {
    if (!pendingDeleteSid || !onDeleteMessage) return;
    setDeleting(true);
    try {
      await onDeleteMessage(pendingDeleteSid);
      setPendingDeleteSid(null);
    } finally {
      setDeleting(false);
    }
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
              permissions={permissions}
              {...(onEditMessage ? { onEditMessage } : {})}
              {...(onDeleteMessage ? { onRequestDelete: setPendingDeleteSid } : {})}
            />
          );
        })}
      </div>
      {!atBottom && <JumpToLatest unseenCount={unseenCount} onJump={jumpToBottom} />}
      <ConfirmDialog
        open={pendingDeleteSid !== null}
        title="Delete this message?"
        body="The message will be removed for everyone in this conversation. This can't be undone."
        confirmLabel="Delete"
        danger
        busy={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setPendingDeleteSid(null)}
      />
    </div>
  );
}
