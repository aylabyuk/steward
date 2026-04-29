import { useEffect, useRef, useState } from "react";
import { useLongPress } from "./hooks/useLongPress";
import { cn } from "@/lib/cn";
import { BubbleActions } from "./BubbleActions";
import { BubbleEditForm } from "./BubbleEditForm";
import type { ChatMessage } from "./hooks/useConversation";
import {
  isReactionsNonEmpty,
  orderedReactionEntries,
  reactionIncludes,
} from "./utils/reactions";

export type BubblePosition = "single" | "first" | "middle" | "last";

export function bubblePositionOf(index: number, total: number): BubblePosition {
  if (total === 1) return "single";
  if (index === 0) return "first";
  if (index === total - 1) return "last";
  return "middle";
}

const THEIRS_RADIUS: Record<BubblePosition, string> = {
  single: "rounded-[18px]",
  first: "rounded-[18px] rounded-bl-[4px]",
  middle: "rounded-r-[18px] rounded-l-[4px]",
  last: "rounded-[18px] rounded-tl-[4px]",
};

const MINE_RADIUS: Record<BubblePosition, string> = {
  single: "rounded-[18px]",
  first: "rounded-[18px] rounded-br-[4px]",
  middle: "rounded-l-[18px] rounded-r-[4px]",
  last: "rounded-[18px] rounded-tr-[4px]",
};

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
  const radius = mine ? MINE_RADIUS[position] : THEIRS_RADIUS[position];
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
      <div className="relative">
        {editing ? (
          <BubbleEditForm
            draft={draft}
            setDraft={setDraft}
            onCancel={() => setEditing(false)}
            onSave={save}
            saving={saving}
            mine={mine}
            textareaRef={textareaRef}
          />
        ) : (
          <div
            {...(actionsAvailable ? bind : {})}
            className={cn(
              "px-3.5 py-2 text-[14px] leading-snug whitespace-pre-wrap wrap-break-word shadow-[0_1px_0_rgba(35,24,21,0.04)] min-w-0",
              radius,
              mine
                ? "bg-bordeaux text-parchment"
                : "bg-parchment-2 border border-border text-walnut",
              responseType === "yes" && "border-success border-2",
              responseType === "no" && "border-bordeaux border-2",
              actionsAvailable &&
                "select-none transition-[transform,box-shadow] duration-500 ease-out touch-manipulation",
              pressing && "scale-[0.97] shadow-[0_0_0_3px_rgba(193,140,35,0.55)]",
            )}
          >
            {message.body}
          </div>
        )}
        <BubbleActions
          open={menuOpen}
          mine={mine}
          canEdit={editAvailable}
          canDelete={deleteAvailable}
          {...(reactAvailable && currentIdentity
            ? {
                reactionPalette: {
                  identity: currentIdentity,
                  reactions: message.reactions,
                  onToggle: (emoji: string) => {
                    if (onToggleReaction) void onToggleReaction(emoji);
                  },
                },
              }
            : {})}
          onClose={() => setMenuOpen(false)}
          onEdit={() => setEditing(true)}
          onDelete={() => {
            if (onDelete) void onDelete();
          }}
        />
      </div>
      {isReactionsNonEmpty(message.reactions) && (
        // Negative top margin overlaps the chips into the bottom of
        // the bubble — Messenger-style. `relative z-10` ensures the
        // chip layer paints over the bubble's own corner. Inline
        // padding nudges the row away from the bubble's outer edge
        // so it sits ~half-inside, half-outside the corner.
        <div
          className={cn(
            "flex flex-wrap gap-1 -mt-2.5 relative z-10",
            mine ? "justify-end pr-3" : "justify-start pl-3",
          )}
          role="list"
        >
          {orderedReactionEntries(message.reactions).map((entry) => {
            const mineReaction = currentIdentity
              ? reactionIncludes(message.reactions, entry.emoji, currentIdentity)
              : false;
            const count = entry.identities.length;
            return (
              <button
                key={entry.emoji}
                type="button"
                role="listitem"
                onClick={() => {
                  if (onToggleReaction && currentIdentity) void onToggleReaction(entry.emoji);
                }}
                disabled={!reactAvailable}
                aria-pressed={mineReaction}
                aria-label={`${entry.emoji} ${count === 1 ? "1 reaction" : `${count} reactions`}${
                  mineReaction ? "; tap to remove yours" : "; tap to react"
                }`}
                className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full",
                  "font-mono text-[10.5px] leading-none transition-colors",
                  // bg-chalk reads cleanly on either bubble fill
                  // (bordeaux for mine / parchment-2 for theirs);
                  // shadow lifts the chip off the bubble edge.
                  "bg-chalk shadow-[0_1px_3px_rgba(35,24,21,0.12)]",
                  mineReaction
                    ? "border border-bordeaux/50 text-bordeaux"
                    : "border border-border text-walnut-2 hover:bg-parchment-2",
                  !reactAvailable && "cursor-default opacity-90",
                )}
              >
                <span className="text-[12px] leading-none">{entry.emoji}</span>
                {count > 1 && <span>{count}</span>}
              </button>
            );
          })}
        </div>
      )}
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
