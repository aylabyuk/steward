import { describe, expect, it } from "vitest";
import { localDayOfWeek, localYmd, upcomingSundayIso } from "./dates.js";

describe("localDayOfWeek", () => {
  it("returns 0 for Sunday in UTC", () => {
    expect(localDayOfWeek(new Date("2026-04-19T12:00:00Z"), "UTC")).toBe(0);
  });

  it("returns 1 for Monday in UTC", () => {
    expect(localDayOfWeek(new Date("2026-04-20T12:00:00Z"), "UTC")).toBe(1);
  });

  it("respects the timezone — Sun late UTC is still Sun in PT", () => {
    // 2026-04-20T03:00Z is Sun 20:00 PT (still Sunday in LA) but already Mon in UTC.
    const t = new Date("2026-04-20T03:00:00Z");
    expect(localDayOfWeek(t, "UTC")).toBe(1);
    expect(localDayOfWeek(t, "America/Los_Angeles")).toBe(0);
  });
});

describe("localYmd", () => {
  it("returns the Y/M/D in the given timezone", () => {
    expect(localYmd(new Date("2026-04-20T15:00:00Z"), "America/Los_Angeles")).toEqual({
      y: 2026,
      m: 4,
      d: 20,
    });
    // 2026-04-20T03:00Z is Sat... actually Sun 20:00 PT, so Y/M/D = 2026/4/19.
    expect(localYmd(new Date("2026-04-20T03:00:00Z"), "America/Los_Angeles")).toEqual({
      y: 2026,
      m: 4,
      d: 19,
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

  it("rolls forward at the local Sun→Mon boundary", () => {
    // 2026-04-20T06:59Z = 23:59 PDT Sunday — still Sunday in LA.
    expect(upcomingSundayIso(new Date("2026-04-20T06:59:00Z"), "America/Los_Angeles")).toBe(
      "2026-04-19",
    );
    // 2026-04-20T07:00Z = 00:00 PDT Monday — next Sunday opens.
    expect(upcomingSundayIso(new Date("2026-04-20T07:00:00Z"), "America/Los_Angeles")).toBe(
      "2026-04-26",
    );
  });
});
