import { describe, expect, it } from "vitest";
import { formatHistoryEvent } from "../historyFormat";

describe("formatHistoryEvent", () => {
  it("formats a hymn change with field labels", () => {
    const out = formatHistoryEvent({
      actorDisplayName: "Alice",
      target: "meeting",
      action: "update",
      changes: [
        {
          field: "openingHymn",
          old: { number: 1, title: "The Morning Breaks" },
          new: { number: 2, title: "The Spirit of God" },
        },
      ],
    });
    expect(out.summary).toBe("Alice updated the meeting");
    expect(out.details[0]).toBe("Opening hymn: #1 The Morning Breaks → #2 The Spirit of God");
  });

  it("formats a comment create without details", () => {
    const out = formatHistoryEvent({
      actorDisplayName: "Bob",
      target: "comment",
      action: "create",
      changes: [],
    });
    expect(out.summary).toBe("Bob posted a comment");
    expect(out.details).toEqual([]);
  });

  it("includes status in assignment value labels", () => {
    const out = formatHistoryEvent({
      actorDisplayName: "Alice",
      target: "meeting",
      action: "update",
      changes: [
        {
          field: "openingPrayer",
          old: { person: { name: "Fred" }, status: "not_assigned" },
          new: { person: { name: "Fred" }, status: "accepted" },
        },
      ],
    });
    expect(out.details[0]).toBe("Opening Prayer: Fred (not assigned) → Fred (accepted)");
  });

  it("formats an approval", () => {
    const out = formatHistoryEvent({
      actorDisplayName: "Carol",
      target: "approval",
      action: "create",
      changes: [{ field: "live", new: 2 }],
    });
    expect(out.summary).toBe("Carol approved the meeting");
    expect(out.details[0]).toBe("Live approvals: 2");
  });

  it("truncates very long string values", () => {
    const out = formatHistoryEvent({
      actorDisplayName: "Dan",
      target: "meeting",
      action: "update",
      changes: [{ field: "wardBusiness", old: "x".repeat(80), new: "y".repeat(80) }],
    });
    expect(out.details[0]).toContain("…");
  });
});
