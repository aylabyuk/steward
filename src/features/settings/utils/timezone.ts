export function isValidTimezone(tz: string): boolean {
  if (!tz) return false;
  try {
    const fmt = new Intl.DateTimeFormat(undefined, { timeZone: tz });
    return Boolean(fmt.resolvedOptions().timeZone);
  } catch {
    return false;
  }
}

const COMMON_TIMEZONES = [
  "America/Anchorage",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/New_York",
  "America/Phoenix",
  "America/Mexico_City",
  "America/Bogota",
  "America/Sao_Paulo",
  "Europe/Berlin",
  "Europe/London",
  "Europe/Madrid",
  "Africa/Johannesburg",
  "Asia/Manila",
  "Asia/Seoul",
  "Asia/Tokyo",
  "Pacific/Auckland",
  "Pacific/Honolulu",
  "UTC",
];

export function timezoneSuggestions(): readonly string[] {
  if (typeof Intl.supportedValuesOf === "function") {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch {
      return COMMON_TIMEZONES;
    }
  }
  return COMMON_TIMEZONES;
}
