/** Default footer note shown at the bottom of the congregation
 *  copy's program panel. Bishopric can override per-Sunday from
 *  /week/:date/prepare. An explicit empty string hides the footer. */
export const DEFAULT_PROGRAM_FOOTER_NOTE =
  "Quietly ponder the prelude music 10 minutes before the meeting begins";

/** Resolve the footer text to render, given the per-meeting override.
 *  Undefined → default; empty string → null (hide); otherwise the
 *  override wins. */
export function resolveProgramFooterNote(override: string | undefined | null): string | null {
  if (override === undefined || override === null) return DEFAULT_PROGRAM_FOOTER_NOTE;
  if (override.trim().length === 0) return null;
  return override;
}
