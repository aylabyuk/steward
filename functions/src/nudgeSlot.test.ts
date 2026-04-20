import { describe, expect, it } from "vitest";
import { currentSlot, type NudgeSchedule, slotKey, upcomingSundayIso } from "./nudgeSlot.js";

const schedule: NudgeSchedule = {
  wednesday: { enabled: true, hour: 19 },
  friday: { enabled: true, hour: 19 },
  saturday: { enabled: false, hour: 9 },
};

describe("currentSlot", () => {
  it("returns wed when wed 19:00 in the configured timezone", () => {
    // 2026-04-22 (Wed) 19:00 UTC
    expect(currentSlot(new Date("2026-04-22T19:00:00Z"), schedule, "UTC")).toEqual({
      day: "wednesday",
      hour: 19,
    });
  });

  it("returns null off-hour", () => {
    expect(currentSlot(new Date("2026-04-22T18:00:00Z"), schedule, "UTC")).toBeNull();
  });

  it("returns null on a non-nudge day (Tue)", () => {
    expect(currentSlot(new Date("2026-04-21T19:00:00Z"), schedule, "UTC")).toBeNull();
  });

  it("respects per-day enabled flag (Sat off)", () => {
    expect(currentSlot(new Date("2026-04-25T09:00:00Z"), schedule, "UTC")).toBeNull();
  });

  it("treats hour in the configured timezone, not UTC", () => {
    // 2026-04-22T02:00Z = 2026-04-21T19:00 PT (Tue) -> not Wed yet, no match.
    expect(
      currentSlot(new Date("2026-04-22T02:00:00Z"), schedule, "America/Los_Angeles"),
    ).toBeNull();
    // 2026-04-23T02:00Z = 2026-04-22T19:00 PT (Wed) -> match.
    expect(currentSlot(new Date("2026-04-23T02:00:00Z"), schedule, "America/Los_Angeles")).toEqual({
      day: "wednesday",
      hour: 19,
    });
  });
});

describe("upcomingSundayIso", () => {
  it("returns this Sunday when called mid-week", () => {
    expect(upcomingSundayIso(new Date("2026-04-22T12:00:00Z"), "UTC")).toBe("2026-04-26");
  });

  it("returns today when today is Sunday", () => {
    expect(upcomingSundayIso(new Date("2026-04-26T08:00:00Z"), "UTC")).toBe("2026-04-26");
  });

  it("returns the timezone-local Sunday, not the UTC Sunday", () => {
    // 2026-04-19T03:00Z = 2026-04-18T20:00 PT (Sat) -> upcoming Sunday in PT is 2026-04-19.
    expect(upcomingSundayIso(new Date("2026-04-19T03:00:00Z"), "America/Los_Angeles")).toBe(
      "2026-04-19",
    );
  });
});

describe("slotKey", () => {
  it("composes a stable per-slot key", () => {
    expect(slotKey("2026-04-26", { day: "friday", hour: 19 })).toBe("2026-04-26:friday");
  });
});
