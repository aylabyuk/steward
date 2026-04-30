import type { MeetingType } from "@/lib/types";

export type KindVariant = "regular" | "fast" | "stake" | "general";

export interface KindInfo {
  variant: KindVariant;
  /** Badge text shown in the desktop card header (empty for regular — no badge). */
  badge: string;
  /** Compact badge text for narrow widths — keeps the date headline on
   *  one line on phone widths. Falls back to `badge` for regular. */
  compact: string;
  /** Body stamp label (e.g. TESTIMONY MEETING). Empty for regular. */
  stampLabel: string;
  /** Italic serif description under the stamp. Empty for regular. */
  description: string;
  /** True when the card has the special (fast/stake/general) layout. */
  isSpecial: boolean;
}

const KIND_MAP: Record<MeetingType, KindInfo> = {
  regular: {
    variant: "regular",
    badge: "",
    compact: "",
    stampLabel: "",
    description: "",
    isSpecial: false,
  },
  fast: {
    variant: "fast",
    badge: "Fast Sunday",
    compact: "Fast Sun.",
    stampLabel: "Testimony meeting",
    description: "No assigned speakers — member testimonies.",
    isSpecial: true,
  },
  stake: {
    variant: "stake",
    badge: "Stake Conference",
    compact: "Stake Conf.",
    stampLabel: "Stake-wide session",
    description: "No local program — stake-wide session.",
    isSpecial: true,
  },
  general: {
    variant: "general",
    badge: "General Conference",
    compact: "General Conf.",
    stampLabel: "General session",
    description: "No local program — general session.",
    isSpecial: true,
  },
};

export function kindLabel(type: MeetingType): KindInfo {
  return KIND_MAP[type];
}
