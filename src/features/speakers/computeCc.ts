import type { WithId } from "@/hooks/_sub";
import type { Member } from "@/lib/types";

/**
 * Computes the CC list for a speaker-invitation `mailto:` flow per
 * docs/access.md:
 * - Bishopric (bishop + counselors) is ALWAYS CC'd, non-togglable.
 *   Bishopric visibility on invitation traffic is load-bearing.
 * - Clerks and secretaries (`role: "clerk"`) are CC'd when their
 *   `ccOnEmails` flag is true (default).
 * - Inactive members are excluded regardless of role/flag.
 */
export function computeCc(members: readonly WithId<Member>[]): string[] {
  return members
    .filter(({ data }) => data.active)
    .filter(({ data }) => data.role === "bishopric" || data.ccOnEmails)
    .map(({ data }) => data.email);
}
