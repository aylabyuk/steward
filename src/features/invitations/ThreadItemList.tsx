import { ConversationGroup } from "./ConversationGroup";
import { SystemNotice } from "./SystemNotice";
import { DayDivider, UnreadDivider } from "./ThreadDividers";
import type { Permissions } from "./utils/messageActions";
import type { ThreadItem } from "./utils/threadItems";

interface Props {
  items: readonly ThreadItem[];
  permissions: Permissions;
  currentIdentity: string | null;
  readByOtherAt: number | null;
  onEditMessage?: (sid: string, nextBody: string) => Promise<void> | void;
  onRequestDelete?: (sid: string) => void;
  onToggleReaction?: (sid: string, emoji: string) => Promise<void> | void;
}

/** Renders the flattened list of thread items (day dividers, unread
 *  divider, system notices, message groups). Pulled out of
 *  `ConversationThread` to keep that file under the 150-line cap. */
export function ThreadItemList({
  items,
  permissions,
  currentIdentity,
  readByOtherAt,
  onEditMessage,
  onRequestDelete,
  onToggleReaction,
}: Props) {
  return items.map((item) => {
    if (item.kind === "day") return <DayDivider key={item.key} label={item.label} />;
    if (item.kind === "unread") return <UnreadDivider key={item.key} />;
    if (item.kind === "system")
      return <SystemNotice key={item.key} body={item.body} tone={item.tone} />;
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
        {...(currentIdentity ? { currentIdentity } : {})}
        {...(onEditMessage ? { onEditMessage } : {})}
        {...(onRequestDelete ? { onRequestDelete } : {})}
        {...(onToggleReaction ? { onToggleReaction } : {})}
      />
    );
  });
}
