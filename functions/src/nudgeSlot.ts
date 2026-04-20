import { localHour } from "./quietHours.js";

export type NudgeDay = "wednesday" | "friday" | "saturday";

export interface NudgeSlot {
  day: NudgeDay;
  hour: number;
}

export interface NudgeSchedule {
  wednesday: { enabled: boolean; hour: number };
  friday: { enabled: boolean; hour: number };
  saturday: { enabled: boolean; hour: number };
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};
const NUDGE_DAY_BY_INDEX: Record<number, NudgeDay | undefined> = {
  3: "wednesday",
  5: "friday",
  6: "saturday",
};

function localDayOfWeek(now: Date, timezone: string): number {
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short" });
  const parts = fmt.formatToParts(now);
  const w = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  return WEEKDAY_INDEX[w] ?? 0;
}

function localYmd(now: Date, timezone: string): { y: number; m: number; d: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? "0");
  return { y: get("year"), m: get("month"), d: get("day") };
}

/**
 * Returns the matching slot if `now` (in `timezone`) falls in the configured
 * hour for an enabled nudge day. Otherwise null.
 */
export function currentSlot(
  now: Date,
  schedule: NudgeSchedule,
  timezone: string,
): NudgeSlot | null {
  const day = NUDGE_DAY_BY_INDEX[localDayOfWeek(now, timezone)];
  if (!day) return null;
  const slot = schedule[day];
  if (!slot.enabled) return null;
  if (localHour(now, timezone) !== slot.hour) return null;
  return { day, hour: slot.hour };
}

/**
 * The next Sunday >= today's local date in the given timezone, formatted as
 * YYYY-MM-DD. Today counts if today is Sunday.
 */
export function upcomingSundayIso(now: Date, timezone: string): string {
  const { y, m, d } = localYmd(now, timezone);
  const dow = localDayOfWeek(now, timezone);
  const daysAhead = (7 - dow) % 7;
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() + daysAhead);
  const yy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(utc.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function slotKey(date: string, slot: NudgeSlot): string {
  return `${date}:${slot.day}`;
}
