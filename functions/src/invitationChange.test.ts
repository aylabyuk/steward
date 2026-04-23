import { describe, expect, it } from "vitest";
import { classifyInvitationChange } from "./invitationChange.js";
import type { SpeakerInvitationShape } from "./invitationTypes.js";

function mk(overrides: Partial<SpeakerInvitationShape> = {}): SpeakerInvitationShape {
  return {
    speakerRef: { meetingDate: "2026-05-03", speakerId: "sp1" },
    assignedDate: "Sunday, May 3, 2026",
    sentOn: "April 22, 2026",
    wardName: "Test Ward",
    speakerName: "Sister Jones",
    inviterName: "Bishop Smith",
    bodyMarkdown: "body",
    footerMarkdown: "footer",
    ...overrides,
  };
}

describe("classifyInvitationChange", () => {
  it("is a no-op when the document was deleted", () => {
    const before = mk({ response: { answer: "yes" } });
    expect(classifyInvitationChange(before, undefined)).toEqual({
      fireSpeaker: false,
      fireBishopric: false,
    });
  });

  it("fires the speaker receipt when response.answer appears", () => {
    const after = mk({ response: { answer: "yes" } });
    expect(classifyInvitationChange(mk(), after)).toEqual({
      fireSpeaker: true,
      fireBishopric: false,
    });
  });

  it("does not re-fire the speaker receipt when response.answer was already set", () => {
    const before = mk({ response: { answer: "yes" } });
    const after = mk({ response: { answer: "yes", reason: "added later" } });
    expect(classifyInvitationChange(before, after)).toEqual({
      fireSpeaker: false,
      fireBishopric: false,
    });
  });

  it("fires the bishopric receipt when acknowledgedAt appears", () => {
    const before = mk({ response: { answer: "yes" } });
    const after = mk({
      response: {
        answer: "yes",
        acknowledgedAt: {
          toMillis: () => 0,
          toDate: () => new Date(),
        } as unknown as FirebaseFirestore.Timestamp,
        acknowledgedBy: "uid:bishop",
      },
    });
    expect(classifyInvitationChange(before, after)).toEqual({
      fireSpeaker: false,
      fireBishopric: true,
    });
  });

  it("does not fire either receipt for unrelated writes (e.g., heartbeat)", () => {
    const before = mk({ response: { answer: "yes", acknowledgedAt: tsFor(0) } });
    const after = mk({
      response: { answer: "yes", acknowledgedAt: tsFor(0) },
      speakerLastSeenAt: tsFor(1000),
    });
    expect(classifyInvitationChange(before, after)).toEqual({
      fireSpeaker: false,
      fireBishopric: false,
    });
  });

  it("fires the bishopric receipt even if the response was seeded in the same write (rare)", () => {
    const after = mk({
      response: { answer: "yes", acknowledgedAt: tsFor(0), acknowledgedBy: "uid:bishop" },
    });
    expect(classifyInvitationChange(undefined, after)).toEqual({
      fireSpeaker: true,
      fireBishopric: true,
    });
  });
});

function tsFor(ms: number): FirebaseFirestore.Timestamp {
  return {
    toMillis: () => ms,
    toDate: () => new Date(ms),
  } as unknown as FirebaseFirestore.Timestamp;
}
