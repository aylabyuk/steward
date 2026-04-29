import { describe, it, expect } from "vitest";
import {
  EMPTY_REACTIONS,
  REACTION_PALETTE,
  isReactionsNonEmpty,
  mergeReactionsIntoAttributes,
  orderedReactionEntries,
  parseReactions,
  reactionCount,
  reactionIncludes,
  toggleReaction,
} from "../reactions";

const BISHOP = "uid:bishop-a";
const SPEAKER = "speaker:invitation-x";

describe("reactions", () => {
  describe("toggle / lookup", () => {
    it("empty reactions report no entries and have no chips", () => {
      expect(isReactionsNonEmpty(EMPTY_REACTIONS)).toBe(false);
      expect(reactionCount(EMPTY_REACTIONS, "👍")).toBe(0);
      expect(reactionIncludes(EMPTY_REACTIONS, "👍", BISHOP)).toBe(false);
      expect(orderedReactionEntries(EMPTY_REACTIONS)).toEqual([]);
    });

    it("toggle with no prior reaction adds the identity", () => {
      const r = toggleReaction(EMPTY_REACTIONS, "👍", BISHOP);
      expect(reactionIncludes(r, "👍", BISHOP)).toBe(true);
      expect(reactionCount(r, "👍")).toBe(1);
    });

    it("toggling twice removes the identity (idempotent off)", () => {
      const added = toggleReaction(EMPTY_REACTIONS, "👍", BISHOP);
      const removed = toggleReaction(added, "👍", BISHOP);
      expect(reactionIncludes(removed, "👍", BISHOP)).toBe(false);
      expect(isReactionsNonEmpty(removed)).toBe(false);
    });

    it("two distinct identities can react with the same emoji", () => {
      const r = toggleReaction(toggleReaction(EMPTY_REACTIONS, "👍", BISHOP), "👍", SPEAKER);
      expect(reactionCount(r, "👍")).toBe(2);
      expect(reactionIncludes(r, "👍", BISHOP)).toBe(true);
      expect(reactionIncludes(r, "👍", SPEAKER)).toBe(true);
    });

    it("emoji bucket emptied by toggle-off is dropped from the entries map", () => {
      const r = toggleReaction(toggleReaction(EMPTY_REACTIONS, "👍", BISHOP), "👍", BISHOP);
      expect(Object.keys(r)).toEqual([]);
    });

    it("orderedReactionEntries orders palette emojis first, unknowns alphabetical", () => {
      // ❤️ before 🙏 by palette; 🌟 (unknown) after both, then 🌷
      // sorted alphabetically among unknowns.
      const r: Record<string, readonly string[]> = {
        "🙏": [BISHOP],
        "❤️": [BISHOP],
        "🌟": [BISHOP],
        "🌷": [BISHOP],
      };
      const ordered = orderedReactionEntries(r).map((e) => e.emoji);
      expect(ordered.slice(0, 2)).toEqual(["❤️", "🙏"]);
      expect(ordered.slice(2)).toEqual(["🌟", "🌷"].sort());
    });
  });

  describe("parseReactions", () => {
    it("parses the standard wire shape", () => {
      const raw = {
        kind: "status-change",
        reactions: { "👍": [BISHOP, SPEAKER], "🙏": [BISHOP] },
      };
      const r = parseReactions(raw);
      expect(reactionCount(r, "👍")).toBe(2);
      expect(reactionCount(r, "🙏")).toBe(1);
    });

    it("returns EMPTY_REACTIONS for null / missing payloads", () => {
      expect(parseReactions(null)).toEqual(EMPTY_REACTIONS);
      expect(parseReactions(undefined)).toEqual(EMPTY_REACTIONS);
      expect(parseReactions({ kind: "status-change" })).toEqual(EMPTY_REACTIONS);
    });

    it("ignores malformed bucket values (non-array, non-string entries)", () => {
      const raw = {
        reactions: { "👍": "not-an-array", "❤️": [42], "🙏": [BISHOP] },
      };
      const r = parseReactions(raw);
      expect(r["👍"]).toBeUndefined();
      expect(r["❤️"]).toBeUndefined();
      expect(reactionCount(r, "🙏")).toBe(1);
    });

    it("dedupes identities inside a bucket on read", () => {
      const raw = { reactions: { "👍": [BISHOP, BISHOP, SPEAKER] } };
      expect(reactionCount(parseReactions(raw), "👍")).toBe(2);
    });
  });

  describe("mergeReactionsIntoAttributes", () => {
    it("preserves other attribute keys", () => {
      const attrs = { kind: "status-change", status: "confirmed" };
      const r = toggleReaction(EMPTY_REACTIONS, "👍", BISHOP);
      const merged = mergeReactionsIntoAttributes(r, attrs);
      expect(merged.kind).toBe("status-change");
      expect(merged.status).toBe("confirmed");
      expect((merged.reactions as Record<string, string[]>)["👍"]).toEqual([BISHOP]);
    });

    it("removes the reactions key when the overlay is empty", () => {
      const attrs = { kind: "status-change", reactions: { "👍": [BISHOP] } };
      const merged = mergeReactionsIntoAttributes(EMPTY_REACTIONS, attrs);
      expect("reactions" in merged).toBe(false);
      expect(merged.kind).toBe("status-change");
    });

    it("works with null/undefined attrs (no other keys to preserve)", () => {
      const r = toggleReaction(EMPTY_REACTIONS, "👍", BISHOP);
      const merged = mergeReactionsIntoAttributes(r, null);
      expect((merged.reactions as Record<string, string[]>)["👍"]).toEqual([BISHOP]);
    });
  });

  describe("REACTION_PALETTE", () => {
    it("is the cross-platform 6-emoji set in stable order", () => {
      expect(REACTION_PALETTE).toEqual(["👍", "❤️", "🙏", "✅", "😊", "😮"]);
    });
  });
});
