/** Built-in default footer note shown at the bottom of the
 *  congregation copy's program panel. Wards can override the default
 *  from /settings/templates/programs; per-Sunday overrides on the
 *  meeting doc beat both. Empty string at any level hides the footer
 *  outright (caller wanted no footer that week / for that ward). */
export const DEFAULT_PROGRAM_FOOTER_NOTE =
  "Quietly ponder the prelude music 10 minutes before the meeting begins";

/** Resolve the footer text to render. Cascades meeting → ward → built-in
 *  default. At each level: undefined falls through; empty string is an
 *  explicit "hide" and short-circuits to null; non-empty wins. */
export function resolveProgramFooterNote(
  meetingOverride: string | undefined | null,
  wardDefault?: string | undefined | null,
): string | null {
  for (const value of [meetingOverride, wardDefault]) {
    if (value === undefined || value === null) continue;
    if (value.trim().length === 0) return null;
    return value;
  }
  return DEFAULT_PROGRAM_FOOTER_NOTE;
}

/** Resolve the cover image URL to render. Cascades meeting → ward →
 *  null. Empty strings at either level are treated as "no override
 *  here" (a placeholder shows when nothing is set). */
export function resolveCoverImageUrl(
  meetingOverride: string | undefined | null,
  wardDefault?: string | undefined | null,
): string | null {
  for (const value of [meetingOverride, wardDefault]) {
    if (value === undefined || value === null) continue;
    const trimmed = value.trim();
    if (trimmed.length === 0) continue;
    return trimmed;
  }
  return null;
}
