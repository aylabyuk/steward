import type { WithId } from "@/hooks/_sub";
import type { MidItem as MidItemType, SacramentMeeting, Speaker } from "@/lib/types";

export interface OrderedSpeaker {
  id: string;
  name: string;
  topic: string | null;
}

export function orderedSpeakers(speakers: readonly WithId<Speaker>[]): OrderedSpeaker[] {
  return [...speakers]
    .sort((a, b) => {
      const oa = a.data.order ?? Number.MAX_SAFE_INTEGER;
      const ob = b.data.order ?? Number.MAX_SAFE_INTEGER;
      if (oa !== ob) return oa - ob;
      return a.id.localeCompare(b.id);
    })
    .map((s) => ({ id: s.id, name: s.data.name, topic: s.data.topic?.trim() || null }));
}

export function midLabel(mid: MidItemType | undefined): string | null {
  if (!mid || mid.mode === "none") return null;
  if (mid.mode === "rest") {
    return mid.rest ? `Rest hymn · #${mid.rest.number} — ${mid.rest.title}` : null;
  }
  return mid.musical?.performer ? `Musical number · ${mid.musical.performer}` : null;
}

export function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function personName(a: SacramentMeeting["presiding"]): string {
  return a?.person?.name ?? "";
}

/**
 * Splits speakers + mid into a printable sequence that matches the
 * "between sacrament and speakers" semantics used by the Program UI:
 *
 *   [speaker 0, speaker 1, ..., MID, speaker midAfter, ...]
 *
 * Returns a flat array of entries; the caller renders them in order.
 */
export type SequenceEntry =
  | { kind: "speaker"; index: number; data: OrderedSpeaker }
  | { kind: "mid"; label: string };

export function speakerSequence(
  speakers: readonly OrderedSpeaker[],
  mid: MidItemType | undefined,
): SequenceEntry[] {
  const label = midLabel(mid);
  const showMid = Boolean(mid && mid.mode !== "none" && label);
  const midAfter = Math.min(Math.max(mid?.midAfter ?? 1, 0), speakers.length);
  const out: SequenceEntry[] = [];
  speakers.forEach((s, i) => {
    if (showMid && i === midAfter) out.push({ kind: "mid", label: label! });
    out.push({ kind: "speaker", index: i, data: s });
  });
  if (showMid && midAfter >= speakers.length) out.push({ kind: "mid", label: label! });
  return out;
}
