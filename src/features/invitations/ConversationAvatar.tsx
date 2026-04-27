import { cn } from "@/lib/cn";
import type { AuthorInfo } from "./hooks/useConversation";

/** Circle avatar for a conversation participant. Renders the
 *  participant's Google profile photo when present (photoURL),
 *  otherwise a colored initials bubble where the color keys off
 *  role. Two-letter initials: first + last word of displayName. */
export function ConversationAvatar({ author }: { author: AuthorInfo }) {
  const colorClass =
    author.role === "speaker"
      ? "bg-brass-soft border-brass-soft text-brass-deep"
      : author.role === "clerk"
        ? "bg-parchment-2 border-border-strong text-walnut-2"
        : "bg-bordeaux border-bordeaux-deep text-parchment";
  if (author.photoURL) {
    return (
      <img
        src={author.photoURL}
        alt=""
        aria-hidden="true"
        className="shrink-0 w-9 h-9 rounded-full object-cover border border-border"
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={cn(
        "shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-display text-[11px] font-semibold border",
        colorClass,
      )}
    >
      {initialsOf(author.displayName)}
    </div>
  );
}

function initialsOf(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0]!.slice(0, 2) || "?").toUpperCase();
  return `${parts[0]!.charAt(0)}${parts.at(-1)!.charAt(0)}`.toUpperCase();
}
