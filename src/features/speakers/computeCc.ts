import type { WithId } from "@/hooks/_sub";
import type { Member } from "@/lib/types";

/**
 * Computes the CC list for a speaker-invitation mailto per docs/access.md:
 * - Bishopric members are ALWAYS CCed (non-togglable).
 * - Clerks/secretaries are CCed when their ccOnEmails flag is true.
 * - Inactive members are excluded regardless of role/flag.
 */
export function computeCc(members: readonly WithId<Member>[]): string[] {
  return members
    .filter(({ data }) => data.active)
    .filter(({ data }) => data.role === "bishopric" || data.ccOnEmails)
    .map(({ data }) => data.email);
}
