import type { MeetingType } from "@/lib/types";

export type KindVariant = "regular" | "fast" | "special" | "noMeeting";

export interface KindInfo {
  label: string;
  variant: KindVariant;
}

const KIND_MAP: Record<MeetingType, KindInfo> = {
  regular: { label: "Regular", variant: "regular" },
  fast: { label: "Fast Sunday", variant: "fast" },
  stake: { label: "Stake", variant: "noMeeting" },
  general: { label: "General", variant: "noMeeting" },
};

export function kindLabel(type: MeetingType): KindInfo {
  return KIND_MAP[type];
}
