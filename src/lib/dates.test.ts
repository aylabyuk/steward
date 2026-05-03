import { describe, expect, it } from "vitest";
import {
  daysBetween,
  formatISODate,
  getUpcomingSundayIso,
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

describe("getUpcomingSundayIso", () => {
  // Anchor everything in `America/Los_Angeles` so the assertions stay
  // stable across DST shifts and CI machines in other zones — the
  // helper is timezone-aware on purpose.
  const TZ = "America/Los_Angeles";

  it("returns today when today is Sunday (any time of day)", () => {
    // 2026-04-19 is a Sunday. Both midday and just-before-midnight
    // local times must still resolve to today's ISO so a Sunday-of
    // edit window stays open until the local clock crosses midnight.
    const noon = new Date("2026-04-19T19:00:00Z"); // 12:00 PDT
    const lateNight = new Date("2026-04-20T06:59:00Z"); // 23:59 PDT, still Sunday
    expect(getUpcomingSundayIso(noon, TZ)).toBe("2026-04-19");
    expect(getUpcomingSundayIso(lateNight, TZ)).toBe("2026-04-19");
  });

  it("rolls forward to the next Sunday at the local Sun→Mon midnight boundary", () => {
    // 06:59 UTC on 2026-04-20 is 23:59 PDT Sunday → still Sunday.
    // 07:00 UTC on 2026-04-20 is 00:00 PDT Monday → next Sunday opens.
    const sundayLast = new Date("2026-04-20T06:59:00Z");
    const mondayFirst = new Date("2026-04-20T07:00:00Z");
    expect(getUpcomingSundayIso(sundayLast, TZ)).toBe("2026-04-19");
    expect(getUpcomingSundayIso(mondayFirst, TZ)).toBe("2026-04-26");
  });

  it("returns the next Sunday from any weekday", () => {
    const monday = new Date("2026-04-20T15:00:00Z"); // 08:00 PDT Mon
    const wednesday = new Date("2026-04-22T15:00:00Z"); // 08:00 PDT Wed
    const saturday = new Date("2026-04-25T15:00:00Z"); // 08:00 PDT Sat
    expect(getUpcomingSundayIso(monday, TZ)).toBe("2026-04-26");
    expect(getUpcomingSundayIso(wednesday, TZ)).toBe("2026-04-26");
    expect(getUpcomingSundayIso(saturday, TZ)).toBe("2026-04-26");
  });

  it("respects the timezone — the ward in Manila sees a different upcoming Sunday than LA", () => {
    // 2026-04-20T15:00:00Z is Mon 08:00 PDT but Mon 23:00 PHT — both
    // already past Sunday-end-of-day in their own zones, so both
    // resolve to next Sunday 2026-04-26.
    const t = new Date("2026-04-20T15:00:00Z");
    expect(getUpcomingSundayIso(t, "America/Los_Angeles")).toBe("2026-04-26");
    expect(getUpcomingSundayIso(t, "Asia/Manila")).toBe("2026-04-26");

    // 2026-04-19T18:00:00Z is Sun 11:00 PDT (still Sunday in LA) but
    // Mon 02:00 PHT (already Monday in Manila). The two zones return
    // different upcoming Sundays — that's the whole point of the
    // tz parameter.
    const t2 = new Date("2026-04-19T18:00:00Z");
    expect(getUpcomingSundayIso(t2, "America/Los_Angeles")).toBe("2026-04-19");
    expect(getUpcomingSundayIso(t2, "Asia/Manila")).toBe("2026-04-26");
  });
});
