/** URL + style sanitizers shared by the Lexical letter walker. The
 *  walker renders bishop-authored content into the speaker's browser,
 *  so anything that crosses an HTML attribute (href, src, style) goes
 *  through these allowlists first. The bishopric is treated as
 *  semi-trusted (they author the content) — these helpers exist to
 *  bound what kind of mistake a typo or template paste can produce. */
import type { CSSProperties } from "react";

// `\/(?!\/)` means single leading slash NOT followed by another slash —
// that excludes protocol-relative URLs (`//evil.com` inherits the
// page protocol and points off-origin) while still allowing `/path`
// and bare `/` for same-origin navigation.
const SAFE_URL_PATTERN = /^(https?:\/\/|\/(?!\/))/i;
const SAFE_IMAGE_DATA_PATTERN = /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=]+$/i;

/** True for absolute http(s) URLs and same-origin paths. Any other
 *  scheme (`javascript:`, `data:`, `vbscript:`, etc.) returns false
 *  and the caller should fall back to rendering the text without a
 *  link. */
export function isSafeUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") return false;
  return SAFE_URL_PATTERN.test(url);
}

/** Same as `isSafeUrl` plus base64 data URLs of common raster image
 *  formats. SVG is intentionally excluded — `data:image/svg+xml,…` can
 *  carry a `<script>` payload. */
export function isSafeImageSrc(src: string | undefined | null): boolean {
  if (!src || typeof src !== "string") return false;
  return SAFE_URL_PATTERN.test(src) || SAFE_IMAGE_DATA_PATTERN.test(src);
}

/** Property allowlist for inline `style=` declarations the WYSIWYG
 *  toolbar emits today: text colour, highlight, font size, font
 *  family. Block-level alignment (`textAlign`) and bold/italic are
 *  handled via Lexical's `format` field elsewhere — they don't reach
 *  this helper. Add to this list deliberately when the toolbar starts
 *  producing a new property. */
const ALLOWED_CSS_PROPERTIES = new Set<keyof CSSProperties>([
  "color",
  "backgroundColor",
  "fontSize",
  "fontFamily",
]);

/** Reject specific dangerous tokens — `expression(...)`, `url(...)`,
 *  `@import`, comments, embedded HTML, pseudo schemes — without
 *  blanket-blocking parens (legitimate color values like
 *  `rgb(220, 38, 38)` need them). Modern browsers ignore
 *  `expression()` and `behavior:`, but defence in depth is cheap. */
const UNSAFE_VALUE_PATTERN =
  /[<>]|\/\*|\*\/|expression\s*\(|url\s*\(|@import|javascript:|behavior:/i;

/** Like the previous `parseStyle`, but only properties on the
 *  allowlist with safe-looking values survive. Returns `null` when
 *  nothing valid remains so the caller can omit the `style=` attribute
 *  entirely. */
export function safeStyle(s: string | undefined | null): CSSProperties | null {
  if (!s || typeof s !== "string") return null;
  const out: Record<string, string> = {};
  for (const decl of s.split(";")) {
    const idx = decl.indexOf(":");
    if (idx < 0) continue;
    const rawKey = decl.slice(0, idx).trim();
    const rawValue = decl.slice(idx + 1).trim();
    if (!rawKey || !rawValue) continue;
    const camel = rawKey.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    if (!ALLOWED_CSS_PROPERTIES.has(camel as keyof CSSProperties)) continue;
    if (UNSAFE_VALUE_PATTERN.test(rawValue)) continue;
    out[camel] = rawValue;
  }
  return Object.keys(out).length > 0 ? (out as CSSProperties) : null;
}
