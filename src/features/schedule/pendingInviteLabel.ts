import type { WithId } from "@/hooks/_sub";
import type { Speaker } from "@/lib/types";

/** Produces the "X of N speakers haven't been invited yet"-style
 *  caption that sits beside the date on the Assign Speakers modal.
 *  Returns null when there's nothing useful to say (no speakers on
 *  the slot yet) — the header just shows the date in that case.
 *
 *  "Pending" = `status === "planned"` (or missing status, which we
 *  treat as planned). Anything past that — invited / confirmed /
 *  declined — counts as already actioned for this caption. */
export function pendingInviteLabel(speakers: readonly WithId<Speaker>[]): string | null {
  const total = speakers.length;
  if (total === 0) return null;
  const pending = speakers.filter((s) => (s.data.status ?? "planned") === "planned").length;

  if (pending === 0) {
    return total === 1 ? "Speaker invited" : `All ${total} speakers invited`;
  }
  if (pending === total) {
    return total === 1
      ? "1 speaker has not been invited yet"
      : `${total} speakers have not been invited yet`;
  }
  return pending === 1
    ? `1 of ${total} speakers has not been invited yet`
    : `${pending} of ${total} speakers have not been invited yet`;
}
