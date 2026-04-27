import { describe, expect, it } from "vitest";
import { validatePrayerRow } from "../validatePrayerRow";

describe("validatePrayerRow", () => {
  it("treats fully empty contact as valid (contact is optional)", () => {
    expect(validatePrayerRow({ email: "", phone: "" })).toEqual({
      emailError: false,
      phoneError: false,
      hasError: false,
    });
  });

  it("flags malformed email when filled", () => {
    const v = validatePrayerRow({ email: "not-an-email", phone: "" });
    expect(v.emailError).toBe(true);
    expect(v.hasError).toBe(true);
  });

  it("accepts a well-formed email", () => {
    expect(validatePrayerRow({ email: "reyes@example.com", phone: "" }).emailError).toBe(false);
  });

  it("flags non-E.164 phone when filled", () => {
    const v = validatePrayerRow({ email: "", phone: "(416) 555-1234" });
    expect(v.phoneError).toBe(true);
    expect(v.hasError).toBe(true);
  });

  it("accepts an E.164 phone", () => {
    expect(validatePrayerRow({ email: "", phone: "+14165551234" }).phoneError).toBe(false);
  });

  it("treats whitespace-only as empty (no error)", () => {
    expect(validatePrayerRow({ email: "   ", phone: "  " }).hasError).toBe(false);
  });
});
