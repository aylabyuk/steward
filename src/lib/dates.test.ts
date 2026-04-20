import { describe, expect, it } from "vitest";
import {
  daysBetween,
  formatISODate,
  isFirstSundayOfMonth,
  parseISODate,
  upcomingSundays,
} from "./dates";

describe("date helpers", () => {
  it("formats and parses ISO dates round-trip", () => {
    const d = new Date(2026, 3, 19);
    expect(formatISODate(d)).toBe("2026-04-19");
    expect(parseISODate("2026-04-19").getTime()).toBe(d.getTime());
  });

  it("generates 8 upcoming Sundays starting from a Sunday", () => {
    const dates = upcomingSundays(new Date(2026, 3, 19), 8);
    expect(dates).toEqual([
      "2026-04-19",
      "2026-04-26",
      "2026-05-03",
      "2026-05-10",
      "2026-05-17",
      "2026-05-24",
      "2026-05-31",
      "2026-06-07",
    ]);
  });

  it("rolls forward to the next Sunday when given a weekday", () => {
    const [first] = upcomingSundays(new Date(2026, 3, 20), 1);
    expect(first).toBe("2026-04-26");
  });

  it("identifies first Sundays of the month", () => {
    expect(isFirstSundayOfMonth("2026-04-05")).toBe(true);
    expect(isFirstSundayOfMonth("2026-05-03")).toBe(true);
    expect(isFirstSundayOfMonth("2026-04-19")).toBe(false);
  });

  it("computes days until a date", () => {
    expect(daysBetween(new Date(2026, 3, 19), "2026-04-26")).toBe(7);
    expect(daysBetween(new Date(2026, 3, 19), "2026-04-19")).toBe(0);
  });
});
