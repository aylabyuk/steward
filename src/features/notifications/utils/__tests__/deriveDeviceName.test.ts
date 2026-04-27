import { describe, expect, it } from "vitest";
import { deriveDeviceName, type NavigatorLike } from "../deriveDeviceName";

describe("deriveDeviceName — UA-CH (Chromium) path", () => {
  it("recognizes Chrome on macOS from userAgentData", () => {
    const nav: NavigatorLike = {
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
      userAgentData: {
        brands: [
          { brand: "Google Chrome", version: "129" },
          { brand: "Chromium", version: "129" },
          { brand: "Not.A/Brand", version: "99" },
        ],
        platform: "macOS",
        mobile: false,
      },
    };
    expect(deriveDeviceName(nav)).toBe("Chrome · macOS");
  });

  it("prefers Microsoft Edge over Chromium when both brands are present", () => {
    const nav: NavigatorLike = {
      userAgent: "Mozilla/5.0 … Edg/130.0.0.0",
      userAgentData: {
        brands: [
          { brand: "Chromium", version: "130" },
          { brand: "Not.A/Brand", version: "99" },
          { brand: "Microsoft Edge", version: "130" },
        ],
        platform: "Windows",
      },
    };
    expect(deriveDeviceName(nav)).toBe("Microsoft Edge · Windows");
  });

  it("recognizes Chrome on Android", () => {
    const nav: NavigatorLike = {
      userAgent:
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/129.0.0.0 Mobile Safari/537.36",
      userAgentData: {
        brands: [{ brand: "Google Chrome", version: "129" }],
        platform: "Android",
        mobile: true,
      },
    };
    expect(deriveDeviceName(nav)).toBe("Chrome · Android");
  });

  it("skips filler brands like Not.A/Brand when picking the browser name", () => {
    const nav: NavigatorLike = {
      userAgent: "Mozilla/5.0 …",
      userAgentData: {
        brands: [{ brand: "Not.A/Brand", version: "99" }],
        platform: "Linux",
      },
    };
    // With no real brand name, falls back to UA string — which has nothing either, so "Browser".
    expect(deriveDeviceName(nav)).toBe("Browser · Linux");
  });
});

describe("deriveDeviceName — legacy UA fallback", () => {
  it("recognizes Safari on iOS", () => {
    const nav: NavigatorLike = {
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    };
    expect(deriveDeviceName(nav)).toBe("Safari · iOS");
  });

  it("recognizes Firefox on Windows", () => {
    const nav: NavigatorLike = {
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0",
    };
    expect(deriveDeviceName(nav)).toBe("Firefox · Windows");
  });

  it("recognizes Safari on macOS (not the also-present Chrome token)", () => {
    // Apple's Safari UA includes "Safari/…" but not "Chrome/…"
    const nav: NavigatorLike = {
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15",
    };
    expect(deriveDeviceName(nav)).toBe("Safari · macOS");
  });

  it("recognizes iPad as iOS", () => {
    const nav: NavigatorLike = {
      userAgent:
        "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    };
    expect(deriveDeviceName(nav)).toBe("Safari · iOS");
  });

  it("falls back to Browser · Unknown when nothing matches", () => {
    const nav: NavigatorLike = { userAgent: "SomeCustomAgent/1.0" };
    expect(deriveDeviceName(nav)).toBe("Browser · Unknown");
  });
});
