import { describe, expect, it } from "vitest";
import { formatDeletedNoticeBody } from "../messageDeletedNotice";

describe("formatDeletedNoticeBody", () => {
  it("formats deleter + short month-day stamp", () => {
    const apr28 = new Date("2026-04-28T12:34:00");
    const body = formatDeletedNoticeBody("Bishop John", apr28);
    expect(body).toMatch(/^Message removed by Bishop John · /);
    // Locale-dependent stamp; assert structure rather than exact format
    expect(body).toMatch(/Apr.*28|28.*Apr/);
  });

  it("escapes nothing — name is interpolated as-is", () => {
    const body = formatDeletedNoticeBody("L. Foster", new Date("2026-01-02"));
    expect(body).toContain("L. Foster");
  });
});
