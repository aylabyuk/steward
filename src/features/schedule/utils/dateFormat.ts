export function formatShortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** Short weekday + date — e.g. "Sun May 20". Used in speaker-facing
 *  chat copy ("Can you speak on Sun May 20?", confirmation system
 *  notices) where the ambiguous "this Sunday" could land 0–6 days
 *  out. Falls back to the raw ISO string if parsing fails. */
export function formatShortSunday(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** "1st Sunday", "2nd Sunday", "5th Sunday" — based on which Sunday
 *  of the month the given ISO date is. Sundays are 7 days apart, so
 *  ceil(day-of-month / 7) gives the ordinal directly: day 1–7 → 1st,
 *  8–14 → 2nd, 15–21 → 3rd, 22–28 → 4th, 29–31 → 5th. The caller is
 *  expected to pass an actual Sunday date; no validation here. */
export function formatSundayOrdinal(iso: string): string {
  const [, , dStr] = iso.split("-");
  const day = Number(dStr);
  if (!Number.isInteger(day) || day < 1) return iso;
  const ordinal = Math.ceil(day / 7);
  const SUFFIX = ["th", "st", "nd", "rd"];
  const v = ordinal % 100;
  const suffix = SUFFIX[(v - 20) % 10] ?? SUFFIX[v] ?? SUFFIX[0];
  return `${ordinal}${suffix} Sunday`;
}

export function formatCountdown(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const eventDate = new Date(y, m - 1, d);
  const today = new Date();
  const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil < 0) return "Past";
  if (daysUntil === 0) return "Today";
  if (daysUntil === 1) return "In 1 day";
  if (daysUntil <= 7) return `In ${daysUntil} days`;
  const weeks = Math.ceil(daysUntil / 7);
  return `In ${weeks} week${weeks > 1 ? "s" : ""}`;
}
