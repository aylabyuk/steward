import type { SerializedLexicalNode } from "lexical";

interface SerializedTextNode extends SerializedLexicalNode {
  type: "text";
  text: string;
  format?: number;
  style?: string;
}

const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 2;
const FORMAT_STRIKE = 4;
const FORMAT_UNDERLINE = 8;
const FORMAT_CODE = 16;

/** Inline-text + chip renderers shared by `renderLetterState`.
 *  Kept in their own file so the entry walker stays under the LOC
 *  cap — these are leaf-level helpers that don't recurse. */

export function renderText(node: SerializedTextNode, key: string): React.ReactNode {
  let el: React.ReactNode = node.text;
  const f = node.format ?? 0;
  if (f & FORMAT_CODE)
    el = <code className="font-mono text-[0.92em] bg-parchment-2 px-1 rounded">{el}</code>;
  if (f & FORMAT_BOLD) el = <strong>{el}</strong>;
  if (f & FORMAT_ITALIC) el = <em>{el}</em>;
  if (f & FORMAT_UNDERLINE) el = <u>{el}</u>;
  if (f & FORMAT_STRIKE) el = <s>{el}</s>;
  const style = parseStyle(node.style);
  if (style)
    return (
      <span key={key} style={style}>
        {el}
      </span>
    );
  return <span key={key}>{el}</span>;
}

export function renderChip(node: { token?: string; format?: number; style?: string }, key: string) {
  let element: React.ReactNode = `{{${node.token ?? ""}}}`;
  const f = node.format ?? 0;
  if (f & FORMAT_CODE)
    element = (
      <code className="font-mono text-[0.92em] bg-parchment-2 px-1 rounded">{element}</code>
    );
  if (f & FORMAT_BOLD) element = <strong>{element}</strong>;
  if (f & FORMAT_ITALIC) element = <em>{element}</em>;
  if (f & FORMAT_UNDERLINE) element = <u>{element}</u>;
  if (f & FORMAT_STRIKE) element = <s>{element}</s>;
  const inlineStyle = parseStyle(node.style);
  if (inlineStyle) {
    return (
      <span key={key} style={inlineStyle}>
        {element}
      </span>
    );
  }
  return <span key={key}>{element}</span>;
}

function parseStyle(s: string | undefined): React.CSSProperties | null {
  if (!s) return null;
  const out: Record<string, string> = {};
  for (const decl of s.split(";")) {
    const [k, v] = decl.split(":").map((p) => p.trim());
    if (!k || !v) continue;
    const camel = k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    out[camel] = v;
  }
  return out as React.CSSProperties;
}

export type { SerializedTextNode };
