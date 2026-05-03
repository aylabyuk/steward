// Timezone-aware date helpers shared across functions. Mirrors the
// client-side `src/lib/dates.ts` semantics so the upcoming-Sunday rule
// and any related cron scheduling stay aligned across the runtime
// boundary.

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** 0=Sun..6=Sat in `timezone`. */
export function localDayOfWeek(now: Date, timezone: string): number {
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short" });
  const parts = fmt.formatToParts(now);
  const w = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  return WEEKDAY_INDEX[w] ?? 0;
}

/** Year/month/day components in `timezone`. */
export function localYmd(now: Date, timezone: string): { y: number; m: number; d: number } {
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
 * The next Sunday >= today's local date in the given timezone, formatted as
 * YYYY-MM-DD. Today counts if today is Sunday — so a Sunday-of edit window
 * stays open until the local clock crosses midnight into Monday. Drives the
 * planning-open notification's idempotency key.
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
