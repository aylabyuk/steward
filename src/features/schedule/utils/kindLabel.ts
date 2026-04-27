import type { MeetingType } from "@/lib/types";

export type KindVariant = "regular" | "fast" | "stake" | "general";

export interface KindInfo {
  variant: KindVariant;
  /** Badge text shown in the card header (empty for regular — no badge). */
  badge: string;
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
    stampLabel: "",
    description: "",
    isSpecial: false,
  },
  fast: {
    variant: "fast",
    badge: "Fast Sunday",
    stampLabel: "Testimony meeting",
    description: "No assigned speakers — member testimonies.",
    isSpecial: true,
  },
  stake: {
    variant: "stake",
    badge: "Stake Conference",
    stampLabel: "Stake-wide session",
    description: "No local program — stake-wide session.",
    isSpecial: true,
  },
  general: {
    variant: "general",
    badge: "General Conference",
    stampLabel: "General session",
    description: "No local program — general session.",
    isSpecial: true,
  },
};

export function kindLabel(type: MeetingType): KindInfo {
  return KIND_MAP[type];
}
