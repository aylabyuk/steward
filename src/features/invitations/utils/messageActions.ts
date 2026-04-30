import type { ChatMessage } from "../hooks/useConversation";

/** Index of the viewer's latest sent message, or null if they haven't
 *  spoken yet. Used by the thread to anchor the "Read" receipt under
 *  the last mine=true bubble. */
export function findLastMineIndex(
  messages: readonly ChatMessage[],
  currentIdentity: string | null,
): number | null {
  if (!currentIdentity) return null;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]!.author === currentIdentity) return messages[i]!.index;
  }
  return null;
}

/** Size of the "recent" window that gates delete + edit affordances.
 *  Delete uses last-N of the whole thread; edit uses last-N of the
 *  current user's own messages. */
export const RECENT_EDITABLE_WINDOW = 5;

/** After this many milliseconds from creation, edit + delete become
 *  unavailable on a message. Long enough to cover "noticed the
 *  mistake later in the day"; the recent-N cap above is the
 *  structural guard that prevents deep-history rewriting even within
 *  the window. iOS mirrors this constant — keep them in sync. */
export const EDIT_DELETE_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface Permissions {
  canDelete: (message: ChatMessage) => boolean;
  canEdit: (message: ChatMessage) => boolean;
}

/** Build delete/edit permission predicates for the current viewer.
 *
 *  Delete:
 *   - Speaker identity may delete their own messages.
 *   - Bishopric identity (uid:<...>) may delete any bishopric message
 *     — their own + other bishopric members'. Never cross-side.
 *   - Only within the last `RECENT_EDITABLE_WINDOW` messages in the
 *     thread (any author). Keeps the history immutable past the
 *     recency window so accidentally-deep deletes don't rewrite
 *     older context.
 *   - Structured quick-action responses (`responseType`) and
 *     status-change system notices (`kind: "status-change"`) are
 *     never deletable — the yes/no flow + status audit depend on
 *     them staying on the record.
 *
 *  Edit:
 *   - Own messages only.
 *   - Within the author's last `RECENT_EDITABLE_WINDOW` sent
 *     messages (not the thread's last N).
 *   - Same structural exclusions as delete.
 *
 *  Both predicates additionally require the message to be within
 *  `EDIT_DELETE_WINDOW_MS` of `dateCreated` — older messages return
 *  false even if they're in-window by count, so the affordance
 *  disappears once the message has settled.
 */
export function buildMessagePermissions(
  currentIdentity: string | null,
  messages: readonly ChatMessage[],
  nowMs: number = Date.now(),
): Permissions {
  if (!currentIdentity) {
    return { canDelete: () => false, canEdit: () => false };
  }

  const deletableSids = new Set<string>();
  for (const m of messages.slice(-RECENT_EDITABLE_WINDOW)) {
    if (!isStructural(m)) deletableSids.add(m.sid);
  }

  const mineRecent: string[] = [];
  for (let i = messages.length - 1; i >= 0 && mineRecent.length < RECENT_EDITABLE_WINDOW; i--) {
    const m = messages[i]!;
    if (m.author !== currentIdentity) continue;
    if (isStructural(m)) continue;
    mineRecent.push(m.sid);
  }
  const editableSids = new Set(mineRecent);

  const sameSide = (author: string): boolean => {
    if (currentIdentity.startsWith("uid:")) return author.startsWith("uid:");
    return author === currentIdentity;
  };

  const isWithinWindow = (m: ChatMessage): boolean => {
    if (!m.dateCreated) return false;
    return nowMs - m.dateCreated.getTime() <= EDIT_DELETE_WINDOW_MS;
  };

  return {
    canDelete(m: ChatMessage): boolean {
      if (!deletableSids.has(m.sid)) return false;
      if (!isWithinWindow(m)) return false;
      return sameSide(m.author);
    },
    canEdit(m: ChatMessage): boolean {
      if (!editableSids.has(m.sid)) return false;
      if (!isWithinWindow(m)) return false;
      return m.author === currentIdentity;
    },
  };
}

function isStructural(m: ChatMessage): boolean {
  if (!m.attributes) return false;
  if (m.attributes.kind === "status-change") return true;
  if (m.attributes.kind === "invitation") return true;
  if (m.attributes.kind === "message-deleted") return true;
  if (m.attributes.responseType === "yes" || m.attributes.responseType === "no") return true;
  return false;
}
