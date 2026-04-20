import { describe, expect, it } from "vitest";
import { computeDiff } from "./history";

describe("computeDiff", () => {
  it("returns no changes when objects are identical", () => {
    expect(computeDiff({ a: 1, b: "x" }, { a: 1, b: "x" })).toEqual([]);
  });

  it("detects a primitive change", () => {
    expect(computeDiff({ openingHymn: 1 }, { openingHymn: 2 })).toEqual([
      { field: "openingHymn", old: 1, new: 2 },
    ]);
  });

  it("ignores updatedAt and contentVersionHash noise", () => {
    const out = computeDiff(
      { updatedAt: 1, contentVersionHash: "old", title: "a" },
      { updatedAt: 2, contentVersionHash: "new", title: "a" },
    );
    expect(out).toEqual([]);
  });

  it("detects nested-object changes regardless of key order", () => {
    const out = computeDiff(
      { openingPrayer: { name: "Alice", status: "draft" } },
      { openingPrayer: { status: "draft", name: "Alice" } },
    );
    expect(out).toEqual([]);
  });

  it("detects nested-object value changes", () => {
    const out = computeDiff(
      { openingPrayer: { name: "Alice", status: "draft" } },
      { openingPrayer: { name: "Bob", status: "draft" } },
    );
    expect(out).toHaveLength(1);
    expect(out[0]?.field).toBe("openingPrayer");
  });

  it("detects array changes", () => {
    const out = computeDiff(
      { sacramentBlessers: [{ name: "A" }, { name: "B" }] },
      { sacramentBlessers: [{ name: "A" }, { name: "C" }] },
    );
    expect(out).toHaveLength(1);
    expect(out[0]?.field).toBe("sacramentBlessers");
  });

  it("records additions (no old)", () => {
    const out = computeDiff({}, { topic: "Faith" });
    expect(out).toEqual([{ field: "topic", new: "Faith" }]);
  });

  it("records removals (no new)", () => {
    const out = computeDiff({ topic: "Faith" }, { topic: undefined });
    expect(out).toEqual([{ field: "topic", old: "Faith" }]);
  });

  it("respects include filter", () => {
    const out = computeDiff({ a: 1, b: 1, c: 1 }, { a: 2, b: 2, c: 2 }, { include: ["b"] });
    expect(out).toEqual([{ field: "b", old: 1, new: 2 }]);
  });

  it("respects exclude filter on top of noise list", () => {
    const out = computeDiff(
      { secret: "x", title: "a" },
      { secret: "y", title: "a" },
      { exclude: ["secret"] },
    );
    expect(out).toEqual([]);
  });

  it("treats null oldData as a creation diff", () => {
    expect(computeDiff(null, { a: 1, b: 2 })).toEqual([
      { field: "a", new: 1 },
      { field: "b", new: 2 },
    ]);
  });
});
