import { describe, expect, it } from "vitest";
import type { WithId } from "@/hooks/_sub";
import type { MidItem, Speaker } from "@/lib/types";
import { buildItems, formatMidLabel, sortByOrder } from "../speakerListItems";

function speaker(id: string, order?: number): WithId<Speaker> {
  return {
    id,
    data: {
      name: id,
      status: "planned",
      role: "Member",
      ...(order !== undefined ? { order } : {}),
    },
  };
}

describe("sortByOrder", () => {
  it("sorts by order then by id", () => {
    const list = [speaker("z", 2), speaker("a", 1), speaker("b")];
    expect(sortByOrder(list).map((s) => s.id)).toEqual(["a", "z", "b"]);
  });

  it("breaks ties with id.localeCompare", () => {
    const list = [speaker("b", 1), speaker("a", 1)];
    expect(sortByOrder(list).map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("returns a new array (does not mutate input)", () => {
    const list = [speaker("c", 2), speaker("a", 1)];
    const out = sortByOrder(list);
    expect(out).not.toBe(list);
    expect(list.map((s) => s.id)).toEqual(["c", "a"]);
  });
});

describe("formatMidLabel", () => {
  it("returns empty for none / undefined", () => {
    expect(formatMidLabel(undefined)).toBe("");
    expect(formatMidLabel({ mode: "none", midAfter: 1 })).toBe("");
  });

  it("formats a rest hymn", () => {
    const mid: MidItem = {
      mode: "rest",
      rest: { number: 19, title: "We Thank Thee, O God" },
      midAfter: 1,
    };
    expect(formatMidLabel(mid)).toBe("Rest hymn · 19 — We Thank Thee, O God");
  });

  it("prompts the user when a rest hymn is selected but not picked", () => {
    expect(formatMidLabel({ mode: "rest", midAfter: 1 })).toBe("Rest hymn — pick a hymn");
  });

  it("formats a musical number with performer", () => {
    const mid: MidItem = {
      mode: "musical",
      musical: { performer: "Primary choir" },
      midAfter: 1,
    };
    expect(formatMidLabel(mid)).toBe("Musical number · Primary choir");
  });

  it("prompts the user when a musical number is selected with no performer", () => {
    expect(formatMidLabel({ mode: "musical", midAfter: 1 })).toBe("Musical number — add performer");
  });
});

describe("buildItems", () => {
  it("returns only speakers when label is empty", () => {
    const items = buildItems([speaker("a"), speaker("b")], undefined, "");
    expect(items.map((i) => i.kind)).toEqual(["speaker", "speaker"]);
  });

  it("inserts the mid entry at midAfter", () => {
    const mid: MidItem = {
      mode: "rest",
      rest: { number: 1, title: "X" },
      midAfter: 1,
    };
    const items = buildItems([speaker("a"), speaker("b")], mid, "Rest hymn · 1 — X");
    expect(items.map((i) => i.kind)).toEqual(["speaker", "mid", "speaker"]);
  });

  it("clamps a negative midAfter to 0 (mid appears first)", () => {
    const mid: MidItem = {
      mode: "rest",
      rest: { number: 1, title: "X" },
      midAfter: -5,
    };
    const items = buildItems([speaker("a"), speaker("b")], mid, "Rest hymn");
    expect(items.map((i) => i.kind)).toEqual(["mid", "speaker", "speaker"]);
  });

  it("appends the mid entry when midAfter is beyond the list", () => {
    const mid: MidItem = {
      mode: "rest",
      rest: { number: 1, title: "X" },
      midAfter: 99,
    };
    const items = buildItems([speaker("a")], mid, "Rest hymn");
    expect(items.map((i) => i.kind)).toEqual(["speaker", "mid"]);
  });

  it("does not add mid when mode is none even if midLabel is non-empty", () => {
    const mid: MidItem = { mode: "none", midAfter: 1 };
    const items = buildItems([speaker("a")], mid, "Should not appear");
    expect(items.map((i) => i.kind)).toEqual(["speaker"]);
  });
});
