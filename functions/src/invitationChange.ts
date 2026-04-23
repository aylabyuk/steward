import type { SpeakerInvitationShape } from "./invitationTypes.js";

export interface InvitationChange {
  /** Response newly set OR flipped to a different answer (yes↔no). */
  fireSpeaker: boolean;
  /** `response.acknowledgedAt` just appeared (Apply was tapped). */
  fireBishopric: boolean;
}

/** Returns a pair of booleans describing which receipts should fire
 *  for a given before/after snapshot of the invitation doc.
 *
 *  - Deletions: no receipts.
 *  - Response newly set OR the answer flipped (yes↔no): speaker receipt.
 *    We re-fire on a flip so the speaker's inbox reflects their current
 *    status (an old yes-accepted email would otherwise linger after a
 *    change of mind) and the bishopric CC keeps a paper trail.
 *  - Acknowledgement newly set: bishopric receipt.
 *  - Other writes (token rotation, heartbeat, delivery record): none.
 *
 *  Firestore writes settle once per user action, so a legitimate flip
 *  fires exactly one receipt; re-fires of the same trigger invocation
 *  still dedupe because `answerBefore === answerAfter` on the re-run. */
export function classifyInvitationChange(
  before: SpeakerInvitationShape | undefined,
  after: SpeakerInvitationShape | undefined,
): InvitationChange {
  if (!after) return { fireSpeaker: false, fireBishopric: false };
  const answerBefore = before?.response?.answer;
  const answerAfter = after.response?.answer;
  const ackBefore = before?.response?.acknowledgedAt;
  const ackAfter = after.response?.acknowledgedAt;
  return {
    fireSpeaker: Boolean(answerAfter) && answerBefore !== answerAfter,
    fireBishopric: !ackBefore && Boolean(ackAfter),
  };
}
