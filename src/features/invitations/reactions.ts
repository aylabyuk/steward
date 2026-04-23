export const REACTION_EMOJI = ["👍", "❤️", "🙏", "😂", "😮"] as const;

export type Reactions = Record<string, readonly string[]>;

/** Extracts the reactions map from a Twilio message's attributes.
 *  Defensive against old messages that predate this feature and
 *  non-record attributes. Always returns a plain object. */
export function readReactions(attrs: Record<string, unknown> | null): Reactions {
  const raw = attrs?.reactions;
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, readonly string[]> = {};
  for (const [emoji, ids] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(ids)) out[emoji] = ids.filter((v): v is string => typeof v === "string");
  }
  return out;
}

/** Toggles the caller's identity on a given emoji. Removes the
 *  emoji entry entirely when it ends up empty so the attribute
 *  doesn't accumulate dead keys. */
export function toggleReaction(
  current: Reactions,
  emoji: string,
  identity: string,
): Reactions {
  const existing = current[emoji] ?? [];
  const hasMe = existing.includes(identity);
  const nextList = hasMe ? existing.filter((id) => id !== identity) : [...existing, identity];
  const next = { ...current };
  if (nextList.length === 0) delete next[emoji];
  else next[emoji] = nextList;
  return next;
}
