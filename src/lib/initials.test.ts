import { describe, expect, it } from "vitest";
import { avatarPaletteFor, initialsOf } from "./initials";

describe("initialsOf", () => {
  it("returns first + last initials for a multi-word name", () => {
    expect(initialsOf("Bishop Jones")).toBe("BJ");
    expect(initialsOf("Hannah Marie Reeves")).toBe("HR");
  });

  it("returns the first two letters for a single-word name", () => {
    expect(initialsOf("Hannah")).toBe("HA");
  });

  it("uppercases regardless of input casing", () => {
    expect(initialsOf("bishop jones")).toBe("BJ");
  });

  it("tolerates extra whitespace", () => {
    expect(initialsOf("  Bishop   Jones  ")).toBe("BJ");
  });

  it("returns '?' for null, undefined, empty, and whitespace-only", () => {
    expect(initialsOf(null)).toBe("?");
    expect(initialsOf(undefined)).toBe("?");
    expect(initialsOf("")).toBe("?");
    expect(initialsOf("   ")).toBe("?");
  });
});

describe("avatarPaletteFor", () => {
  it("returns the same slot for the same seed across calls", () => {
    const a = avatarPaletteFor("uid:abc");
    const b = avatarPaletteFor("uid:abc");
    expect(a).toEqual(b);
  });

  it("returns a slot even for empty seeds (no throw)", () => {
    const p = avatarPaletteFor(null);
    expect(p.bg).toBeTruthy();
    expect(p.fg).toBeTruthy();
  });

  it("distributes uids across multiple slots (probabilistic smoke test)", () => {
    const seeds = Array.from({ length: 50 }, (_, i) => `uid:${i}`);
    const slots = new Set(seeds.map((s) => avatarPaletteFor(s).bg));
    // Palette has 6 slots; 50 uids should land in more than 2 of them.
    expect(slots.size).toBeGreaterThan(2);
  });
});
