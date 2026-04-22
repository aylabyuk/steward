import { describe, expect, it } from "vitest";
import { buildSmsHref, isPlausiblePhone, normalizePhone, renderSmsBody } from "./smsInvitation";

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
