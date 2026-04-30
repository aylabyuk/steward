/** Bubble-reaction overlay persisted on Twilio message attributes.
 *  Mirrors the iOS port's `Reactions` type in
 *  `LocalPackages/StewardCore/Sources/StewardCore/Conversations/Reactions.swift`.
 *
 *  Storage shape on Twilio: `{ "reactions": { "👍": ["uid:a", …], … } }`.
 *  Lives parallel to any other attribute kind (`status-change`,
 *  `invitation`, `responseType`, `message-deleted`) — reactions are
 *  metadata on a message, not a discriminator. A message that has
 *  reactions is still its original kind and still subject to the
 *  usual edit/delete rules.
 *
 *  Toggle is idempotent (re-toggling removes); buckets that empty
 *  out are dropped from the map so a no-reaction bubble round-trips
 *  with no `reactions` payload at all.
 */

export type Reactions = Readonly<Record<string, readonly string[]>>;

export const EMPTY_REACTIONS: Reactions = Object.freeze({});

/** Fixed 6-emoji palette. Single source of truth for the
 *  cross-platform set — neither client should hard-code its own. */
export const REACTION_PALETTE: readonly string[] = ["👍", "❤️", "🙏", "✅", "😊", "😮"];

export function isReactionsNonEmpty(r: Reactions): boolean {
  return Object.keys(r).length > 0;
}

export function reactionCount(r: Reactions, emoji: string): number {
  return r[emoji]?.length ?? 0;
}

export function reactionIncludes(r: Reactions, emoji: string, identity: string): boolean {
  return r[emoji]?.includes(identity) ?? false;
}

/** Toggle the (emoji, identity) pair: add if absent, remove if
 *  present. Empty buckets collapse out. */
export function toggleReaction(r: Reactions, emoji: string, identity: string): Reactions {
  const bucket = r[emoji] ?? [];
  const present = bucket.includes(identity);
  const nextBucket = present ? bucket.filter((id) => id !== identity) : [...bucket, identity];
  const next = { ...r };
  if (nextBucket.length === 0) {
    delete next[emoji];
  } else {
    next[emoji] = nextBucket;
  }
  return next;
}

/** Stable order for chip rendering: palette order first, then any
 *  unknown emojis (alphabetical) the other platform might have
 *  added. Matches `Reactions.orderedEntries` on iOS. */
export function orderedReactionEntries(
  r: Reactions,
): readonly { emoji: string; identities: readonly string[] }[] {
  const known = REACTION_PALETTE.flatMap((emoji) => {
    const identities = r[emoji];
    return identities && identities.length > 0 ? [{ emoji, identities }] : [];
  });
  const unknown = Object.keys(r)
    .filter((e) => !REACTION_PALETTE.includes(e))
    .toSorted()
    .flatMap((emoji) => {
      const identities = r[emoji];
      return identities && identities.length > 0 ? [{ emoji, identities }] : [];
    });
  return [...known, ...unknown];
}

/** Pull reactions out of the raw Twilio attributes blob. Returns
 *  `EMPTY_REACTIONS` for missing / malformed payloads — reactions
 *  are best-effort overlay data; a malformed payload should never
 *  blow up the bubble. */
export function parseReactions(raw: Record<string, unknown> | null | undefined): Reactions {
  if (!raw) return EMPTY_REACTIONS;
  const payload = raw["reactions"];
  if (!payload || typeof payload !== "object") return EMPTY_REACTIONS;
  const result: Record<string, readonly string[]> = {};
  for (const [emoji, value] of Object.entries(payload as Record<string, unknown>)) {
    if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
      // Dedupe inside each bucket — round-trip safety against
      // accidentally-duplicated identities.
      const deduped: string[] = [];
      const seen = new Set<string>();
      for (const id of value as string[]) {
        if (seen.has(id)) continue;
        seen.add(id);
        deduped.push(id);
      }
      if (deduped.length > 0) result[emoji] = deduped;
    }
  }
  return result;
}

/** Write the reactions overlay back into a copy of the attributes
 *  blob. Preserves any other keys (kind, responseType, …) and
 *  removes the `reactions` key entirely when there's nothing left
 *  to write. */
export function mergeReactionsIntoAttributes(
  reactions: Reactions,
  attrs: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...attrs };
  if (isReactionsNonEmpty(reactions)) {
    next["reactions"] = reactions;
  } else {
    delete next["reactions"];
  }
  return next;
}
