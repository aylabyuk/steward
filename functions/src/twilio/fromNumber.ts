/** Two-mode resolution for the outbound SMS proxy number.
 *
 *  "production" — TWILIO_FROM_NUMBER, the default for every send.
 *  "testing"    — TWILIO_FROM_NUMBER_TESTING, opt-in via the dev-mode
 *                 toggle on the profile page (gated by email allowlist
 *                 in sendSpeakerInvitation). Lets the maintainer keep
 *                 the prior prod number addressable for production
 *                 smoke tests without churning the live one.
 *
 *  The mode is persisted on the invitation doc as `fromNumberMode`, so
 *  every downstream SMS for that invitation (rotation, bishop-reply
 *  notification) routes through the same number — the speaker sees a
 *  consistent FROM throughout the thread. */
export type FromNumberMode = "production" | "testing";

export function resolveFromNumber(mode: FromNumberMode | undefined): string {
  if (mode === "testing") {
    const num = process.env.TWILIO_FROM_NUMBER_TESTING;
    if (!num) {
      throw new Error(
        "TWILIO_FROM_NUMBER_TESTING missing — dev-mode testing send requested but the testing number isn't configured for this environment.",
      );
    }
    return num;
  }
  const num = process.env.TWILIO_FROM_NUMBER;
  if (!num) throw new Error("TWILIO_FROM_NUMBER missing.");
  return num;
}
