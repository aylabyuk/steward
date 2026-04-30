import type { RefObject } from "react";
import { cn } from "@/lib/cn";
import { BubbleActions } from "./BubbleActions";
import { BubbleEditForm } from "./BubbleEditForm";
import type { BubblePosition } from "./ConversationBubble";
import type { ChatMessage } from "./hooks/useConversation";
import type { Reactions } from "./utils/reactions";

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
  responseType?: "yes" | "no";
  editing: boolean;
  draft: string;
  saving: boolean;
  pressing: boolean;
  menuOpen: boolean;
  actionsAvailable: boolean;
  editAvailable: boolean;
  deleteAvailable: boolean;
  reactAvailable: boolean;
  currentIdentity?: string;
  reactions: Reactions;
  bind: Record<string, unknown>;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  setDraft: (next: string) => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onMenuClose: () => void;
  onMenuEdit: () => void;
  onMenuDelete: () => void;
  onToggleReaction?: (emoji: string) => Promise<void> | void;
}

/** The bubble's primary surface — text or edit form — plus the
 *  long-press action menu. Extracted from `ConversationBubble` so
 *  that component stays under the 150-line per-function cap. */
export function BubbleSurface(props: Props) {
  const radius = props.mine ? MINE_RADIUS[props.position] : THEIRS_RADIUS[props.position];
  return (
    <div className="relative">
      {props.editing ? (
        <BubbleEditForm
          draft={props.draft}
          setDraft={props.setDraft}
          onCancel={props.onCancelEdit}
          onSave={props.onSave}
          saving={props.saving}
          mine={props.mine}
          textareaRef={props.textareaRef}
        />
      ) : (
        <div
          {...(props.actionsAvailable ? props.bind : {})}
          className={cn(
            "px-3.5 py-2 text-[14px] leading-snug whitespace-pre-wrap wrap-break-word shadow-[0_1px_0_rgba(35,24,21,0.04)] min-w-0",
            radius,
            props.mine
              ? "bg-bordeaux text-parchment"
              : "bg-parchment-2 border border-border text-walnut",
            props.responseType === "yes" && "border-success border-2",
            props.responseType === "no" && "border-bordeaux border-2",
            props.actionsAvailable &&
              "select-none transition-[transform,box-shadow] duration-500 ease-out touch-manipulation",
            props.pressing && "scale-[0.97] shadow-[0_0_0_3px_rgba(193,140,35,0.55)]",
          )}
        >
          {props.message.body}
        </div>
      )}
      <BubbleActions
        open={props.menuOpen}
        mine={props.mine}
        canEdit={props.editAvailable}
        canDelete={props.deleteAvailable}
        {...(props.reactAvailable && props.currentIdentity && props.onToggleReaction
          ? {
              reactionPalette: {
                identity: props.currentIdentity,
                reactions: props.reactions,
                onToggle: (emoji: string) => {
                  if (props.onToggleReaction) void props.onToggleReaction(emoji);
                },
              },
            }
          : {})}
        onClose={props.onMenuClose}
        onEdit={props.onMenuEdit}
        onDelete={props.onMenuDelete}
      />
    </div>
  );
}
