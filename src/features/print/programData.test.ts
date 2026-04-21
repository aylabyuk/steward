import { describe, expect, it } from "vitest";
import type { WithId } from "@/hooks/_sub";
import type { MidItem, SacramentMeeting, Speaker } from "@/lib/types";
import {
  formatLongDate,
  midLabel,
  orderedSpeakers,
  personName,
  speakerSequence,
} from "./programData";

function speaker(
  id: string,
  partial: Partial<Speaker> & { name: string },
): WithId<Speaker> {
  return {
    id,
    data: {
      status: "planned",
      role: "Member",
      ...partial,
    },
  };
}

describe("orderedSpeakers", () => {
  it("sorts by order field, then by id as tiebreaker", () => {
    const list = [
      speaker("c", { name: "C", order: 1 }),
      speaker("a", { name: "A", order: 0 }),
      speaker("b", { name: "B" }), // no order → MAX_SAFE_INTEGER → last
    ];
    const result = orderedSpeakers(list);
    expect(result.map((s) => s.id)).toEqual(["a", "c", "b"]);
  });

  it("breaks ties by id.localeCompare", () => {
    const list = [
      speaker("z", { name: "Z", order: 5 }),
      speaker("a", { name: "A", order: 5 }),
    ];
    expect(orderedSpeakers(list).map((s) => s.id)).toEqual(["a", "z"]);
  });

  it("strips whitespace and null-empties topic", () => {
    const list = [
      speaker("1", { name: "Alice", topic: "  Faith  " }),
      speaker("2", { name: "Bob", topic: "   " }),
      speaker("3", { name: "Carol" }),
    ];
    const result = orderedSpeakers(list);
    expect(result[0]!.topic).toBe("Faith");
    expect(result[1]!.topic).toBeNull();
    expect(result[2]!.topic).toBeNull();
  });

  it("does not mutate the input array", () => {
    const list = [
      speaker("b", { name: "B", order: 2 }),
      speaker("a", { name: "A", order: 1 }),
    ];
    const snapshot = list.map((s) => s.id);
    orderedSpeakers(list);
    expect(list.map((s) => s.id)).toEqual(snapshot);
  });
});

describe("midLabel", () => {
  it("returns null for undefined or none", () => {
    expect(midLabel(undefined)).toBeNull();
    expect(midLabel({ mode: "none", midAfter: 1 })).toBeNull();
  });

  it("formats a rest hymn with number and title", () => {
    const mid: MidItem = {
      mode: "rest",
      rest: { number: 19, title: "We Thank Thee, O God" },
      midAfter: 1,
    };
    expect(midLabel(mid)).toBe("Rest hymn · #19 — We Thank Thee, O God");
  });

  it("returns null for a rest mode with no rest set", () => {
    expect(midLabel({ mode: "rest", midAfter: 1 })).toBeNull();
  });

  it("formats a musical number with performer", () => {
    const mid: MidItem = {
      mode: "musical",
      musical: { performer: "Primary choir" },
      midAfter: 2,
    };
    expect(midLabel(mid)).toBe("Musical number · Primary choir");
  });

  it("returns null for musical mode without a performer", () => {
    expect(midLabel({ mode: "musical", midAfter: 1 })).toBeNull();
    expect(
      midLabel({ mode: "musical", musical: { performer: "" }, midAfter: 1 }),
    ).toBeNull();
  });
});

describe("formatLongDate", () => {
  it("formats a valid ISO date into a human weekday/month/year string", () => {
    // The locale formatter varies slightly across environments; assert
    // against the key tokens rather than an exact string.
    const out = formatLongDate("2026-04-26");
    expect(out).toMatch(/Sunday/);
    expect(out).toMatch(/April/);
    expect(out).toMatch(/2026/);
    expect(out).toMatch(/26/);
  });

  it("returns the input unchanged for malformed dates", () => {
    expect(formatLongDate("not-a-date")).toBe("not-a-date");
    expect(formatLongDate("2026-")).toBe("2026-");
  });
});

describe("personName", () => {
  it("returns the assigned name", () => {
    const meeting = { presiding: { person: { name: "Bishop Paul" }, confirmed: true } };
    expect(personName(meeting.presiding as SacramentMeeting["presiding"])).toBe(
      "Bishop Paul",
    );
  });

  it("returns an empty string when missing", () => {
    expect(personName(undefined)).toBe("");
    expect(
      personName({ person: null, confirmed: false } as SacramentMeeting["presiding"]),
    ).toBe("");
  });
});

const s = (id: string, name: string) => ({ id, name, topic: null });

describe("speakerSequence", () => {

  it("returns speakers only when mid is none", () => {
    const seq = speakerSequence([s("a", "A"), s("b", "B")], undefined);
    expect(seq.map((e) => e.kind)).toEqual(["speaker", "speaker"]);
  });

  it("inserts the mid entry at midAfter", () => {
    const mid: MidItem = {
      mode: "rest",
      rest: { number: 1, title: "X" },
      midAfter: 1,
    };
    const seq = speakerSequence([s("a", "A"), s("b", "B")], mid);
    expect(seq.map((e) => e.kind)).toEqual(["speaker", "mid", "speaker"]);
  });

  it("appends the mid entry when midAfter is past the end", () => {
    const mid: MidItem = {
      mode: "rest",
      rest: { number: 1, title: "X" },
      midAfter: 99,
    };
    const seq = speakerSequence([s("a", "A")], mid);
    expect(seq.map((e) => e.kind)).toEqual(["speaker", "mid"]);
  });

  it("skips the mid entry if the label cannot be formed", () => {
    // musical mode without a performer → midLabel is null → no insertion
    const mid: MidItem = { mode: "musical", midAfter: 1 };
    const seq = speakerSequence([s("a", "A"), s("b", "B")], mid);
    expect(seq.map((e) => e.kind)).toEqual(["speaker", "speaker"]);
  });
});
