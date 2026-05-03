import { describe, expect, it } from "vitest";
import { computeNudgeTarget, type NudgeMember } from "./nudgeTarget.js";

const roster: NudgeMember[] = [
  { uid: "bish", role: "bishopric", active: true },
  { uid: "c1", role: "bishopric", active: true },
  { uid: "c2", role: "bishopric", active: true },
  { uid: "clerk", role: "clerk", active: true },
  { uid: "inactive", role: "bishopric", active: false },
];

const base = {
  day: "wednesday" as const,
  date: "2026-04-26",
  members: roster,
};

describe("computeNudgeTarget", () => {
  it("nudges the whole active team when the meeting doc is missing", () => {
    const out = computeNudgeTarget({ ...base, meeting: null });
    expect(out?.uids.toSorted()).toEqual(["bish", "c1", "c2", "clerk"]);
    expect(out?.title).toContain("No program yet");
  });

  it("skips when the meeting is cancelled", () => {
    expect(
      computeNudgeTarget({
        ...base,
        meeting: { cancellation: { cancelled: true }, meetingType: "regular" },
      }),
    ).toBeNull();
  });

  it("skips non-meeting Sundays", () => {
    expect(
      computeNudgeTarget({
        ...base,
        meeting: { meetingType: "stake" },
      }),
    ).toBeNull();
  });

  it("nudges the whole active team for any editable meeting", () => {
    const out = computeNudgeTarget({
      ...base,
      meeting: { meetingType: "regular" },
    });
    expect(out?.uids.toSorted()).toEqual(["bish", "c1", "c2", "clerk"]);
    expect(out?.title).toContain("Program needs review");
  });

  it("severity follows the slot (wed=soft, fri=urgent, sat=critical)", () => {
    const meeting = { meetingType: "regular" };
    expect(computeNudgeTarget({ ...base, day: "wednesday", meeting })?.severity).toBe("soft");
    expect(computeNudgeTarget({ ...base, day: "friday", meeting })?.severity).toBe("urgent");
    expect(computeNudgeTarget({ ...base, day: "saturday", meeting })?.severity).toBe("critical");
  });
});
