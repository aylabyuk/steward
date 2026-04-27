import { describe, expect, it } from "vitest";
import {
  buildSmsHref,
  isE164,
  isPlausiblePhone,
  normalizePhone,
  renderSmsBody,
  toE164,
} from "../smsInvitation";

describe("normalizePhone", () => {
  it("strips non-digit separators", () => {
    expect(normalizePhone("(555) 123-4567")).toBe("5551234567");
    expect(normalizePhone("555 123 4567")).toBe("5551234567");
    expect(normalizePhone("555.123.4567")).toBe("5551234567");
  });

  it("preserves a leading plus", () => {
    expect(normalizePhone("+1 (555) 123-4567")).toBe("+15551234567");
    expect(normalizePhone("+44 20 7123 4567")).toBe("+442071234567");
  });

  it("does not insert a plus when none was given", () => {
    expect(normalizePhone("5551234567")).toBe("5551234567");
  });

  it("trims whitespace", () => {
    expect(normalizePhone("  555-123-4567  ")).toBe("5551234567");
  });
});

describe("isPlausiblePhone", () => {
  it("accepts 7+ digit numbers", () => {
    expect(isPlausiblePhone("5551234")).toBe(true);
    expect(isPlausiblePhone("555-1234")).toBe(true);
    expect(isPlausiblePhone("(555) 123-4567")).toBe(true);
    expect(isPlausiblePhone("+15551234567")).toBe(true);
  });

  it("rejects too-short input", () => {
    expect(isPlausiblePhone("")).toBe(false);
    expect(isPlausiblePhone("555")).toBe(false);
    expect(isPlausiblePhone("123-456")).toBe(false);
  });
});

describe("buildSmsHref", () => {
  it("produces an sms: URL with a body query param", () => {
    const href = buildSmsHref({ phone: "555-123-4567", body: "Hello world" });
    expect(href).toBe("sms:5551234567?body=Hello%20world");
  });

  it("preserves +E.164 numbers", () => {
    const href = buildSmsHref({ phone: "+1 555 123 4567", body: "Hi" });
    expect(href).toBe("sms:+15551234567?body=Hi");
  });

  it("percent-encodes special characters in the body", () => {
    const href = buildSmsHref({
      phone: "5551234567",
      body: "Link: https://example.com/x?y=1&z=2",
    });
    expect(href).toBe(
      "sms:5551234567?body=Link%3A%20https%3A%2F%2Fexample.com%2Fx%3Fy%3D1%26z%3D2",
    );
  });
});

describe("toE164", () => {
  it("prepends +1 to 10-digit NANP entries", () => {
    expect(toE164("4165551234")).toBe("+14165551234");
    expect(toE164("416-555-1234")).toBe("+14165551234");
    expect(toE164("(416) 555-1234")).toBe("+14165551234");
    expect(toE164("416 555 1234")).toBe("+14165551234");
  });

  it("adds the + for 11-digit NANP entries starting with 1", () => {
    expect(toE164("14165551234")).toBe("+14165551234");
    expect(toE164("1 416 555 1234")).toBe("+14165551234");
    expect(toE164("1-416-555-1234")).toBe("+14165551234");
  });

  it("preserves an already-E.164 number while stripping noise inside", () => {
    expect(toE164("+14165551234")).toBe("+14165551234");
    expect(toE164("+1 (416) 555-1234")).toBe("+14165551234");
    expect(toE164("+44 20 7123 4567")).toBe("+442071234567");
  });

  it("returns digits-only for anything it can't confidently coerce", () => {
    // 9 digits — too short for NANP, caller decides what to do
    expect(toE164("416555123")).toBe("416555123");
  });

  it("handles empty input", () => {
    expect(toE164("")).toBe("");
    expect(toE164("   ")).toBe("");
  });
});

describe("isE164", () => {
  it("accepts valid E.164", () => {
    expect(isE164("+14165551234")).toBe(true);
    expect(isE164("+442071234567")).toBe(true);
    expect(isE164("+11234567")).toBe(true); // minimum length
  });

  it("rejects missing +", () => {
    expect(isE164("14165551234")).toBe(false);
    expect(isE164("4165551234")).toBe(false);
  });

  it("rejects non-digits or inner spaces", () => {
    expect(isE164("+1 416 555 1234")).toBe(false);
    expect(isE164("+1-416-555-1234")).toBe(false);
  });

  it("rejects too-short / too-long", () => {
    expect(isE164("+1234")).toBe(false);
    expect(isE164(`+1${"0".repeat(15)}`)).toBe(false);
  });

  it("rejects a leading zero after the +", () => {
    expect(isE164("+04165551234")).toBe(false);
  });
});

describe("renderSmsBody", () => {
  it("interpolates speakerName, date, and inviteUrl", () => {
    const body = renderSmsBody({
      speakerName: "Sister Reeves",
      date: "Apr 26",
      inviteUrl: "https://example.com/invite/t",
    });
    expect(body).toBe(
      "Hi Sister Reeves, you've been invited to speak in sacrament meeting on Apr 26. Full invitation: https://example.com/invite/t",
    );
  });
});
