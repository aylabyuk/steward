import { describe, expect, it } from "vitest";
import { defaultMeetingType } from "./ensureMeetingDoc";

describe("defaultMeetingType", () => {
  it("picks fast_sunday for the first Sunday of a month", () => {
    expect(defaultMeetingType("2026-04-05", [])).toBe("fast_sunday");
  });

  it("picks regular for a non-first Sunday", () => {
    expect(defaultMeetingType("2026-04-19", [])).toBe("regular");
  });

  it("honors a non-meeting-Sundays override", () => {
    const override = [
      { date: "2026-04-19", type: "stake_conference" as const },
      { date: "2026-10-04", type: "general_conference" as const },
    ];
    expect(defaultMeetingType("2026-04-19", override)).toBe("stake_conference");
    expect(defaultMeetingType("2026-10-04", override)).toBe("general_conference");
  });

  it("falls through to fast_sunday when a fast Sunday is not listed as non-meeting", () => {
    const override = [{ date: "2026-04-19", type: "other" as const }];
    expect(defaultMeetingType("2026-05-03", override)).toBe("fast_sunday");
  });
});
