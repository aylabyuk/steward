import { describe, expect, it } from "vitest";
import type { SacramentMeeting } from "@/lib/types";
import { copyableFields, hasExistingValues } from "./copyFromPrevious";

const base: SacramentMeeting = {
  meetingType: "regular",
  status: "draft",
  approvals: [],
  wardBusiness: "",
  stakeBusiness: "",
  announcements: "",
};

const personAssignment = {
  person: { name: "Alice" },
  status: "accepted" as const,
};

describe("copyableFields", () => {
  it("copies only pianist / chorister / bread / blessers", () => {
    const src: SacramentMeeting = {
      ...base,
      pianist: personAssignment,
      chorister: personAssignment,
      sacramentBread: personAssignment,
      sacramentBlessers: [personAssignment, personAssignment],
      openingPrayer: personAssignment,
      wardBusiness: "stuff",
    };
    const out = copyableFields(src);
    expect(Object.keys(out).toSorted()).toEqual(
      ["chorister", "pianist", "sacramentBlessers", "sacramentBread"].toSorted(),
    );
  });

  it("skips undefined fields", () => {
    const src: SacramentMeeting = { ...base, pianist: personAssignment };
    expect(Object.keys(copyableFields(src))).toEqual(["pianist"]);
  });
});

describe("hasExistingValues", () => {
  it("returns false for a fresh meeting", () => {
    expect(hasExistingValues(base)).toBe(false);
  });

  it("returns true when any copyable field is set", () => {
    expect(hasExistingValues({ ...base, pianist: personAssignment })).toBe(true);
  });

  it("ignores non-copyable fields", () => {
    expect(hasExistingValues({ ...base, openingPrayer: personAssignment })).toBe(false);
  });
});
