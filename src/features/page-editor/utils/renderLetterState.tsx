import type { SerializedEditorState, SerializedLexicalNode } from "lexical";
import {
  renderAssignedSundayCallout,
  renderCallout,
  renderImage,
  renderLetterhead,
  renderSignature,
} from "./renderLetterBlocks";
import { renderChip, renderText, type SerializedTextNode } from "./renderLetterInline";

interface SerializedElementNode extends SerializedLexicalNode {
  children?: SerializedLexicalNode[];
  tag?: string;
  format?: string | number;
  listType?: "bullet" | "number" | "check";
}

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
export interface RenderLetterStateOptions {
  /** Resolved assigned-Sunday date for the speaker, e.g.
   *  "Sunday, May 31, 2026". Used to render the
   *  `assigned-sunday-callout` Lexical decorator block — it stores no
   *  date in its own JSON, the editor pulls the date from a React
   *  context (`useAssignedDate()`), and this static walker has no
   *  access to that context. Pass it explicitly. */
  assignedDate?: string | null;
}

export function renderLetterState(
  stateJson: string,
  opts: RenderLetterStateOptions = {},
): React.ReactElement | null {
  let parsed: SerializedEditorState;
  try {
    parsed = JSON.parse(stateJson) as SerializedEditorState;
  } catch {
    return null;
  }
  const root = parsed.root as SerializedElementNode;
  return <>{(root.children ?? []).map((c, i) => renderNode(c, `b${i}`, opts))}</>;
}

function renderNode(
  node: SerializedLexicalNode,
  key: string,
  opts: RenderLetterStateOptions,
): React.ReactNode {
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
      return renderParagraph(el, key, opts);
    case "heading":
      return renderHeading(el, key, opts);
    case "quote":
      return (
        <blockquote key={key} className="border-l-2 border-brass pl-4 italic text-walnut my-3">
          {(el.children ?? []).map((c, i) => renderNode(c, `${key}.${i}`, opts))}
        </blockquote>
      );
    case "list":
      return renderList(el, key, opts);
    case "listitem":
      return (
        <li key={key}>{(el.children ?? []).map((c, i) => renderNode(c, `${key}.${i}`, opts))}</li>
      );
    case "link":
      return renderLink(node as never, key, opts);
    case "variable-chip":
      return renderChip(node as never, key);
    case "assigned-sunday-callout":
      return renderAssignedSundayCallout(key, opts.assignedDate);
    default:
      return (
        <span key={key}>
          {(el.children ?? []).map((c, i) => renderNode(c, `${key}.${i}`, opts))}
        </span>
      );
  }
}

function renderParagraph(el: SerializedElementNode, key: string, opts: RenderLetterStateOptions) {
  const align = elementFormatToTextAlign(el.format);
  // Color + size inherit from LetterCanvas's wrapper so paragraphs
  // match the contenteditable's typography (text-walnut, 16.5px,
  // 1.65 leading). Hardcoding text-walnut-2 here drifted away from
  // the editor's text-walnut, which made the print sheet read a
  // shade lighter than the on-screen view.
  return (
    <p key={key} className={`my-3 ${align}`}>
      {(el.children ?? []).map((c, i) => renderNode(c, `${key}.${i}`, opts))}
    </p>
  );
}

function renderHeading(el: SerializedElementNode, key: string, opts: RenderLetterStateOptions) {
  const tag = el.tag ?? "h2";
  const align = elementFormatToTextAlign(el.format);
  const children = (el.children ?? []).map((c, i) => renderNode(c, `${key}.${i}`, opts));
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

function renderList(el: SerializedElementNode, key: string, opts: RenderLetterStateOptions) {
  const items = (el.children ?? []).map((c, i) => renderNode(c, `${key}.${i}`, opts));
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

function renderLink(
  node: { url?: string; children?: SerializedLexicalNode[] },
  key: string,
  opts: RenderLetterStateOptions,
) {
  return (
    <a
      key={key}
      href={node.url ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="underline text-bordeaux hover:text-bordeaux-deep"
    >
      {(node.children ?? []).map((c, i) => renderNode(c, `${key}.${i}`, opts))}
    </a>
  );
}

function elementFormatToTextAlign(format: string | number | undefined): string {
  if (format === "center" || format === 2) return "text-center";
  if (format === "right" || format === 3) return "text-right";
  if (format === "justify" || format === 4) return "text-justify";
  return "";
}
