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

/** Whole-day delta from today's midnight to the event's midnight.
 *  Both sides anchor to local-midnight so DST shifts and "started
 *  composing at 11:59pm" don't pull a result across day boundaries.
 *  Returns null if the ISO string can't be parsed. */
function daysUntil(iso: string): number | null {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  const event = new Date(y, m - 1, d).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((event - today) / (1000 * 60 * 60 * 24));
}

/** Verbose countdown for desktop card headers + the type menu, where
 *  precision earns its keep ("In 2 weeks and 3 days" vs. the old ceil-
 *  rounded "In 3 weeks"). For tighter mobile chrome use
 *  `formatCountdownCompact`. */
export function formatCountdown(iso: string): string {
  const days = daysUntil(iso);
  if (days === null) return iso;
  if (days < 0) return "Past";
  if (days === 0) return "Today";
  if (days === 1) return "In 1 day";
  if (days < 7) return `In ${days} days`;
  const weeks = Math.floor(days / 7);
  const extra = days % 7;
  const weekPart = `${weeks} week${weeks > 1 ? "s" : ""}`;
  if (extra === 0) return `In ${weekPart}`;
  return `In ${weekPart} and ${extra} day${extra > 1 ? "s" : ""}`;
}

/** Compact countdown ("2w 3d") for mobile, where the verbose form
 *  would wrap the header. Same precision, fewer pixels. */
export function formatCountdownCompact(iso: string): string {
  const days = daysUntil(iso);
  if (days === null) return iso;
  if (days < 0) return "Past";
  if (days === 0) return "Today";
  if (days < 7) return `In ${days}d`;
  const weeks = Math.floor(days / 7);
  const extra = days % 7;
  if (extra === 0) return `In ${weeks}w`;
  return `In ${weeks}w ${extra}d`;
}
