import { daysBetween } from "@/lib/dates";
import { formatLongDate } from "@/features/meetings/meetingLabels";
import type { Member, Speaker, Ward } from "@/lib/types";
import type { TemplateValues } from "./renderTemplate";

export interface TemplateContext {
  date: string;
  speaker: Speaker;
  ward: Ward | null;
  bishop: Member | null;
  senderName: string;
}

const DEFAULT_DURATION = "10–15";

export function buildTemplateValues({
  date,
  speaker,
  ward,
  bishop,
  senderName,
}: TemplateContext): TemplateValues {
  return {
    speakerName: speaker.name,
    date: formatLongDate(date),
    dayCount: Math.max(0, daysBetween(new Date(), date)),
    topic: speaker.topic ?? "",
    durationMinutes: DEFAULT_DURATION,
    wardName: ward?.name ?? "",
    bishopName: bishop?.displayName ?? "the bishopric",
    senderName,
  };
}
