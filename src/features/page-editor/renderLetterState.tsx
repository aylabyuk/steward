import type { SerializedEditorState, SerializedLexicalNode } from "lexical";

interface SerializedTextNode extends SerializedLexicalNode {
  type: "text";
  text: string;
  format?: number;
  style?: string;
}

interface SerializedElementNode extends SerializedLexicalNode {
  children?: SerializedLexicalNode[];
  tag?: string;
  format?: string | number;
  listType?: "bullet" | "number" | "check";
}

const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 2;
const FORMAT_STRIKE = 4;
const FORMAT_UNDERLINE = 8;
const FORMAT_CODE = 16;

/** Renders the bishop's WYSIWYG-authored speaker letter (a Lexical
 *  EditorState JSON) as React. Used by the speaker landing page to
 *  show the exact letterhead / callout / signature components the
 *  bishop chose, instead of the legacy hardcoded chrome + flat
 *  markdown body.
 *
 *  Token interpolation runs upstream in `sendSpeakerInvitation`
 *  before the JSON lands in the snapshot — by the time we get here
 *  the values are already substituted, so this walker stays purely
 *  about layout. Variable chips are rendered as the resolved value
 *  the snapshot stores in their `text` field, falling back to the
 *  raw token if not present.*/
export function renderLetterState(stateJson: string): React.ReactElement | null {
  let parsed: SerializedEditorState;
  try {
    parsed = JSON.parse(stateJson) as SerializedEditorState;
  } catch {
    return null;
  }
  const root = parsed.root as SerializedElementNode;
  return <>{(root.children ?? []).map((c, i) => renderNode(c, `b${i}`))}</>;
}

function renderNode(node: SerializedLexicalNode, key: string): React.ReactNode {
  if (node.type === "text") return renderText(node as SerializedTextNode, key);
  if (node.type === "linebreak") return <br key={key} />;
  const el = node as SerializedElementNode;
  switch (node.type) {
    case "letterhead":
      return renderLetterhead(node as never, key);
    case "callout":
      return renderCallout(node as never, key);
    case "signature-block":
      return renderSignature(node as never, key);
    case "image":
      return renderImage(node as never, key);
    case "horizontalrule":
      return <hr key={key} className="my-4 border-walnut-3/40" />;
    case "paragraph":
      return renderParagraph(el, key);
    case "heading":
      return renderHeading(el, key);
    case "quote":
      return (
        <blockquote key={key} className="border-l-2 border-brass pl-4 italic text-walnut my-3">
          {(el.children ?? []).map((c, i) => renderNode(c, `${key}.${i}`))}
        </blockquote>
      );
    case "list":
      return renderList(el, key);
    case "listitem":
      return <li key={key}>{(el.children ?? []).map((c, i) => renderNode(c, `${key}.${i}`))}</li>;
    case "link":
      return renderLink(node as never, key);
    case "variable-chip":
      return renderChip(node as never, key);
    case "assigned-sunday-callout":
      // Date is interpolated upstream; if the snapshot didn't carry
      // an explicit value we'd have nothing useful to display, so
      // we render an empty placeholder rather than a stale token.
      return null;
    default:
      return (
        <span key={key}>{(el.children ?? []).map((c, i) => renderNode(c, `${key}.${i}`))}</span>
      );
  }
}

