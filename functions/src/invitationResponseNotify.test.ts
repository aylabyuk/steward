import { describe, expect, it } from "vitest";
import { composeResponseNotification } from "./invitationResponseNotify.js";

describe("composeResponseNotification", () => {
  const base = { speakerName: "Brother Smith", meetingDate: "2026-05-10" } as const;

  it("phrases a fresh Yes with a short date", () => {
    const p = composeResponseNotification({
      ...base,
      prevAnswer: undefined,
      nextAnswer: "yes",
    });
    expect(p.title).toBe("Brother Smith accepted");
    expect(p.body).toBe("Sun, May 10");
  });

  it("phrases a fresh No without a reason", () => {
    const p = composeResponseNotification({
      ...base,
      prevAnswer: undefined,
      nextAnswer: "no",
    });
    expect(p.title).toBe("Brother Smith declined");
    expect(p.body).toBe("Sun, May 10");
  });

  it("includes the reason when a fresh No has one", () => {
    const p = composeResponseNotification({
      ...base,
      prevAnswer: undefined,
      nextAnswer: "no",
      reason: "out of town that weekend",
    });
    expect(p.title).toBe("Brother Smith declined");
    expect(p.body).toBe('"out of town that weekend" — Sun, May 10');
  });

  it("ignores blank/whitespace-only reasons", () => {
    const p = composeResponseNotification({
      ...base,
      prevAnswer: undefined,
      nextAnswer: "no",
      reason: "   ",
    });
    expect(p.body).toBe("Sun, May 10");
  });

  it("phrases a yes → no flip as 'changed response to No'", () => {
    const p = composeResponseNotification({
      ...base,
      prevAnswer: "yes",
      nextAnswer: "no",
      reason: "sick",
    });
    expect(p.title).toBe("Brother Smith changed response to No");
    // Flip omits the reason — the title leads with "changed" and the
    // bishopric already has the prior answer in context.
    expect(p.body).toBe("Sun, May 10");
  });

  it("phrases a no → yes flip as 'changed response to Yes'", () => {
    const p = composeResponseNotification({
      ...base,
      prevAnswer: "no",
      nextAnswer: "yes",
    });
    expect(p.title).toBe("Brother Smith changed response to Yes");
    expect(p.body).toBe("Sun, May 10");
  });

  it("falls back to the raw meetingDate on an unparseable input", () => {
    const p = composeResponseNotification({
      speakerName: "A",
      meetingDate: "not-a-date",
      prevAnswer: undefined,
      nextAnswer: "yes",
    });
    expect(p.body).toBe("not-a-date");
  });

  it("renders the date in UTC so timezone can't skew the weekday", () => {
    // 2026-05-10 is a Sunday in UTC; we format in UTC to preserve that.
    const p = composeResponseNotification({
      speakerName: "A",
      meetingDate: "2026-05-10",
      prevAnswer: undefined,
      nextAnswer: "yes",
    });
    expect(p.body).toMatch(/^Sun,/);
  });
});
