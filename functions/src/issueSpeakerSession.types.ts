/** Shared types + constants for the speaker token-exchange surface.
 *  Lives in its own file so `issueSpeakerSession.ts` (the callable
 *  entry point) and `issueSpeakerSession.helpers.ts` (the decision
 *  helpers) can import without a circular dep. */

export const TOKEN_TTL_SECONDS = 3600;

export type SpeakerResponse =
  | {
      status: "ready";
      firebaseCustomToken: string;
      twilioToken: string;
      identity: string;
      expiresInSeconds: number;
    }
  | { status: "rotated"; phoneLast4: string | null }
  | { status: "rate-limited" }
  | { status: "invalid" };
