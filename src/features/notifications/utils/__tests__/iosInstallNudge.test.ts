import { describe, expect, it } from "vitest";
import { isIosSafari, shouldShowIosNudge } from "../iosInstallNudge";

const SAFARI_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const CHROME_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0 Mobile/15E148 Safari/604.1";
const CHROME_DESKTOP =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

describe("isIosSafari", () => {
  it("matches Mobile Safari on iOS", () => {
    expect(isIosSafari(SAFARI_IPHONE)).toBe(true);
  });

  it("rejects Chrome on iOS (CriOS)", () => {
    expect(isIosSafari(CHROME_IPHONE)).toBe(false);
  });

  it("rejects desktop Chrome (also has 'Safari' in UA)", () => {
    expect(isIosSafari(CHROME_DESKTOP)).toBe(false);
  });
});

describe("shouldShowIosNudge", () => {
  it("shows the nudge on iOS Safari outside a PWA", () => {
    expect(shouldShowIosNudge({ userAgent: SAFARI_IPHONE, isStandalone: false })).toBe(true);
  });

  it("hides the nudge once installed (standalone)", () => {
    expect(shouldShowIosNudge({ userAgent: SAFARI_IPHONE, isStandalone: true })).toBe(false);
  });

  it("hides the nudge on non-iOS browsers", () => {
    expect(shouldShowIosNudge({ userAgent: CHROME_DESKTOP, isStandalone: false })).toBe(false);
  });
});
