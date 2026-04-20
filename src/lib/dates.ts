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
