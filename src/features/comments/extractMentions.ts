import type { WithId } from "@/hooks/_sub";
import type { Member } from "@/lib/types";

function escapeRegex(s: string): string {
  return s.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

/**
 * Scans a comment body for `@Display Name` substrings that match any active
 * ward member's displayName (case-insensitive, whole-name match). Returns the
 * set of matched uids. Unknown `@name` strings pass through as literal text
 * (not added to the list). Ambiguous names resolve to all matching uids --
 * callers can disambiguate via displayed email at insert time.
 */
export function extractMentions(body: string, members: readonly WithId<Member>[]): string[] {
  const uids = new Set<string>();
  for (const m of members) {
    if (!m.data.active) continue;
    const name = m.data.displayName.trim();
    if (!name) continue;
    // Match "@Name" where Name is bounded on the right by whitespace,
    // punctuation, or end-of-string.
    const pattern = new RegExp(`@${escapeRegex(name)}(?=[\\s.,!?;:]|$)`, "iu");
    if (pattern.test(body)) uids.add(m.id);
  }
  return [...uids];
}
