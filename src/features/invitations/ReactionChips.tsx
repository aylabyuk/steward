import { cn } from "@/lib/cn";
import type { ChatMessage } from "./hooks/useConversation";
import { isReactionsNonEmpty, orderedReactionEntries, reactionIncludes } from "./utils/reactions";

interface Props {
  message: ChatMessage;
  mine: boolean;
  currentIdentity?: string;
  onToggleReaction?: (emoji: string) => Promise<void> | void;
}

/** Reaction chip row that sits beneath a bubble — Messenger-style.
 *  Negative top margin overlaps the chips into the bottom of the
 *  bubble; chip background lifts off the bubble edge with a shadow.
 *  Returns null when there are no reactions to show, so the caller
 *  can render unconditionally. */
export function ReactionChips({ message, mine, currentIdentity, onToggleReaction }: Props) {
  if (!isReactionsNonEmpty(message.reactions)) return null;
  const reactAvailable = Boolean(currentIdentity && onToggleReaction);
  return (
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
  );
}
