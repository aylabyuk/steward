import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatCountdown, formatCountdownCompact } from "../dateFormat";

// Anchor "today" to a fixed local-midnight Sunday so the date-math
// branches are deterministic regardless of when CI runs.
const TODAY = new Date(2026, 4, 3); // 2026-05-03, Sunday

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(TODAY);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("formatCountdown (verbose)", () => {
  it.each([
    ["2026-05-02", "Past"],
    ["2026-05-03", "Today"],
    ["2026-05-04", "In 1 day"],
    ["2026-05-09", "In 6 days"],
    ["2026-05-10", "In 1 week"],
    ["2026-05-11", "In 1 week and 1 day"],
    ["2026-05-17", "In 2 weeks"],
    ["2026-05-20", "In 2 weeks and 3 days"],
    ["2026-05-24", "In 3 weeks"],
    ["2026-05-25", "In 3 weeks and 1 day"],
  ])("%s -> %s", (iso, expected) => {
    expect(formatCountdown(iso)).toBe(expected);
  });

  it("returns the raw string for unparseable input", () => {
    expect(formatCountdown("not-a-date")).toBe("not-a-date");
  });
});

describe("formatCountdownCompact", () => {
  it.each([
    ["2026-05-02", "Past"],
    ["2026-05-03", "Today"],
    ["2026-05-04", "In 1d"],
    ["2026-05-09", "In 6d"],
    ["2026-05-10", "In 1w"],
    ["2026-05-11", "In 1w 1d"],
    ["2026-05-17", "In 2w"],
    ["2026-05-20", "In 2w 3d"],
    ["2026-05-24", "In 3w"],
  ])("%s -> %s", (iso, expected) => {
    expect(formatCountdownCompact(iso)).toBe(expected);
  });
});
