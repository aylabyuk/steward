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
