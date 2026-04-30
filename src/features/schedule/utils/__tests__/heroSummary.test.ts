import { describe, expect, it } from "vitest";
import { computeHeroSummary } from "../heroSummary";

const base = {
  speakerCount: 0,
  speakerConfirmedCount: 0,
  prayerAssignedCount: 0,
  prayerConfirmedCount: 0,
};

describe("computeHeroSummary", () => {
  describe("regular Sundays", () => {
    it("returns 'No speakers assigned yet' when empty", () => {
      expect(computeHeroSummary({ ...base, variant: "regular" })).toBe("No speakers assigned yet");
    });

    it("returns 'X of Y' when partially confirmed", () => {
      expect(
        computeHeroSummary({
          ...base,
          variant: "regular",
          speakerCount: 4,
          speakerConfirmedCount: 2,
        }),
      ).toBe("2 of 4 speakers confirmed");
    });

    it("returns 'All speakers confirmed' when all are confirmed", () => {
      expect(
        computeHeroSummary({
          ...base,
          variant: "regular",
          speakerCount: 3,
          speakerConfirmedCount: 3,
        }),
      ).toBe("All speakers confirmed");
    });

    it("returns 'X of Y' when zero confirmed but some assigned", () => {
      expect(
        computeHeroSummary({
          ...base,
          variant: "regular",
          speakerCount: 2,
          speakerConfirmedCount: 0,
        }),
      ).toBe("0 of 2 speakers confirmed");
    });
  });

  describe("fast Sundays", () => {
    it("returns 'No prayers assigned yet' when both empty", () => {
      expect(computeHeroSummary({ ...base, variant: "fast" })).toBe("No prayers assigned yet");
    });

    it("returns 'X of 2' when partially confirmed", () => {
      expect(
        computeHeroSummary({
          ...base,
          variant: "fast",
          prayerAssignedCount: 2,
          prayerConfirmedCount: 1,
        }),
      ).toBe("1 of 2 prayers confirmed");
    });

    it("returns 'Both prayers confirmed' when both confirmed", () => {
      expect(
        computeHeroSummary({
          ...base,
          variant: "fast",
          prayerAssignedCount: 2,
          prayerConfirmedCount: 2,
        }),
      ).toBe("Both prayers confirmed");
    });

    it("returns 'X of 2' when only one assigned", () => {
      expect(
        computeHeroSummary({
          ...base,
          variant: "fast",
          prayerAssignedCount: 1,
          prayerConfirmedCount: 0,
        }),
      ).toBe("0 of 2 prayers confirmed");
    });
  });

  describe("stake / general", () => {
    it("returns null for stake conferences", () => {
      expect(computeHeroSummary({ ...base, variant: "stake" })).toBeNull();
    });
    it("returns null for general conferences", () => {
      expect(computeHeroSummary({ ...base, variant: "general" })).toBeNull();
    });
  });
});
