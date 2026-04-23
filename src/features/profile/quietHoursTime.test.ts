import { describe, expect, it } from "vitest";
import { describeQuietWindow, hourToTime, timeToHour } from "./quietHoursTime";

describe("hourToTime", () => {
  it("zero-pads single-digit hours", () => {
    expect(hourToTime(7)).toBe("07:00");
  });

  it("passes double-digit hours through unchanged", () => {
    expect(hourToTime(21)).toBe("21:00");
  });

  it("rounds fractional hours to the nearest integer", () => {
    expect(hourToTime(6.4)).toBe("06:00");
    expect(hourToTime(6.6)).toBe("07:00");
  });

  it("clamps out-of-range values to 0..23", () => {
    expect(hourToTime(-3)).toBe("00:00");
    expect(hourToTime(99)).toBe("23:00");
  });
});

describe("timeToHour", () => {
  it("returns the hour for a well-formed input", () => {
    expect(timeToHour("21:00")).toBe(21);
    expect(timeToHour("07:30")).toBe(7);
  });

  it("returns null for unparseable values", () => {
    expect(timeToHour("")).toBeNull();
    expect(timeToHour("nope")).toBeNull();
    expect(timeToHour("25:00")).toBeNull();
    expect(timeToHour("7")).toBeNull();
  });

  it("tolerates single-digit hours from quirky browsers", () => {
    expect(timeToHour("7:00")).toBe(7);
  });
});

describe("describeQuietWindow", () => {
  it("reads as overnight when the window wraps past midnight", () => {
    expect(describeQuietWindow(21, 7)).toBe("overnight");
  });

  it("reads as same day when both hours are ascending", () => {
    expect(describeQuietWindow(8, 17)).toBe("same day");
  });

  it("treats equal hours as overnight (24h silence band)", () => {
    expect(describeQuietWindow(12, 12)).toBe("overnight");
  });
});
