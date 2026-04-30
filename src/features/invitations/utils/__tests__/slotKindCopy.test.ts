import { describe, expect, it } from "vitest";
import { assigneeAction, assigneeNoun, assigneeNounLower } from "../slotKindCopy";

describe("slotKindCopy", () => {
  it("speaker kind keeps the existing copy", () => {
    expect(assigneeNoun("speaker")).toBe("Speaker");
    expect(assigneeNounLower("speaker")).toBe("speaker");
    expect(assigneeAction("speaker")).toBe("speaking");
  });

  it("prayer kind switches to prayer-giver copy", () => {
    expect(assigneeNoun("prayer")).toBe("Prayer giver");
    expect(assigneeNounLower("prayer")).toBe("prayer giver");
    expect(assigneeAction("prayer")).toBe("offering the prayer");
  });

  it("undefined kind defaults to speaker copy (back-compat)", () => {
    expect(assigneeNoun(undefined)).toBe("Speaker");
    expect(assigneeNounLower(undefined)).toBe("speaker");
    expect(assigneeAction(undefined)).toBe("speaking");
  });
});
