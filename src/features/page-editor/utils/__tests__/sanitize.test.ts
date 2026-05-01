import { describe, expect, it } from "vitest";
import { isSafeImageSrc, isSafeUrl, safeStyle } from "../sanitize";

describe("isSafeUrl", () => {
  it.each([
    "https://example.com",
    "https://example.com/path?query=1#hash",
    "http://example.com",
    "HTTP://EXAMPLE.COM",
    "/relative/path",
    "/",
  ])("accepts %s", (url) => {
    expect(isSafeUrl(url)).toBe(true);
  });

  it.each([
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "about:blank",
    "tel:+1234567890",
    "mailto:bad@example.com",
    "//evil.com",
    "ftp://example.com",
    "",
    " ",
  ])("rejects %s", (url) => {
    expect(isSafeUrl(url)).toBe(false);
  });

  it("rejects null / undefined / non-string", () => {
    expect(isSafeUrl(null)).toBe(false);
    expect(isSafeUrl(undefined)).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isSafeUrl(123 as unknown as string)).toBe(false);
  });
});

describe("isSafeImageSrc", () => {
  it("accepts the same URL shapes as isSafeUrl", () => {
    expect(isSafeImageSrc("https://example.com/img.png")).toBe(true);
    expect(isSafeImageSrc("/local/img.jpg")).toBe(true);
  });

  it.each([
    "data:image/png;base64,iVBORw0KGgo=",
    "data:image/jpeg;base64,abcdef==",
    "data:image/jpg;base64,abcdef",
    "data:image/gif;base64,abc=",
    "data:image/webp;base64,abc/+/=",
  ])("accepts base64 raster %s", (src) => {
    expect(isSafeImageSrc(src)).toBe(true);
  });

  it.each([
    // SVG can carry <script>
    "data:image/svg+xml,<svg onload=alert(1)></svg>",
    "data:image/svg+xml;base64,abc",
    // Non-image data URLs
    "data:text/html;base64,abc",
    "data:application/javascript,alert(1)",
    // javascript: still a no
    "javascript:alert(1)",
  ])("rejects %s", (src) => {
    expect(isSafeImageSrc(src)).toBe(false);
  });
});

describe("safeStyle", () => {
  it("passes allowlisted properties through", () => {
    expect(
      safeStyle("color: red; background-color: #fff; font-size: 16px; font-family: serif"),
    ).toEqual({
      color: "red",
      backgroundColor: "#fff",
      fontSize: "16px",
      fontFamily: "serif",
    });
  });

  it("camel-cases hyphenated property names", () => {
    expect(safeStyle("background-color: yellow")).toEqual({ backgroundColor: "yellow" });
    expect(safeStyle("font-size: 14px")).toEqual({ fontSize: "14px" });
  });

  it("drops properties not on the allowlist", () => {
    expect(safeStyle("color: red; position: fixed; top: 0; z-index: 9999")).toEqual({
      color: "red",
    });
  });

  it.each([
    "color: expression(alert(1))",
    "color: expression (alert(1))", // whitespace before paren
    "color: javascript:alert(1)",
    "background-color: url('http://evil.com/cookie?')",
    "color: <script>",
    "color: behavior: url(#x)",
    "background-image: @import url(evil.css)",
  ])("rejects unsafe value %s", (input) => {
    expect(safeStyle(input)).toBeNull();
  });

  it.each([
    "color: rgb(220, 38, 38)",
    "color: rgba(255, 0, 0, 0.5)",
    "background-color: hsl(120, 100%, 50%)",
    "color: var(--brand-red)",
    "font-size: calc(1rem + 2px)",
  ])("allows legitimate CSS function value %s", (input) => {
    expect(safeStyle(input)).not.toBeNull();
  });

  it("salvages safe declarations alongside malformed ones", () => {
    // The /* comment */ fragment has no key:value pair so it's
    // dropped by the parser (no colon to split on) — the safe
    // `color: red` survives.
    expect(safeStyle("color: red; /* comment */")).toEqual({ color: "red" });
  });

  it("returns null for empty / undefined / declaration-free input", () => {
    expect(safeStyle("")).toBeNull();
    expect(safeStyle(undefined)).toBeNull();
    expect(safeStyle(null)).toBeNull();
    expect(safeStyle(";;;")).toBeNull();
    expect(safeStyle(":")).toBeNull();
    expect(safeStyle("nope")).toBeNull();
  });

  it("preserves safe declarations even when adjacent ones are unsafe", () => {
    // The unsafe `position` is dropped (not on allowlist); the safe
    // `color` survives.
    expect(safeStyle("position: fixed; color: blue")).toEqual({ color: "blue" });
  });

  it("trims whitespace around keys and values", () => {
    expect(safeStyle("  color  :   red  ")).toEqual({ color: "red" });
  });

  it("handles values containing colons (e.g. url paths in a hypothetical future allow)", () => {
    // font-family with a multi-word name should keep the full value.
    expect(safeStyle('font-family: "Helvetica Neue", sans-serif')).toEqual({
      fontFamily: '"Helvetica Neue", sans-serif',
    });
  });
});
