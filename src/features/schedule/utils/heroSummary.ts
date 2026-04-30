import type { KindVariant } from "./kindLabel";

export interface HeroSummaryInput {
  /** Meeting kind variant — branches the rollup. */
  variant: KindVariant;
  /** Total speakers assigned to the meeting (regular Sundays). */
  speakerCount: number;
  /** Subset of `speakerCount` whose status is "confirmed". */
  speakerConfirmedCount: number;
  /** Number of prayer slots assigned (0..2) — inline or participant
   *  doc. Used by fast Sundays only. */
  prayerAssignedCount: number;
  /** Subset of assigned prayers with status "confirmed" (0..2). */
  prayerConfirmedCount: number;
}

/** Build the kind-aware "X of Y confirmed" rollup line shown beneath
 *  the date headline on the schedule's hero (first) card. Returns
 *  `null` for stake / general — the centered stamp on the body
 *  already says "no local program" so an extra line just repeats. */
export function computeHeroSummary(input: HeroSummaryInput): string | null {
  const {
    variant,
    speakerCount,
    speakerConfirmedCount,
    prayerAssignedCount,
    prayerConfirmedCount,
  } = input;
  if (variant === "stake" || variant === "general") return null;
  if (variant === "fast") {
    if (prayerAssignedCount === 0) return "No prayers assigned yet";
    if (prayerConfirmedCount === 2) return "Both prayers confirmed";
    return `${prayerConfirmedCount} of 2 prayers confirmed`;
  }
  if (speakerCount === 0) return "No speakers assigned yet";
  if (speakerConfirmedCount === speakerCount) return "All speakers confirmed";
  return `${speakerConfirmedCount} of ${speakerCount} speakers confirmed`;
}
