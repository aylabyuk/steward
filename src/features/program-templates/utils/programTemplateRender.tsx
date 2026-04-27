import type { SerializedEditorState, SerializedLexicalNode } from "lexical";
import { VARIABLE_BY_TOKEN } from "./programVariables";

interface SerializedTextNode extends SerializedLexicalNode {
  type: "text";
  text: string;
  format?: number;
}

interface SerializedElementNode extends SerializedLexicalNode {
  children?: SerializedLexicalNode[];
  tag?: string;
}

interface SerializedVariableChip extends SerializedLexicalNode {
  type: "variable-chip";
  token: string;
}

const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 2;
const FORMAT_UNDERLINE = 8;

/** Render a Lexical-state JSON into React, resolving variable chips
 *  against a runtime variable map. Used by the editor's live preview
 *  panel and (later) by the print pages once `ConductingProgram` /
 *  `CongregationProgram` switch over to template-driven output. */
export function renderProgramState(
  json: string,
  variables: Record<string, string>,
): React.ReactElement {
  let parsed: SerializedEditorState;
  try {
    parsed = JSON.parse(json) as SerializedEditorState;
  } catch {
    return <p className="font-serif italic text-walnut-3">Invalid template state.</p>;
  }
  return <>{renderNode(parsed.root, variables, "root")}</>;
}

function renderNode(
  node: SerializedLexicalNode,
  vars: Record<string, string>,
  key: string,
): React.ReactNode {
  if (node.type === "text") {
    const t = node as SerializedTextNode;
    let el: React.ReactNode = t.text;
    const f = t.format ?? 0;
    if (f & FORMAT_BOLD) el = <strong key={key}>{el}</strong>;
    if (f & FORMAT_ITALIC) el = <em key={key}>{el}</em>;
    if (f & FORMAT_UNDERLINE) el = <u key={key}>{el}</u>;
    return <span key={key}>{el}</span>;
  }
  if (node.type === "variable-chip") {
    const v = node as SerializedVariableChip;
    const value = vars[v.token];
    if (value !== undefined && value !== "") return <span key={key}>{value}</span>;
    const meta = VARIABLE_BY_TOKEN.get(v.token);
    return (
      <span
        key={key}
        className="rounded-full bg-parchment-2 border border-border px-1.5 font-mono text-[11px] text-walnut-3"
      >
        {`{{${meta?.label ?? v.token}}}`}
      </span>
    );
  }
  const el = node as SerializedElementNode;
  const children = (el.children ?? []).map((c, i) => renderNode(c, vars, `${key}.${i}`));
  switch (node.type) {
    case "root":
      return <div key={key}>{children}</div>;
    case "paragraph":
      return (
        <p key={key} className="my-1">
          {children}
        </p>
      );
    case "heading":
      return renderHeading(el.tag, children, key);
    case "quote":
      return (
        <blockquote
          key={key}
          className="border-l-4 border-walnut-3/60 pl-3 italic text-walnut-2 my-2"
        >
          {children}
        </blockquote>
      );
    case "list":
      return el.tag === "ol" ? (
        <ol key={key} className="list-decimal pl-6 my-1.5">
          {children}
        </ol>
      ) : (
        <ul key={key} className="list-disc pl-6 my-1.5">
          {children}
        </ul>
      );
    case "listitem":
      return <li key={key}>{children}</li>;
    case "linebreak":
      return <br key={key} />;
    default:
      return <span key={key}>{children}</span>;
  }
}

function renderHeading(tag: string | undefined, children: React.ReactNode, key: string) {
  if (tag === "h1")
    return (
      <h1 key={key} className="font-display text-[22px] font-semibold mt-2 mb-1">
        {children}
      </h1>
    );
  if (tag === "h2")
    return (
      <h2 key={key} className="font-display text-[19px] font-semibold mt-2 mb-1">
        {children}
      </h2>
    );
  return (
    <h3 key={key} className="font-display text-[17px] font-semibold mt-1.5 mb-1">
      {children}
    </h3>
  );
}

/** Build the variable map for the editor preview. Mirrors the eventual
 *  print-time builder but pulls every value from the variable
 *  metadata's `sample` field, so the editor is useful before any real
 *  meeting is wired up. */
export function buildSampleVariables(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [token, v] of VARIABLE_BY_TOKEN.entries()) out[token] = v.sample;
  return out;
}
