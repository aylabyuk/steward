import type { SacramentMeeting } from "@/lib/types";

export interface MonthGroup {
  year: number;
  month: number;
  label: string; // e.g. "April 2026"
  sundays: Array<{ date: string; meeting: SacramentMeeting | null }>;
}

export function groupByMonth(
  dates: string[],
  meetings: Map<string, SacramentMeeting>,
): MonthGroup[] {
  const groups = new Map<string, MonthGroup>();

  for (const date of dates) {
    const [year, month] = date.split("-").slice(0, 2).map(Number);
    const key = `${year}-${month}`;

    if (!groups.has(key)) {
      const d = new Date(year, month - 1);
      const label = d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
      groups.set(key, { year, month, label, sundays: [] });
    }

    groups.get(key)!.sundays.push({
      date,
      meeting: meetings.get(date) ?? null,
    });
  }

  return Array.from(groups.values()).toSorted((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
}
