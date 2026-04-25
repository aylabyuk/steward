import type { SerializedEditorState, SerializedLexicalNode } from "lexical";

interface SerializedTextNode extends SerializedLexicalNode {
  text: string;
  format?: number;
}

interface SerializedElementNode extends SerializedLexicalNode {
  children?: SerializedLexicalNode[];
  tag?: string;
  listType?: "bullet" | "number" | "check";
}

const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 2;
const FORMAT_UNDERLINE = 8;
const FORMAT_CODE = 16;

/** Walks a Lexical EditorState JSON tree and emits a flat
 *  markdown-ish string suitable for the email/SMS interpolation
 *  pipeline. Custom nodes (variable chips, signature, callout) emit
 *  their interpolation tokens or stable text equivalents so the
 *  existing template-rendering path keeps working unchanged.
 *
 *  Not a full markdown serializer — only the constructs the speaker
 *  letter uses today (paragraphs, lists, headings, bold/italic,
 *  variable chips, signature line, assigned-Sunday callout). When
 *  Phase 3 adds program nodes the walker grows. */
export function serializeForInterpolation(state: SerializedEditorState): string {
  const root = state.root as SerializedElementNode;
  const blocks = root.children ?? [];
  return blocks
    .map(serializeBlock)
    .filter((s) => s.length > 0)
    .join("\n\n");
}

/** Splits the editor state into the legacy `bodyMarkdown` /
 *  `footerMarkdown` field pair the existing storage + print path
 *  expect. The split point is the first `signature-block` node;
 *  everything before is body, the last paragraph after it is
 *  footer.
 *
 *  Differs from {@link serializeForInterpolation}: `LetterCanvas`
 *  inserts the assigned-Sunday callout + signature row as page
 *  chrome, so we *omit* those nodes from the markdown — emitting
 *  them would duplicate them on the printed letter. Email/SMS
 *  paths that don't have chrome continue to use
 *  `serializeForInterpolation` instead. */
export function legacyFieldsFromState(state: SerializedEditorState): {
  bodyMarkdown: string;
  footerMarkdown: string;
} {
  const root = state.root as SerializedElementNode;
  const blocks = root.children ?? [];
  const sigIdx = blocks.findIndex((b) => b.type === "signature-block");
  const before = sigIdx < 0 ? blocks : blocks.slice(0, sigIdx);
  const after = sigIdx < 0 ? [] : blocks.slice(sigIdx + 1);
  const bodyMarkdown = before.map(serializeBlockForLegacy).filter(Boolean).join("\n\n");
  if (after.length === 0) return { bodyMarkdown, footerMarkdown: "" };
  const footerBlock = after[after.length - 1];
  const footerMarkdown = serializeBlockForLegacy(footerBlock);
  const carry = after.slice(0, -1).map(serializeBlockForLegacy).filter(Boolean).join("\n\n");
  return {
    bodyMarkdown: carry ? `${bodyMarkdown}\n\n${carry}` : bodyMarkdown,
    footerMarkdown,
  };
}

/** Variant of {@link serializeBlock} that omits the assigned-Sunday
 *  callout + signature block. The legacy print path renders both as
 *  page chrome, so emitting them as content would double them up. */
function serializeBlockForLegacy(node: SerializedLexicalNode): string {
  if (node.type === "assigned-sunday-callout" || node.type === "signature-block") return "";
  return serializeBlock(node);
}

function serializeBlock(node: SerializedLexicalNode): string {
  switch (node.type) {
    case "paragraph":
      return serializeInline((node as SerializedElementNode).children ?? []);
    case "heading": {
      const tag = (node as SerializedElementNode).tag ?? "h2";
      const level = Math.max(1, Math.min(6, parseInt(tag.replace("h", ""), 10) || 2));
      const inner = serializeInline((node as SerializedElementNode).children ?? []);
      return `${"#".repeat(level)} ${inner}`;
    }
    case "quote":
      return `> ${serializeInline((node as SerializedElementNode).children ?? [])}`;
    case "list": {
      const el = node as SerializedElementNode;
      const ordered = el.listType === "number";
      const items = el.children ?? [];
      return items
        .map((item, i) => {
          const inner = serializeInline((item as SerializedElementNode).children ?? []);
          return ordered ? `${i + 1}. ${inner}` : `- ${inner}`;
        })
        .join("\n");
    }
    case "horizontalrule":
      return "---";
    case "assigned-sunday-callout":
      // The callout's date resolves at render time from
      // `LetterRenderContext` — for plain-text interpolation we emit
      // the {{date}} token so the email/SMS pipeline injects the
      // assigned Sunday in plain text.
      return "**{{date}}**";
    case "signature-block": {
      const closing = (node as unknown as { closing?: string }).closing ?? "With gratitude,";
      const signatory = (node as unknown as { signatory?: string }).signatory ?? "The Bishopric";
      return `${closing}\n\n${signatory}`;
    }
    default:
      return "";
  }
}

function serializeInline(children: SerializedLexicalNode[]): string {
  return children.map(serializeInlineNode).join("");
}

function serializeInlineNode(node: SerializedLexicalNode): string {
  switch (node.type) {
    case "text": {
      const t = node as SerializedTextNode;
      let s = t.text;
      const fmt = t.format ?? 0;
      if (fmt & FORMAT_CODE) s = `\`${s}\``;
      if (fmt & FORMAT_BOLD) s = `**${s}**`;
      if (fmt & FORMAT_ITALIC) s = `*${s}*`;
      if (fmt & FORMAT_UNDERLINE) s = `<u>${s}</u>`;
      return s;
    }
    case "linebreak":
      return "\n";
    case "variable-chip": {
      const token = (node as unknown as { token?: string }).token ?? "";
      return `{{${token}}}`;
    }
    case "link": {
      const url = (node as unknown as { url?: string }).url ?? "";
      const inner = serializeInline((node as SerializedElementNode).children ?? []);
      return `[${inner}](${url})`;
    }
    default:
      // Unknown inline — fall back to its text children if any.
      return serializeInline((node as SerializedElementNode).children ?? []);
  }
}
