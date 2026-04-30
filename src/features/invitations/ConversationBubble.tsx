import { useEffect, useRef, useState } from "react";
import { useLongPress } from "./hooks/useLongPress";
import { cn } from "@/lib/cn";
import { BubbleSurface } from "./BubbleSurface";
import type { ChatMessage } from "./hooks/useConversation";
import { ReactionChips } from "./ReactionChips";

export type BubblePosition = "single" | "first" | "middle" | "last";

export function bubblePositionOf(index: number, total: number): BubblePosition {
  if (total === 1) return "single";
  if (index === 0) return "first";
  if (index === total - 1) return "last";
  return "middle";
}

interface Props {
  message: ChatMessage;
  mine: boolean;
  position: BubblePosition;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (nextBody: string) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  /** Current viewer's Twilio identity. Drives the React menu's
   *  "your reactions are checked" state and the chip highlight on
   *  emojis you've already reacted with. Reactions are available to
   *  any signed-in identity, no edit-window gate. */
  currentIdentity?: string;
  /** Toggle a reaction on this bubble. The parent does the Twilio
   *  read-merge-write via `toggleMessageReaction`. */
  onToggleReaction?: (emoji: string) => Promise<void> | void;
}

/** A single Messenger-style speech bubble. Long-press the bubble to
 *  reveal an edit/delete menu when the viewer has permission; the
 *  press itself shows a brass-coloured halo + slight scale-down so
 *  the gesture is discoverable. */
export function ConversationBubble({
  message,
  mine,
  position,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  currentIdentity,
  onToggleReaction,
}: Props): React.ReactElement {
  const responseType = message.attributes?.responseType as "yes" | "no" | undefined;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const editAvailable = Boolean(canEdit && onEdit);
  const deleteAvailable = Boolean(canDelete && onDelete);
  const reactAvailable = Boolean(currentIdentity && onToggleReaction);
  const actionsAvailable = editAvailable || deleteAvailable || reactAvailable;

  const { pressing, bind } = useLongPress({
    enabled: actionsAvailable && !editing,
    onLongPress: () => setMenuOpen(true),
  });

  useEffect(() => {
    if (!editing) return;
    setDraft(message.body);
    const el = textareaRef.current;
    if (el) {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [editing, message.body]);

  async function save() {
    if (!onEdit) return;
    const next = draft.trim();
    if (!next || next === message.body) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onEdit(next);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
      {responseType && (
        <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brass-deep mb-0.5">
          {responseType === "yes" ? "Response · Yes" : "Response · No"}
        </span>
      )}
      <BubbleSurface
        message={message}
        mine={mine}
        position={position}
        {...(responseType ? { responseType } : {})}
        editing={editing}
        draft={draft}
        saving={saving}
        pressing={pressing}
        menuOpen={menuOpen}
        actionsAvailable={actionsAvailable}
        editAvailable={editAvailable}
        deleteAvailable={deleteAvailable}
        reactAvailable={reactAvailable}
        {...(currentIdentity ? { currentIdentity } : {})}
        reactions={message.reactions}
        bind={bind}
        textareaRef={textareaRef}
        setDraft={setDraft}
        onCancelEdit={() => setEditing(false)}
        onSave={save}
        onMenuClose={() => setMenuOpen(false)}
        onMenuEdit={() => setEditing(true)}
        onMenuDelete={() => {
          if (onDelete) void onDelete();
        }}
        {...(onToggleReaction ? { onToggleReaction } : {})}
      />
      <ReactionChips
        message={message}
        mine={mine}
        {...(currentIdentity ? { currentIdentity } : {})}
        {...(onToggleReaction ? { onToggleReaction } : {})}
      />
      {message.dateUpdated &&
        message.dateCreated &&
        message.dateUpdated.getTime() > message.dateCreated.getTime() && (
          <span
            className={cn(
              "font-mono text-[9px] uppercase tracking-[0.14em] text-walnut-3 mt-0.5",
              mine ? "pr-1" : "pl-1",
            )}
          >
            Edited
          </span>
        )}
    </div>
  );
}
