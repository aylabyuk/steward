import { describe, expect, it } from "vitest";
import { isValidTimezone } from "../timezone";

describe("isValidTimezone", () => {
  it.each(["America/Los_Angeles", "Europe/Berlin", "UTC", "Asia/Tokyo"])("accepts %s", (tz) => {
    expect(isValidTimezone(tz)).toBe(true);
  });

  it.each(["", "Mars/Olympus_Mons", "America/NotARealCity", "garbage"])("rejects %s", (tz) => {
    expect(isValidTimezone(tz)).toBe(false);
  });
});
