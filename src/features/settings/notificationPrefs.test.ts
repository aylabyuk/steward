import { describe, expect, it } from "vitest";
import { formatQuietHours, withDefaults } from "./notificationPrefs";

describe("formatQuietHours", () => {
  it("renders (none) when not set", () => {
    expect(formatQuietHours(undefined)).toBe("(none)");
    expect(formatQuietHours({ enabled: true })).toBe("(none)");
  });

  it("zero-pads single-digit hours", () => {
    expect(formatQuietHours({ enabled: true, quietHours: { startHour: 8, endHour: 22 } })).toBe(
      "08:00 – 22:00",
    );
  });
});

describe("withDefaults", () => {
  it("fills in enabled = true when missing", () => {
    expect(withDefaults(undefined)).toEqual({ enabled: true });
  });

  it("preserves an existing prefs object", () => {
    const prefs = { enabled: false, quietHours: { startHour: 21, endHour: 7 } };
    expect(withDefaults(prefs)).toEqual(prefs);
  });
});
