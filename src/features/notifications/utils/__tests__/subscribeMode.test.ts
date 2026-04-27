import { describe, expect, it } from "vitest";
import { detectMode, type SubscribeModeInput } from "../subscribeMode";

const base: SubscribeModeInput = {
  permission: "default",
  hasTokens: false,
  promptDismissed: false,
  iosNudgeDismissed: false,
  iosNeedsInstall: false,
};

describe("detectMode", () => {
  it("hides when notifications are unsupported", () => {
    expect(detectMode({ ...base, permission: "unsupported" })).toBe("hidden");
  });

  it("shows the iOS nudge before everything else when needed", () => {
    expect(detectMode({ ...base, iosNeedsInstall: true })).toBe("ios-nudge");
  });

  it("hides the iOS nudge once dismissed and falls through to subscribe", () => {
    expect(detectMode({ ...base, iosNeedsInstall: true, iosNudgeDismissed: true })).toBe(
      "subscribe",
    );
  });

  it("returns subscribed when the user already has tokens", () => {
    expect(detectMode({ ...base, hasTokens: true, permission: "granted" })).toBe("subscribed");
  });

  it("hides after the user dismissed and permission is still default", () => {
    expect(detectMode({ ...base, promptDismissed: true })).toBe("hidden");
  });

  it("hides when the user has denied permission", () => {
    expect(detectMode({ ...base, permission: "denied" })).toBe("hidden");
  });

  it("shows subscribe when permission is granted but no token yet", () => {
    expect(detectMode({ ...base, permission: "granted" })).toBe("subscribe");
  });
});
