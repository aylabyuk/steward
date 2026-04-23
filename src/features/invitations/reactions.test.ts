import { describe, expect, it } from "vitest";
import { readReactions, toggleReaction } from "./reactions";

describe("readReactions", () => {
  it("returns an empty object when attributes are null", () => {
    expect(readReactions(null)).toEqual({});
  });

  it("returns an empty object when the reactions key is missing", () => {
    expect(readReactions({ responseType: "yes" })).toEqual({});
  });

  it("strips non-string entries in a reaction list defensively", () => {
    const attrs = { reactions: { "👍": ["uid:a", 42, "uid:b", null] } };
    expect(readReactions(attrs as unknown as Record<string, unknown>)).toEqual({
      "👍": ["uid:a", "uid:b"],
    });
  });

  it("ignores non-array values under an emoji key", () => {
    const attrs = { reactions: { "👍": "uid:a" } };
    expect(readReactions(attrs as unknown as Record<string, unknown>)).toEqual({});
  });
});

describe("toggleReaction", () => {
  it("adds the caller's identity when not present", () => {
    expect(toggleReaction({}, "👍", "uid:me")).toEqual({ "👍": ["uid:me"] });
  });

  it("removes the caller's identity when already present", () => {
    expect(toggleReaction({ "👍": ["uid:me"] }, "👍", "uid:me")).toEqual({});
  });

  it("preserves other reactors when the caller toggles off", () => {
    expect(toggleReaction({ "👍": ["uid:a", "uid:me"] }, "👍", "uid:me")).toEqual({
      "👍": ["uid:a"],
    });
  });

  it("preserves other emoji entries when toggling one", () => {
    const current = { "👍": ["uid:a"], "❤️": ["uid:b"] };
    expect(toggleReaction(current, "👍", "uid:me")).toEqual({
      "👍": ["uid:a", "uid:me"],
      "❤️": ["uid:b"],
    });
  });
});
