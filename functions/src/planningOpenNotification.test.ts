import { describe, expect, it } from "vitest";
import { shouldFirePlanningOpen } from "./planningOpenNotification.js";

const TZ = "America/Los_Angeles";

describe("shouldFirePlanningOpen", () => {
  // 2026-04-20 is a Monday. 15:00Z = 08:00 PDT.
  const monday8am = new Date("2026-04-20T15:00:00Z");
  const monday7am = new Date("2026-04-20T14:00:00Z");
  const monday9am = new Date("2026-04-20T16:00:00Z");
  const tuesday8am = new Date("2026-04-21T15:00:00Z");

  it("fires on Monday 8am ward-local for a fresh upcoming Sunday", () => {
    expect(shouldFirePlanningOpen(monday8am, TZ, undefined, "2026-04-26")).toBe(true);
  });

  it("does not fire before 8am Monday", () => {
    expect(shouldFirePlanningOpen(monday7am, TZ, undefined, "2026-04-26")).toBe(false);
  });

  it("does not fire after 8am Monday", () => {
    expect(shouldFirePlanningOpen(monday9am, TZ, undefined, "2026-04-26")).toBe(false);
  });

  it("does not fire on a non-Monday", () => {
    expect(shouldFirePlanningOpen(tuesday8am, TZ, undefined, "2026-04-26")).toBe(false);
  });

  it("respects the ward timezone (Mon 8am PT vs Mon 8am ET)", () => {
    // 13:00Z = 08:00 ET on Mon 2026-04-20 (and 06:00 PT on the same day).
    const mondayEast8am = new Date("2026-04-20T12:00:00Z");
    expect(shouldFirePlanningOpen(mondayEast8am, "America/New_York", undefined, "2026-04-26")).toBe(
      true,
    );
    expect(
      shouldFirePlanningOpen(mondayEast8am, "America/Los_Angeles", undefined, "2026-04-26"),
    ).toBe(false);
  });

  it("is idempotent — skips when lastPlanningOpenNotified matches the upcoming Sunday", () => {
    expect(shouldFirePlanningOpen(monday8am, TZ, "2026-04-26", "2026-04-26")).toBe(false);
  });

  it("re-fires once the upcoming Sunday rolls over (lastNotified now stale)", () => {
    // A week later: 2026-04-27 is the next Monday. lastNotified is the
    // previous week's Sunday — still stale relative to the new upcoming.
    const nextMonday8am = new Date("2026-04-27T15:00:00Z");
    expect(shouldFirePlanningOpen(nextMonday8am, TZ, "2026-04-26", "2026-05-03")).toBe(true);
  });
});
