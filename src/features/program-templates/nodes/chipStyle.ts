import type { TextFormatType } from "lexical";

// Lexical's text-format bitmask constants — re-exported here so the
// chip's class file, its React decorator, and the format-routing
// plugin can all reference one source.
export const FORMAT_BOLD = 1;
export const FORMAT_ITALIC = 2;
export const FORMAT_STRIKE = 4;
export const FORMAT_UNDERLINE = 8;
export const FORMAT_CODE = 16;

export function variableChipFormatBit(type: TextFormatType): number {
  switch (type) {
    case "bold":
      return FORMAT_BOLD;
    case "italic":
      return FORMAT_ITALIC;
    case "strikethrough":
      return FORMAT_STRIKE;
    case "underline":
      return FORMAT_UNDERLINE;
    case "code":
      return FORMAT_CODE;
    case "subscript":
      return 32;
    case "superscript":
      return 64;
    default:
      return 0;
  }
}

/** Tiny style-string helpers shared by `VariableChipNode` and its
 *  React decorator. Lifted to a module so the chip's class file +
 *  the decorator file each stay under the per-file LOC cap. */
export function parseStyleString(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const decl of s.split(";")) {
    const idx = decl.indexOf(":");
    if (idx < 0) continue;
    const k = decl.slice(0, idx).trim();
    const v = decl.slice(idx + 1).trim();
    if (k && v) out[k] = v;
  }
  return out;
}

export function stringifyStyle(obj: Record<string, string>): string {
  return Object.entries(obj)
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ");
}

export function styleStringToReact(s: string): React.CSSProperties {
  const obj = parseStyleString(s);
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const camel = k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    out[camel] = v;
  }
  return out as React.CSSProperties;
}
