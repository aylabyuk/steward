import { cn } from "@/lib/cn";
import type { Reactions } from "./reactions";

interface Props {
  reactions: Reactions;
  selfIdentity: string | null;
  onToggle: (emoji: string) => void;
  mine: boolean;
}

/** Chip row of applied reactions under a bubble. Each chip shows
 *  the emoji + count; clicking toggles the caller's own identity in
 *  or out of the set. Chips the caller has reacted with get a
 *  filled background so they read as "selected". Renders nothing
 *  when there are no reactions. */
export function ReactionBar({
  reactions,
  selfIdentity,
  onToggle,
  mine,
}: Props): React.ReactElement | null {
  const entries = Object.entries(reactions).filter(([, ids]) => ids.length > 0);
  if (entries.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap gap-1 mt-0.5", mine ? "justify-end" : "justify-start")}>
      {entries.map(([emoji, ids]) => {
        const mineReacted = selfIdentity !== null && ids.includes(selfIdentity);
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onToggle(emoji)}
            aria-pressed={mineReacted}
            aria-label={`${emoji} ${ids.length}${mineReacted ? " (you reacted)" : ""}`}
            className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[11px] font-medium transition-colors",
              mineReacted
                ? "bg-brass-soft border-brass-soft text-brass-deep"
                : "bg-parchment-2 border-border text-walnut-2 hover:bg-chalk",
            )}
          >
            <span aria-hidden="true">{emoji}</span>
            <span className="font-mono text-[10px]">{ids.length}</span>
          </button>
        );
      })}
    </div>
  );
}
