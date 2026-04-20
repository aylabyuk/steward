import { describe, expect, it } from "vitest";
import {
  callingToRole,
  memberSchema,
  meetingTypeSchema,
  sacramentMeetingSchema,
  speakerSchema,
  wardSettingsSchema,
} from "./index";

describe("type schemas", () => {
  it("parses a minimal member doc", () => {
    const parsed = memberSchema.parse({
      email: "bishop@example.com",
      displayName: "Ben Bishop",
      calling: "bishop",
      role: "bishopric",
    });
    expect(parsed.active).toBe(true);
    expect(parsed.ccOnEmails).toBe(true);
  });

  it("rejects an invalid calling", () => {
    expect(() =>
      memberSchema.parse({
        email: "x@y.com",
        displayName: "X",
        calling: "stake_president",
        role: "bishopric",
      }),
    ).toThrow();
  });

  it("maps callings to roles", () => {
    expect(callingToRole("bishop")).toBe("bishopric");
    expect(callingToRole("first_counselor")).toBe("bishopric");
    expect(callingToRole("second_counselor")).toBe("bishopric");
    expect(callingToRole("ward_clerk")).toBe("clerk");
    expect(callingToRole("executive_secretary")).toBe("clerk");
  });

  it("parses all meeting types", () => {
    for (const t of meetingTypeSchema.options) {
      expect(meetingTypeSchema.parse(t)).toBe(t);
    }
  });

  it("parses a draft regular meeting with defaults", () => {
    const parsed = sacramentMeetingSchema.parse({
      meetingType: "regular",
      status: "draft",
    });
    expect(parsed.approvals).toEqual([]);
    expect(parsed.wardBusiness).toBe("");
  });

  it("parses a speaker with optional fields", () => {
    const parsed = speakerSchema.parse({
      name: "Alice",
      status: "planned",
      role: "Member",
    });
    expect(parsed.name).toBe("Alice");
  });

  it("fills in ward settings defaults", () => {
    const parsed = wardSettingsSchema.parse({});
    expect(parsed.timezone).toBe("UTC");
    expect(parsed.speakerLeadTimeDays).toBe(14);
    expect(parsed.scheduleHorizonWeeks).toBe(8);
    expect(parsed.nudgeSchedule.wednesday.enabled).toBe(true);
    expect(parsed.nudgeSchedule.saturday.enabled).toBe(false);
  });

  it("rejects a meeting with an invalid status", () => {
    expect(() =>
      sacramentMeetingSchema.parse({ meetingType: "regular", status: "bogus" }),
    ).toThrow();
  });

  it("enforces at most 2 sacrament blessers", () => {
    const blesser = { person: null, status: "not_assigned" as const };
    expect(() =>
      sacramentMeetingSchema.parse({
        meetingType: "regular",
        status: "draft",
        sacramentBlessers: [blesser, blesser, blesser],
      }),
    ).toThrow();
  });
});
