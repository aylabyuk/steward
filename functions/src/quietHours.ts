export interface QuietHours {
  startHour: number;
  endHour: number;
}

/**
 * Returns the local hour (0-23) that `instant` falls in for `timezone`.
 * Uses Intl.DateTimeFormat which honors DST.
 */
export function localHour(instant: Date, timezone: string): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(instant);
  const hourPart = parts.find((p) => p.type === "hour");
  if (!hourPart) return 0;
  // "24" can appear in some implementations for midnight; normalize.
  const h = Number(hourPart.value);
  return h === 24 ? 0 : h;
}

/**
 * Inclusive of startHour, exclusive of endHour. Wrap-around windows
 * (e.g. 22 -> 7) are supported.
 */
export function isInQuietHours(now: Date, window: QuietHours, timezone: string): boolean {
  const h = localHour(now, timezone);
  const { startHour, endHour } = window;
  if (startHour === endHour) return false; // empty window
  if (startHour < endHour) return h >= startHour && h < endHour;
  // Wrap-around: e.g. 22..7 means 22,23,0,1,2,3,4,5,6
  return h >= startHour || h < endHour;
}
