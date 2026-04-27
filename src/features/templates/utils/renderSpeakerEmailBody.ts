import { interpolate } from "./interpolate";
import { DEFAULT_SPEAKER_EMAIL_BODY } from "./speakerEmailDefaults";

export interface SpeakerEmailBodyVars {
  speakerName: string;
  date: string; // already-formatted, e.g. "Sunday, April 26, 2026"
  wardName: string;
  inviterName: string;
  topic: string; // already-normalized; callers pass a fallback when empty
  inviteUrl: string;
}

/**
 * Resolve the plain-text `mailto:` body for a speaker invitation.
 * Precedence: per-speaker override (slice 2) → ward template → seed
 * default. Variables are interpolated here so the returned string is
 * ready to paste into the mail client.
 */
export function renderSpeakerEmailBody(
  vars: SpeakerEmailBodyVars,
  sources: { override?: string | null | undefined; template?: string | null | undefined },
): string {
  const source = sources.override?.trim() || sources.template?.trim() || DEFAULT_SPEAKER_EMAIL_BODY;
  return interpolate(source, vars);
}
