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
  approvedUids: new Set<string>(),
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

  it("skips when the meeting is approved", () => {
    expect(
      computeNudgeTarget({
        ...base,
        meeting: { meetingType: "regular", status: "approved" },
      }),
    ).toBeNull();
  });

  it("draft → whole active team", () => {
    const out = computeNudgeTarget({
      ...base,
      meeting: { meetingType: "regular", status: "draft" },
    });
    expect(out?.uids.toSorted()).toEqual(["bish", "c1", "c2", "clerk"]);
    expect(out?.title).toContain("Program needs review");
  });

  it("pending_approval → only bishopric who haven't approved", () => {
    const out = computeNudgeTarget({
      ...base,
      approvedUids: new Set(["bish"]),
      meeting: { meetingType: "regular", status: "pending_approval" },
    });
    expect(out?.uids.toSorted()).toEqual(["c1", "c2"]);
    expect(out?.title).toContain("Approval needed");
  });

  it("pending_approval with all bishopric already approved → null", () => {
    expect(
      computeNudgeTarget({
        ...base,
        approvedUids: new Set(["bish", "c1", "c2"]),
        meeting: { meetingType: "regular", status: "pending_approval" },
      }),
    ).toBeNull();
  });

  it("severity follows the slot (wed=soft, fri=urgent, sat=critical)", () => {
    const meeting = { meetingType: "regular", status: "draft" };
    expect(computeNudgeTarget({ ...base, day: "wednesday", meeting })?.severity).toBe("soft");
    expect(computeNudgeTarget({ ...base, day: "friday", meeting })?.severity).toBe("urgent");
    expect(computeNudgeTarget({ ...base, day: "saturday", meeting })?.severity).toBe("critical");
  });
});
