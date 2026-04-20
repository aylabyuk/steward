import type { MeetingType } from "@/lib/types";

export const TYPE_LABELS: Record<MeetingType, string> = {
  regular: "Regular",
  fast: "Fast Sunday",
  stake: "Stake Conference",
  general: "General Conference",
};

export const NO_MEETING_TYPES: ReadonlySet<MeetingType> = new Set(["stake", "general"]);

export const HIDE_SPEAKER_TYPES: ReadonlySet<MeetingType> = new Set(["fast", "stake", "general"]);

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
