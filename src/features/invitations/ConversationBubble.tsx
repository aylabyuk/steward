import { cn } from "@/lib/cn";
import type { ChatMessage } from "./useConversation";

export type BubblePosition = "single" | "first" | "middle" | "last";

/** Derives a group position from (index, total). Used by the thread
 *  to shape each bubble's border-radius so that consecutive bubbles
 *  in a group read as one connected shape on the avatar-facing
 *  side. */
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
}

/** A single Messenger-style speech bubble. Response-type messages
 *  carry a small "Response · Yes/No" eyebrow above the bubble body
 *  and a colored 2px border — they're single bubbles in practice,
 *  so grouping position is usually "single" for them anyway. */
export function ConversationBubble({ message, mine, position }: Props) {
  const responseType = message.attributes?.responseType as "yes" | "no" | undefined;
  const radius = mine ? MINE_RADIUS[position] : THEIRS_RADIUS[position];
  return (
    <div className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
      {responseType && (
        <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brass-deep mb-0.5">
          {responseType === "yes" ? "Response · Yes" : "Response · No"}
        </span>
      )}
      <div
        className={cn(
          "px-3.5 py-2 text-[14px] leading-snug whitespace-pre-wrap wrap-break-word shadow-[0_1px_0_rgba(35,24,21,0.04)]",
          radius,
          mine ? "bg-bordeaux text-parchment" : "bg-parchment-2 border border-border text-walnut",
          responseType === "yes" && "border-success border-2",
          responseType === "no" && "border-bordeaux border-2",
        )}
      >
        {message.body}
      </div>
    </div>
  );
}
