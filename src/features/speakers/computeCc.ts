import type { WithId } from "@/hooks/_sub";
import type { Member } from "@/lib/types";

/**
 * Computes the CC list for a speaker-invitation `mailto:` flow per
 * docs/access.md:
 * - Any active member with `ccOnEmails: true` is CC'd, regardless of
 *   role (bishopric or clerk/secretary).
 * - Inactive members or members with `ccOnEmails: false` are
 *   excluded — bishopric can opt themselves out via Ward Settings →
 *   Members.
 */
export function computeCc(members: readonly WithId<Member>[]): string[] {
  return members
    .filter(({ data }) => data.active)
    .filter(({ data }) => data.ccOnEmails)
    .map(({ data }) => data.email);
}
