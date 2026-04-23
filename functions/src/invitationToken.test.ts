import { describe, expect, it } from "vitest";
import {
  generateInvitationToken,
  hashInvitationToken,
  phoneLast4,
  rotationBucketKey,
  ROTATION_DAILY_CAP,
  tokenHashMatches,
} from "./invitationToken.js";

describe("generateInvitationToken", () => {
  it("returns a base64url string of ~43 chars (32 random bytes)", () => {
    const t = generateInvitationToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(t.length).toBeGreaterThanOrEqual(42);
    expect(t.length).toBeLessThanOrEqual(44);
  });

  it("returns distinct tokens on consecutive calls", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 10; i++) seen.add(generateInvitationToken());
    expect(seen.size).toBe(10);
  });
});

describe("hashInvitationToken", () => {
  it("returns a 64-char hex SHA-256 digest", () => {
    const h = hashInvitationToken("hello");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
  });

  it("is deterministic", () => {
    const t = generateInvitationToken();
    expect(hashInvitationToken(t)).toBe(hashInvitationToken(t));
  });
});

describe("tokenHashMatches", () => {
  it("accepts a token whose hash equals the stored hex", () => {
    const t = generateInvitationToken();
    const h = hashInvitationToken(t);
    expect(tokenHashMatches(t, h)).toBe(true);
  });

  it("rejects a token with a wrong hash", () => {
    const t = generateInvitationToken();
    const other = hashInvitationToken(generateInvitationToken());
    expect(tokenHashMatches(t, other)).toBe(false);
  });

  it("rejects on length mismatch without throwing", () => {
    expect(tokenHashMatches("any", "abc")).toBe(false);
    expect(tokenHashMatches("any", "")).toBe(false);
  });

  it("rejects garbage input without throwing", () => {
    expect(tokenHashMatches("any", "not-hex-at-all".padEnd(64, "z"))).toBe(false);
  });
});

describe("rotationBucketKey", () => {
  it("returns YYYY-MM-DD (UTC)", () => {
    expect(rotationBucketKey(new Date("2026-04-23T23:30:00Z"))).toBe("2026-04-23");
    expect(rotationBucketKey(new Date("2026-01-01T00:00:00Z"))).toBe("2026-01-01");
  });
});

describe("phoneLast4", () => {
  it("returns the last 4 digits of an E.164 number", () => {
    expect(phoneLast4("+14165551234")).toBe("1234");
    expect(phoneLast4("+442071234567")).toBe("4567");
  });

  it("returns null on missing / too-short input", () => {
    expect(phoneLast4(undefined)).toBeNull();
    expect(phoneLast4("")).toBeNull();
    expect(phoneLast4("12")).toBeNull();
  });
});

describe("ROTATION_DAILY_CAP", () => {
  it("is a positive integer", () => {
    expect(Number.isInteger(ROTATION_DAILY_CAP)).toBe(true);
    expect(ROTATION_DAILY_CAP).toBeGreaterThan(0);
  });
});
