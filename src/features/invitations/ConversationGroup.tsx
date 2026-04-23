import { cn } from "@/lib/cn";
import { ConversationAvatar } from "./ConversationAvatar";
import { ConversationBubble, bubblePositionOf } from "./ConversationBubble";
import type { MessageGroup } from "./threadItems";

interface Props {
  group: MessageGroup;
  /** When true, the last mine=true bubble in the group is the latest
   *  message the other side has marked as read — show "Read" under it. */
  readByOther?: boolean;
  selfIdentity: string | null;
  onReact: (sid: string, emoji: string) => void;
}

/** Renders one author's run of consecutive messages as a connected
 *  stack with a single avatar + trailing timestamp. Read receipt is
 *  a small "Read" label under the last bubble on mine=true groups
 *  when the other participant has read up to that index. */
export function ConversationGroup({
  group,
  readByOther,
  selfIdentity,
  onReact,
}: Props): React.ReactElement {
  const last = group.messages.at(-1)!;
  const timestamp = last.dateCreated?.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const fullTimestamp = last.dateCreated?.toLocaleString();
  const authorLabel = group.mine ? "You" : group.info.displayName;
  const groupLabel = fullTimestamp ? `${authorLabel} at ${fullTimestamp}` : authorLabel;
  return (
    <div
      className={cn("flex flex-col gap-1", group.mine ? "items-end" : "items-start")}
      role="group"
      aria-label={groupLabel}
    >
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
              {group.info.displayName}
            </span>
          )}
          {group.messages.map((m, i) => (
            <ConversationBubble
              key={m.sid}
              message={m}
              mine={group.mine}
              position={bubblePositionOf(i, group.messages.length)}
              selfIdentity={selfIdentity}
              onReact={onReact}
            />
          ))}
          {timestamp && (
            <span className="font-mono text-[9.5px] text-walnut-3 mt-0.5" title={fullTimestamp}>
              {timestamp}
            </span>
          )}
          {group.mine && readByOther && (
            <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brass-deep">
              Read
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
