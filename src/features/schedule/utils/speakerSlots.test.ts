import { describe, expect, it } from "vitest";
import { canAddAnotherSpeaker, speakerPlaceholderCount } from "./speakerSlots";

describe("speakerPlaceholderCount", () => {
  // The card rests on a 2-row visual floor so a fresh meeting reads
  // as "two slots inviting action" rather than a single lonely row.
  it("pads up to the floor when the assigned count is below it", () => {
    expect(speakerPlaceholderCount(0)).toBe(2);
    expect(speakerPlaceholderCount(1)).toBe(1);
  });

  // Once the floor is met, no more padding — the card grows row-by-row
  // with the actual speakers.
  it("returns 0 when the assigned count is at or above the floor", () => {
    expect(speakerPlaceholderCount(2)).toBe(0);
    expect(speakerPlaceholderCount(3)).toBe(0);
    expect(speakerPlaceholderCount(4)).toBe(0);
    expect(speakerPlaceholderCount(7)).toBe(0);
  });
});

describe("canAddAnotherSpeaker", () => {
  // Below the floor the empty placeholder slots already invite the
  // bishop to assign — a second add affordance would be redundant.
  it("is false below the floor", () => {
    expect(canAddAnotherSpeaker(0)).toBe(false);
    expect(canAddAnotherSpeaker(1)).toBe(false);
  });

  // Between floor and ceiling: the explicit "+ Add another speaker"
  // row appears so the bishop can grow the roster past the typical
  // count without first staring at empty slots.
  it("is true between floor and ceiling", () => {
    expect(canAddAnotherSpeaker(2)).toBe(true);
    expect(canAddAnotherSpeaker(3)).toBe(true);
  });

  // At or above the ceiling: no add affordance — the card stops
  // growing visually. (Existing rosters with more docs still render
  // every speaker; the cap only governs the explicit add button.)
  it("is false at or above the ceiling", () => {
    expect(canAddAnotherSpeaker(4)).toBe(false);
    expect(canAddAnotherSpeaker(5)).toBe(false);
    expect(canAddAnotherSpeaker(7)).toBe(false);
  });
});
