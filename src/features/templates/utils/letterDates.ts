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

/** Convenience for the prepare pages: turn the persisted `savedAt`
 *  Firestore Timestamp into the `versionStamp` prop shape consumed by
 *  PrintOnlyLetter, or `null` when there's no parseable timestamp.
 *  Returning the discriminated shape directly keeps the per-page glue
 *  one inlinable expression. */
export function buildSavedVersionStamp(savedAt: unknown): { label: "Saved"; text: string } | null {
  const text = formatVersionTimestamp(savedAt);
  return text ? { label: "Saved", text } : null;
}

/** Renders a short reference timestamp for the bottom-of-page version
 *  stamp on PDF exports — e.g. "May 2, 2026 · 2:23 PM". Accepts a
 *  Date, ISO string, or a Firestore Timestamp-shaped object with
 *  `toDate()`. Returns `null` when the value is missing or unparseable
 *  so callers can omit the stamp without rendering "Saved Invalid Date". */
export function formatVersionTimestamp(value: unknown): string | null {
  const date = coerceDate(value);
  if (!date) return null;
  const d = date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const t = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${d} · ${t}`;
}

function coerceDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "object" && value !== null && "toDate" in value) {
    const fn = (value as { toDate: () => Date }).toDate;
    if (typeof fn === "function") {
      const d = fn.call(value);
      return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
    }
  }
  return null;
}
