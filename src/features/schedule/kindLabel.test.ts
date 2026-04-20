import { describe, expect, it } from "vitest";
import { kindLabel } from "./kindLabel";

describe("kindLabel", () => {
  it("maps regular to regular variant", () => {
    const info = kindLabel("regular");
    expect(info.label).toBe("Regular");
    expect(info.variant).toBe("regular");
  });

  it("maps fast to fast variant", () => {
    const info = kindLabel("fast");
    expect(info.label).toBe("Fast Sunday");
    expect(info.variant).toBe("fast");
  });

  it("maps stake to noMeeting variant", () => {
    const info = kindLabel("stake");
    expect(info.label).toBe("Stake");
    expect(info.variant).toBe("noMeeting");
  });

  it("maps general to noMeeting variant", () => {
    const info = kindLabel("general");
    expect(info.label).toBe("General");
    expect(info.variant).toBe("noMeeting");
  });
});
