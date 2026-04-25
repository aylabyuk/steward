import { cn } from "@/lib/cn";
import { ConversationAvatar } from "./ConversationAvatar";
import { ConversationBubble, bubblePositionOf } from "./ConversationBubble";
import type { Permissions } from "./messageActions";
import type { MessageGroup } from "./threadItems";

interface Props {
  group: MessageGroup;
  /** When true, the last mine=true bubble in the group is the latest
   *  message the other side has marked as read — show "Read" under it. */
  readByOther?: boolean;
  /** Per-message delete/edit permissions computed by the thread.
   *  When omitted, bubble actions stay hidden regardless of handlers. */
  permissions?: Permissions;
  /** Opens the thread-level delete-confirm dialog for the given
   *  message sid. Thread owns the dialog so one shared instance
   *  covers every bubble. */
  onRequestDelete?: (sid: string) => void;
  /** Called when a bubble's inline edit form saves. The thread
   *  forwards to Twilio `Message.updateBody`. */
  onEditMessage?: (sid: string, nextBody: string) => Promise<void> | void;
}

/** Renders one author's run of consecutive messages as a connected
 *  stack with a single avatar + trailing timestamp. Read receipt is
 *  a small "Read" label under the last bubble on mine=true groups
 *  when the other participant has read up to that index. */
export function ConversationGroup({
  group,
  readByOther,
  permissions,
  onRequestDelete,
  onEditMessage,
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
      className={cn("flex flex-col gap-0.5", group.mine ? "items-end" : "items-start")}
      role="group"
      aria-label={groupLabel}
    >
      {/* Name eyebrow sits above the avatar row, indented past the
          avatar slot so it lines up with the bubbles. Kept outside
          the flex row so the avatar below can align against the
          bubble stack without the eyebrow skewing the computation. */}
      {!group.mine && (
        <span className="ml-11 font-mono text-[9.5px] tracking-[0.08em] text-walnut-3 mb-0.5 max-w-full truncate">
          {group.info.displayName}
        </span>
      )}
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
          {group.messages.map((m, i) => {
            const canEdit = Boolean(permissions?.canEdit(m) && onEditMessage);
            const canDelete = Boolean(permissions?.canDelete(m) && onRequestDelete);
            return (
              <ConversationBubble
                key={m.sid}
                message={m}
                mine={group.mine}
                position={bubblePositionOf(i, group.messages.length)}
                canEdit={canEdit}
                canDelete={canDelete}
                {...(canEdit && onEditMessage
                  ? { onEdit: (nextBody: string) => onEditMessage(m.sid, nextBody) }
                  : {})}
                {...(canDelete && onRequestDelete
                  ? { onDelete: () => onRequestDelete(m.sid) }
                  : {})}
              />
            );
          })}
        </div>
      </div>
      {timestamp && (
        <span
          className={cn("font-mono text-[9.5px] text-walnut-3 mt-0.5", !group.mine && "ml-11")}
          title={fullTimestamp}
        >
          {timestamp}
        </span>
      )}
      {group.mine && readByOther && (
        <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brass-deep">
          Read
        </span>
      )}
    </div>
  );
}
