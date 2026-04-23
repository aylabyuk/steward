/** Browsers expose `navigator.userAgentData` (Chromium) and/or the
 *  legacy `navigator.userAgent` string. Both are lies — the UA string
 *  is spoofable and Apple/Firefox don't yet ship UA-CH. This parser
 *  produces a friendly `{browser} · {os}` label with reasonable
 *  fallbacks; it's display-only, never used for feature-gating. */

interface UaBrand {
  brand: string;
  version: string;
}

export interface NavigatorLike {
  userAgent: string;
  userAgentData?: {
    brands?: UaBrand[];
    platform?: string;
    mobile?: boolean;
  };
}

export function deriveDeviceName(nav: NavigatorLike): string {
  const browser = detectBrowser(nav);
  const os = detectOs(nav);
  return `${browser} · ${os}`;
}

function detectBrowser(nav: NavigatorLike): string {
  const brands = nav.userAgentData?.brands;
  if (brands && brands.length > 0) {
    // Prefer real brand names over filler ("Not.A/Brand") and the
    // Chromium base. Edge and Opera ship both their own brand and
    // Chromium, so iteration order matters.
    const preferred = ["Microsoft Edge", "Opera", "Google Chrome", "Chromium"];
    for (const name of preferred) {
      if (brands.some((b) => b.brand === name)) return name === "Google Chrome" ? "Chrome" : name;
    }
  }
  const ua = nav.userAgent;
  if (/Edg\//.test(ua)) return "Microsoft Edge";
  if (/OPR\//.test(ua)) return "Opera";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua)) return "Safari";
  return "Browser";
}

function detectOs(nav: NavigatorLike): string {
  const platform = nav.userAgentData?.platform;
  if (platform) {
    // UA-CH returns "macOS", "Windows", "Linux", "Android", "ChromeOS", etc.
    if (platform === "macOS") return "macOS";
    if (platform === "Windows") return "Windows";
    if (platform === "Android") return "Android";
    if (platform === "Chrome OS" || platform === "ChromeOS") return "ChromeOS";
    if (platform === "Linux") return "Linux";
  }
  const ua = nav.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  if (/Android/.test(ua)) return "Android";
  if (/Mac OS X|Macintosh/.test(ua)) return "macOS";
  if (/Windows/.test(ua)) return "Windows";
  if (/CrOS/.test(ua)) return "ChromeOS";
  if (/Linux/.test(ua)) return "Linux";
  return "Unknown";
}
