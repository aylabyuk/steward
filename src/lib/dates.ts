export function formatISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) throw new Error(`Invalid ISO date: ${s}`);
  return new Date(y, m - 1, d);
}

export function upcomingSundays(from: Date, weeks: number): string[] {
  const first = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const day = first.getDay();
  if (day !== 0) first.setDate(first.getDate() + (7 - day));
  const out: string[] = [];
  for (let i = 0; i < weeks; i++) {
    const d = new Date(first);
    d.setDate(first.getDate() + i * 7);
    out.push(formatISODate(d));
  }
  return out;
}

export function isFirstSundayOfMonth(isoDate: string): boolean {
  const d = parseISODate(isoDate);
  return d.getDay() === 0 && d.getDate() <= 7;
}

export function daysBetween(from: Date, toIso: string): number {
  const to = parseISODate(toIso);
  const msPerDay = 1000 * 60 * 60 * 24;
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((to.getTime() - start.getTime()) / msPerDay);
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
 * The next Sunday >= today's local date in `timezone`, formatted as
 * YYYY-MM-DD. Today counts if today is Sunday, so a Sunday-of edit
 * window stays open until the local clock crosses midnight into Monday.
 *
 * Drives the "planning is open for the upcoming Sunday only" rule — the
 * schedule + week editor compare card dates against this to decide what's
 * editable. Mirrors `functions/src/nudgeSlot.ts::upcomingSundayIso`.
 */
export function getUpcomingSundayIso(now: Date, timezone: string): string {
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
