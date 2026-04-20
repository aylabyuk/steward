import type { Hymn, Assignment } from "@/lib/types";

export function formatHymn(h: Hymn | null | undefined): string {
  if (!h) return "—";
  return `#${h.number}  ${h.title}`;
}

export function formatPerson(a: Assignment | null | undefined): string {
  if (!a?.person?.name) return "—";
  return a.person.name;
}

export function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
