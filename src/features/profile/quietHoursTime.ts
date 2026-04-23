/** Convert an hour integer (0..23) to a "HH:00" string for
 *  `<input type="time">`. Values outside the valid range round to the
 *  nearest edge so bad data doesn't crash the form. */
export function hourToTime(hour: number): string {
  const clamped = Math.max(0, Math.min(23, Math.round(hour)));
  return `${clamped.toString().padStart(2, "0")}:00`;
}

/** Parse a "HH:MM" time input back to an hour integer. Minutes are
 *  discarded — backend schema is hour-granular. Returns null when the
 *  input can't be parsed (lets callers fall back to the previous
 *  value instead of writing garbage). */
export function timeToHour(value: string): number | null {
  const match = /^(\d{1,2}):\d{2}$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  if (!Number.isInteger(h) || h < 0 || h > 23) return null;
  return h;
}

/** Human-readable hint for the quiet-hours row — "overnight" when the
 *  window crosses midnight, "same day" otherwise. Matches the design
 *  prototype's copy. */
export function describeQuietWindow(startHour: number, endHour: number): "overnight" | "same day" {
  return startHour >= endHour ? "overnight" : "same day";
}
