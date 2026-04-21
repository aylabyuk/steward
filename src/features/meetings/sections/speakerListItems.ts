import type { WithId } from "@/hooks/_sub";
import type { MidItem as MidItemType, Speaker } from "@/lib/types";

export type Item =
  | { kind: "speaker"; id: string; speaker: WithId<Speaker> }
  | { kind: "mid"; id: "__mid__"; label: string };

export function sortByOrder(speakers: readonly WithId<Speaker>[]): WithId<Speaker>[] {
  return [...speakers].sort((a, b) => {
    const oa = a.data.order ?? Number.MAX_SAFE_INTEGER;
    const ob = b.data.order ?? Number.MAX_SAFE_INTEGER;
    if (oa !== ob) return oa - ob;
    return a.id.localeCompare(b.id);
  });
}

export function formatMidLabel(mid: MidItemType | undefined): string {
  if (!mid || mid.mode === "none") return "";
  if (mid.mode === "rest") {
    return mid.rest ? `Rest hymn · ${mid.rest.number} — ${mid.rest.title}` : "Rest hymn — pick a hymn";
  }
  return mid.musical?.performer
    ? `Musical number · ${mid.musical.performer}`
    : "Musical number — add performer";
}

export function buildItems(
  ordered: WithId<Speaker>[],
  mid: MidItemType | undefined,
  midLabel: string,
): Item[] {
  const showMid = Boolean(mid && mid.mode !== "none" && midLabel);
  const clampedAfter = Math.min(Math.max(mid?.midAfter ?? 1, 0), ordered.length);
  const items: Item[] = [];
  ordered.forEach((s, i) => {
    if (showMid && i === clampedAfter) items.push({ kind: "mid", id: "__mid__", label: midLabel });
    items.push({ kind: "speaker", id: s.id, speaker: s });
  });
  if (showMid && clampedAfter >= ordered.length) {
    items.push({ kind: "mid", id: "__mid__", label: midLabel });
  }
  return items;
}
