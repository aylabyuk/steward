import { describe, expect, it } from "vitest";
import { isInQuietHours, localHour } from "./quietHours";

describe("localHour", () => {
  it("returns the local hour in the requested timezone", () => {
    // 2026-04-20T12:00:00Z = 05:00 in America/Los_Angeles (PDT, UTC-7)
    const at = new Date(Date.UTC(2026, 3, 20, 12, 0, 0));
    expect(localHour(at, "America/Los_Angeles")).toBe(5);
    expect(localHour(at, "UTC")).toBe(12);
  });
});

describe("isInQuietHours", () => {
  const tz = "UTC";

  it("matches a same-day window (8..22)", () => {
    const window = { startHour: 8, endHour: 22 };
    expect(isInQuietHours(new Date("2026-04-20T07:30:00Z"), window, tz)).toBe(false);
    expect(isInQuietHours(new Date("2026-04-20T08:00:00Z"), window, tz)).toBe(true);
    expect(isInQuietHours(new Date("2026-04-20T15:30:00Z"), window, tz)).toBe(true);
    expect(isInQuietHours(new Date("2026-04-20T22:00:00Z"), window, tz)).toBe(false);
  });

  it("matches a wrap-around window (22..7)", () => {
    const window = { startHour: 22, endHour: 7 };
    expect(isInQuietHours(new Date("2026-04-20T21:30:00Z"), window, tz)).toBe(false);
    expect(isInQuietHours(new Date("2026-04-20T22:00:00Z"), window, tz)).toBe(true);
    expect(isInQuietHours(new Date("2026-04-20T03:00:00Z"), window, tz)).toBe(true);
    expect(isInQuietHours(new Date("2026-04-20T07:00:00Z"), window, tz)).toBe(false);
  });

  it("treats start==end as an empty window", () => {
    expect(isInQuietHours(new Date(), { startHour: 9, endHour: 9 }, tz)).toBe(false);
  });
});
