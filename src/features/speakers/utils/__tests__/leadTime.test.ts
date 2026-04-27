import { describe, expect, it } from "vitest";
import { leadTimeSeverity } from "../leadTime";

const TODAY = new Date(2026, 3, 19);

describe("leadTimeSeverity", () => {
  it("returns none when there is more than leadTimeDays left", () => {
    expect(leadTimeSeverity(TODAY, "2026-05-10", 14)).toBe("none");
  });

  it("returns warn between 7 and leadTimeDays", () => {
    expect(leadTimeSeverity(TODAY, "2026-04-30", 14)).toBe("warn");
  });

  it("returns urgent when fewer than 7 days remain", () => {
    expect(leadTimeSeverity(TODAY, "2026-04-23", 14)).toBe("urgent");
  });

  it("treats past dates as urgent", () => {
    expect(leadTimeSeverity(TODAY, "2026-04-10", 14)).toBe("urgent");
  });

  it("respects a custom leadTimeDays threshold", () => {
    expect(leadTimeSeverity(TODAY, "2026-04-30", 10)).toBe("none");
    expect(leadTimeSeverity(TODAY, "2026-04-25", 10)).toBe("urgent");
  });
});
