import { daysBetween } from "@/lib/dates";

export type LeadTimeSeverity = "none" | "warn" | "urgent";

const URGENT_THRESHOLD_DAYS = 7;

export function leadTimeSeverity(
  from: Date,
  meetingDate: string,
  leadTimeDays: number,
): LeadTimeSeverity {
  const days = daysBetween(from, meetingDate);
  if (days < URGENT_THRESHOLD_DAYS) return "urgent";
  if (days < leadTimeDays) return "warn";
  return "none";
}
