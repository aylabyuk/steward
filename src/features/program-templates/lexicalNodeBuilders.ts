/* Tiny serialised-Lexical-node builders. Use these to author a
 * default editor state in source as a tree of typed objects rather
 * than hand-typing the whole SerializedEditorState blob — keeps each
 * default template short, inspectable, and easy to extend. */

export interface JsonNode {
  type: string;
  version: number;
  [key: string]: unknown;
}

const COMMON = { format: "", indent: 0, direction: null } as const;
const TEXT_BASE = { format: 0, mode: "normal", style: "", detail: 0 } as const;

export const text = (value: string, format: 0 | 1 | 2 | 3 = 0): JsonNode => ({
  type: "text",
  version: 1,
  ...TEXT_BASE,
  text: value,
  format,
});
export const bold = (value: string) => text(value, 1);
export const italic = (value: string) => text(value, 2);
export const chip = (token: string): JsonNode => ({ type: "variable-chip", version: 1, token });
export const p = (...children: JsonNode[]): JsonNode => ({
  type: "paragraph",
  version: 1,
  ...COMMON,
  children,
});
export const h = (level: 1 | 2 | 3, ...children: JsonNode[]): JsonNode => ({
  type: "heading",
  version: 1,
  ...COMMON,
  tag: `h${level}`,
  children,
});
export const quote = (...children: JsonNode[]): JsonNode => ({
  type: "quote",
  version: 1,
  ...COMMON,
  children,
});
export const li = (...children: JsonNode[]): JsonNode => ({
  type: "listitem",
  version: 1,
  ...COMMON,
  value: 1,
  children,
});
export const ul = (...items: JsonNode[]): JsonNode => ({
  type: "list",
  version: 1,
  ...COMMON,
  listType: "bullet",
  start: 1,
  tag: "ul",
  children: items,
});

export const stringify = (children: JsonNode[]): string =>
  JSON.stringify({
    root: { type: "root", version: 1, ...COMMON, children },
  });
