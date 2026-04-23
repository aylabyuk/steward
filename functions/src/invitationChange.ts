import type { SpeakerInvitationShape } from "./invitationTypes.js";

export interface InvitationChange {
  /** Response just went from absent → present. */
  fireSpeaker: boolean;
  /** `response.acknowledgedAt` just appeared (Apply was tapped). */
  fireBishopric: boolean;
}

/** Returns a pair of booleans describing which receipts should fire
 *  for a given before/after snapshot of the invitation doc.
 *
 *  - Deletions: no receipts.
 *  - Response newly set (was absent before): speaker receipt.
 *  - Acknowledgement newly set: bishopric receipt.
 *  - Other writes (token rotation, heartbeat, delivery record): none.
 *
 *  The "appeared" guard deduplicates retried trigger invocations:
 *  a doc write that already had `response.answer` set will produce
 *  `fireSpeaker=false` on re-fire. */
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
    fireSpeaker: !answerBefore && Boolean(answerAfter),
    fireBishopric: !ackBefore && Boolean(ackAfter),
  };
}
