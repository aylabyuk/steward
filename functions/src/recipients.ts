import { isInQuietHours } from "./quietHours.js";
import type { MemberDoc } from "./types.js";

export interface RecipientCandidate {
  uid: string;
  member: MemberDoc;
}

export interface FilterContext {
  now: Date;
  timezone: string;
  /** Author of the originating event; never notify them about it. */
  excludeUid?: string | undefined;
}

export function filterRecipients(
  candidates: readonly RecipientCandidate[],
  ctx: FilterContext,
): RecipientCandidate[] {
  return candidates.filter((c) => {
    if (ctx.excludeUid && c.uid === ctx.excludeUid) return false;
    if (!c.member.active) return false;
    const prefs = c.member.notificationPrefs;
    if (prefs?.enabled === false) return false;
    if (prefs?.quietHours && isInQuietHours(ctx.now, prefs.quietHours, ctx.timezone)) return false;
    if (!c.member.fcmTokens || c.member.fcmTokens.length === 0) return false;
    return true;
  });
}
