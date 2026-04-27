import type { SerializedEditorState, SerializedLexicalNode } from "lexical";

/** Walks an editor-state JSON string and replaces every
 *  variable-chip node with a plain text node carrying the resolved
 *  value from `vars`. Used at send-time so the invitation snapshot
 *  arrives with chips already baked into text — the speaker landing
 *  page's renderer doesn't need to know about chip resolution
 *  (renderText handles plain text just fine).
 *
 *  Chips whose token isn't in `vars` are left as `{{token}}` literal
 *  text so the speaker can at least see what was supposed to fill in,
 *  rather than a phantom empty span. */
export function resolveChipsInState(
  stateJson: string,
  vars: Readonly<Record<string, string>>,
): string {
  let parsed: SerializedEditorState;
  try {
    parsed = JSON.parse(stateJson) as SerializedEditorState;
  } catch {
    return stateJson;
  }
  const root = parsed.root as SerializedLexicalNode & {
    children?: SerializedLexicalNode[];
  };
  walk(root, vars);
  return JSON.stringify(parsed);
}

function walk(
  node: SerializedLexicalNode & { children?: SerializedLexicalNode[] },
  vars: Readonly<Record<string, string>>,
): void {
  if (!Array.isArray(node.children)) return;
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]!;
    if (child.type === "variable-chip") {
      const c = child as unknown as { token?: string; format?: number; style?: string };
      const token = c.token ?? "";
      const value = Object.hasOwn(vars, token) ? vars[token]! : `{{${token}}}`;
      node.children[i] = {
        type: "text",
        version: 1,
        format: c.format ?? 0,
        mode: "normal",
        style: c.style ?? "",
        detail: 0,
        text: value,
      } as unknown as SerializedLexicalNode;
    } else {
      walk(child as SerializedLexicalNode & { children?: SerializedLexicalNode[] }, vars);
    }
  }
}
