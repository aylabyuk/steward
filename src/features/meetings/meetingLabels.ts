import type { MeetingType } from "@/lib/types";

export const TYPE_LABELS: Record<MeetingType, string> = {
  regular: "Regular sacrament meeting",
  fast_sunday: "Fast & Testimony meeting",
  ward_conference: "Ward conference",
  stake_conference: "Stake conference",
  general_conference: "General conference",
  other: "Other",
};

export const NO_MEETING_TYPES: ReadonlySet<MeetingType> = new Set([
  "stake_conference",
  "general_conference",
]);

export const HIDE_SPEAKER_TYPES: ReadonlySet<MeetingType> = new Set([
  "fast_sunday",
  "stake_conference",
  "general_conference",
]);

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
