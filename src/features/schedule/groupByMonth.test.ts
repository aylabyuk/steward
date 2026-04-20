import { describe, expect, it } from "vitest";
import { groupByMonth } from "./groupByMonth";
import type { SacramentMeeting } from "@/lib/types";

describe("groupByMonth", () => {
  it("groups Sundays by month", () => {
    const dates = ["2026-04-05", "2026-04-12", "2026-05-03", "2026-05-10"];
    const meetings = new Map<string, SacramentMeeting>();

    const groups = groupByMonth(dates, meetings);

    expect(groups).toHaveLength(2);
    expect(groups[0]!.label).toBe("April 2026");
    expect(groups[0]!.sundays).toHaveLength(2);
    expect(groups[1]!.label).toBe("May 2026");
    expect(groups[1]!.sundays).toHaveLength(2);
  });

  it("preserves meeting data when present", () => {
    const dates = ["2026-04-05"];
    const meeting: SacramentMeeting = {
      meetingType: "regular",
      status: "draft",
      approvals: [],
    };
    const meetings = new Map([["2026-04-05", meeting]]);

    const groups = groupByMonth(dates, meetings);

    expect(groups[0]!.sundays[0]!.meeting).toBe(meeting);
  });

  it("marks missing meetings as null", () => {
    const dates = ["2026-04-05"];
    const meetings = new Map<string, SacramentMeeting>();

    const groups = groupByMonth(dates, meetings);

    expect(groups[0]!.sundays[0]!.meeting).toBeNull();
  });

  it("sorts months chronologically", () => {
    const dates = ["2026-06-07", "2026-04-05", "2026-05-03"];
    const meetings = new Map<string, SacramentMeeting>();

    const groups = groupByMonth(dates, meetings);

    expect(groups[0]!.month).toBe(4);
    expect(groups[1]!.month).toBe(5);
    expect(groups[2]!.month).toBe(6);
  });
});
