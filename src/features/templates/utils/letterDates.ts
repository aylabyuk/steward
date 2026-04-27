/** Shared letter-date formatters. The assigned Sunday (e.g. "Sunday,
 *  April 26, 2026") and today (e.g. "April 21, 2026") are rendered
 *  identically by both `sendSpeakerInvitation` at snapshot time and
 *  the override-dialog preview at author time. */

export function formatAssignedDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatToday(): string {
  return new Date().toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
