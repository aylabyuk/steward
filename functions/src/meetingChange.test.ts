import { describe, expect, it } from "vitest";
import { classifyMeetingChange, describeChange } from "./meetingChange.js";

describe("classifyMeetingChange", () => {
  it("ignores brand-new docs", () => {
    expect(
      classifyMeetingChange(undefined, { meetingType: "regular", contentVersionHash: "h1" }),
    ).toBeNull();
  });

  it("ignores deletions", () => {
    expect(classifyMeetingChange({ meetingType: "regular" }, undefined)).toBeNull();
  });

  it("ignores stake/general conference Sundays", () => {
    expect(
      classifyMeetingChange(
        { meetingType: "stake" },
        { meetingType: "stake", contentVersionHash: "x" },
      ),
    ).toBeNull();
  });

  it("returns 'cancelled' on cancellation transition", () => {
    expect(
      classifyMeetingChange(
        { meetingType: "regular", contentVersionHash: "h" },
        {
          meetingType: "regular",
          contentVersionHash: "h",
          cancellation: { cancelled: true, reason: "snow" },
        },
      ),
    ).toBe("cancelled");
  });

  it("returns 'uncancelled' on the reverse transition", () => {
    expect(
      classifyMeetingChange(
        {
          meetingType: "regular",
          contentVersionHash: "h",
          cancellation: { cancelled: true },
        },
        { meetingType: "regular", contentVersionHash: "h" },
      ),
    ).toBe("uncancelled");
  });

  it("ignores no-op updates", () => {
    expect(
      classifyMeetingChange(
        { meetingType: "regular", contentVersionHash: "h" },
        { meetingType: "regular", contentVersionHash: "h" },
      ),
    ).toBeNull();
  });

  it("returns 'updated' on hash change", () => {
    expect(
      classifyMeetingChange(
        { meetingType: "regular", contentVersionHash: "a" },
        { meetingType: "regular", contentVersionHash: "b" },
      ),
    ).toBe("updated");
  });
});

describe("describeChange", () => {
  it("includes the cancellation reason when set", () => {
    expect(describeChange("cancelled", { cancellation: { cancelled: true, reason: "snow" } })).toBe(
      "Meeting cancelled — snow",
    );
  });

  it("falls back when no reason was provided", () => {
    expect(describeChange("cancelled", { cancellation: { cancelled: true } })).toBe(
      "Meeting cancelled",
    );
  });
});
