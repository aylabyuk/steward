import type { AuthorMap } from "./useConversation";

interface Props {
  typingIdentities: readonly string[];
  authors: AuthorMap;
}

/** One-line "X is typing…" row with an animated three-dot affordance.
 *  Renders nothing when no one is typing, so the caller doesn't need
 *  to gate on length. */
export function TypingIndicator({
  typingIdentities,
  authors,
}: Props): React.ReactElement | null {
  if (typingIdentities.length === 0) return null;
  const names = typingIdentities.map((id) => authors.get(id)?.displayName ?? "Someone");
  const label = formatTypingLabel(names);
  return (
    <div
      className="flex items-center gap-2 px-4 py-1.5 border-t border-border bg-parchment"
      aria-live="polite"
    >
      <span className="flex gap-1">
        <Dot delay={0} />
        <Dot delay={150} />
        <Dot delay={300} />
      </span>
      <span className="font-serif italic text-[12px] text-walnut-3">{label}</span>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      aria-hidden="true"
      className="w-1.5 h-1.5 rounded-full bg-walnut-3 animate-bounce"
      style={{ animationDelay: `${delay}ms`, animationDuration: "1s" }}
    />
  );
}

function formatTypingLabel(names: readonly string[]): string {
  if (names.length === 1) return `${names[0]} is typing…`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
  return `${names[0]} and ${names.length - 1} others are typing…`;
}
