import { describe, expect, it } from "vitest";
import { defaultMeetingType } from "../ensureMeetingDoc";

describe("defaultMeetingType", () => {
  it("picks fast for the first Sunday of a month", () => {
    expect(defaultMeetingType("2026-04-05", [])).toBe("fast");
  });

  it("picks regular for a non-first Sunday", () => {
    expect(defaultMeetingType("2026-04-19", [])).toBe("regular");
  });

  it("honors a non-meeting-Sundays override", () => {
    const override = [
      { date: "2026-04-19", type: "stake" as const },
      { date: "2026-10-04", type: "general" as const },
    ];
    expect(defaultMeetingType("2026-04-19", override)).toBe("stake");
    expect(defaultMeetingType("2026-10-04", override)).toBe("general");
  });

  it("falls through to fast when a fast Sunday is not listed as non-meeting", () => {
    const override = [{ date: "2026-04-19", type: "regular" as const }];
    expect(defaultMeetingType("2026-05-03", override)).toBe("fast");
  });
});
