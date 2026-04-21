import { describe, expect, it } from "vitest";
import { kindLabel } from "./kindLabel";

describe("kindLabel", () => {
  it("maps regular with no badge or stamp", () => {
    const info = kindLabel("regular");
    expect(info.variant).toBe("regular");
    expect(info.isSpecial).toBe(false);
    expect(info.badge).toBe("");
  });

  it("maps fast with testimony stamp", () => {
    const info = kindLabel("fast");
    expect(info.variant).toBe("fast");
    expect(info.isSpecial).toBe(true);
    expect(info.badge).toBe("Fast Sunday");
    expect(info.stampLabel).toMatch(/testimony/i);
  });

  it("maps stake with conference badge and stake-wide stamp", () => {
    const info = kindLabel("stake");
    expect(info.variant).toBe("stake");
    expect(info.isSpecial).toBe(true);
    expect(info.badge).toBe("Stake Conference");
    expect(info.description).toMatch(/stake-wide/i);
  });

  it("maps general with conference badge and general session stamp", () => {
    const info = kindLabel("general");
    expect(info.variant).toBe("general");
    expect(info.isSpecial).toBe(true);
    expect(info.badge).toBe("General Conference");
  });
});