function renderText(node: SerializedTextNode, key: string): React.ReactNode {
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

function renderParagraph(el: SerializedElementNode, key: string) {
  const align = elementFormatToTextAlign(el.format);
  // Color + size inherit from LetterCanvas's wrapper so paragraphs
  // match the contenteditable's typography (text-walnut, 16.5px,
  // 1.65 leading). Hardcoding text-walnut-2 here drifted away from
  // the editor's text-walnut, which made the print sheet read a
  // shade lighter than the on-screen view.
  return (
    <p key={key} className={`my-3 ${align}`}>
      {(el.children ?? []).map((c, i) => renderNode(c, `${key}.${i}`))}
    </p>
  );
}

function renderHeading(el: SerializedElementNode, key: string) {
  const tag = el.tag ?? "h2";
  const align = elementFormatToTextAlign(el.format);
  const children = (el.children ?? []).map((c, i) => renderNode(c, `${key}.${i}`));
  if (tag === "h1")
    return (
      <h1 key={key} className={`font-display text-[26px] mt-4 mb-2 text-walnut ${align}`}>
        {children}
      </h1>
    );
  if (tag === "h2")
    return (
      <h2 key={key} className={`font-display text-[22px] mt-3 mb-2 text-walnut ${align}`}>
        {children}
      </h2>
    );
  return (
    <h3 key={key} className={`font-display text-[19px] mt-3 mb-1.5 text-walnut ${align}`}>
      {children}
    </h3>
  );
}

function renderList(el: SerializedElementNode, key: string) {
  const items = (el.children ?? []).map((c, i) => renderNode(c, `${key}.${i}`));
  if (el.listType === "number")
    return (
      <ol key={key} className="list-decimal pl-7 my-2 text-walnut-2 leading-[1.65]">
        {items}
      </ol>
    );
  return (
    <ul key={key} className="list-disc pl-7 my-2 text-walnut-2 leading-[1.65]">
      {items}
    </ul>
  );
}

function renderLink(node: { url?: string; children?: SerializedLexicalNode[] }, key: string) {
  return (
    <a
      key={key}
      href={node.url ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="underline text-bordeaux hover:text-bordeaux-deep"
    >
      {(node.children ?? []).map((c, i) => renderNode(c, `${key}.${i}`))}
    </a>
  );
}

function renderChip(node: { token?: string; format?: number; style?: string }, key: string) {
  // Snapshots store the chip's token + the toolbar-applied format
  // bits + an inline-style string. We don't have a vars bag on the
  // speaker page yet, so the raw `{{token}}` falls through here;
  // format + style still apply so the bishop's bold / colour /
  // font-family survives the round trip.
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

function renderLetterhead(
  node: { eyebrow?: string; title?: string; subtitle?: string },
  key: string,
) {
  return (
    <div key={key} className="text-center pb-5 border-b border-border mb-8">
      <div className="flex items-center justify-center gap-3.5 mb-3.5">
        <span className="w-9 h-9 border border-brass-soft rounded-full inline-flex items-center justify-center text-brass-deep text-lg">
          ✦
        </span>
      </div>
      {node.eyebrow && (
        <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-walnut-3 mb-2">
          {node.eyebrow}
        </div>
      )}
      {node.title && (
        <div className="font-display text-[28px] italic text-walnut tracking-[-0.01em]">
          {node.title}
        </div>
      )}
      {node.subtitle && (
        <div className="mt-2.5 font-mono text-[10px] tracking-[0.22em] uppercase text-walnut-3">
          {node.subtitle}
        </div>
      )}
    </div>
  );
}

function renderCallout(node: { label?: string; body?: string }, key: string) {
  return (
    <div
      key={key}
      className="my-5 px-6 py-4 bg-linear-to-b from-brass-soft/15 to-brass-soft/5 border-l-2 border-brass rounded-r-md"
    >
      {node.label && (
        <div className="font-mono text-[9.5px] tracking-[0.22em] uppercase text-brass-deep mb-2">
          {node.label}
        </div>
      )}
      {node.body && <div className="font-display text-[20px] italic text-walnut">{node.body}</div>}
    </div>
  );
}

function renderSignature(node: { closing?: string; signatory?: string }, key: string) {
  return (
    <div key={key} className="mt-7 mb-2">
      {node.closing && (
        <div className="font-serif italic text-[16px] text-walnut mb-2">{node.closing}</div>
      )}
      <div className="border-b border-walnut-3 w-65 mb-1.5" />
      {node.signatory && (
        <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-walnut-3">
          {node.signatory}
        </div>
      )}
    </div>
  );
}

function renderImage(
  node: { src?: string; alt?: string; widthPct?: number; caption?: string },
  key: string,
) {
  if (!node.src) return null;
  return (
    <figure
      key={key}
      className="my-4 mx-auto flex flex-col items-center"
      style={{ width: `${node.widthPct ?? 60}%` }}
    >
      <img src={node.src} alt={node.alt ?? ""} className="max-w-full block" />
      {node.caption && (
        <figcaption className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3">
          {node.caption}
        </figcaption>
      )}
    </figure>
  );
}

function elementFormatToTextAlign(format: string | number | undefined): string {
  if (format === "center" || format === 2) return "text-center";
  if (format === "right" || format === 3) return "text-right";
  if (format === "justify" || format === 4) return "text-justify";
  return "";
}
