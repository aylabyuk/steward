import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  type Transformer,
} from "@lexical/markdown";
import { $createParagraphNode, $createTextNode, $getRoot, type LexicalEditor } from "lexical";
import { $createAssignedSundayCalloutNode } from "./nodes/AssignedSundayCalloutNode";
import { $createSignatureBlockNode } from "./nodes/SignatureBlockNode";
import { PAGE_EDITOR_BASE_NODES } from "./pageEditorNodes";
import { PAGE_EDITOR_MARKDOWN_TRANSFORMERS } from "./plugins/PageEditorMarkdownShortcuts";

export const LETTER_EDITOR_NODES = PAGE_EDITOR_BASE_NODES;

/** Transformer list used for hydrating legacy `bodyMarkdown` /
 *  `footerMarkdown` into the editor (and serializing back to markdown
 *  during the dual-write window). Reuses the curated set from the
 *  shortcut plugin so hydration can't reference nodes the editor
 *  doesn't register. */
export const LETTER_MARKDOWN_TRANSFORMERS: Transformer[] = PAGE_EDITOR_MARKDOWN_TRANSFORMERS;

interface BuildOpts {
  bodyMarkdown: string;
  footerMarkdown: string;
}

const SIGNATURE_CLOSING_PATTERN =
  /^(with gratitude|with appreciation|sincerely|in faith)\s*[,.]?\s*$/i;

/** Builds a Lexical EditorState for a brand-new editor by hydrating
 *  legacy markdown into chips + paragraphs, splicing an
 *  `AssignedSundayCalloutNode` after the greeting, replacing any
 *  trailing "With gratitude,"-style paragraph with a
 *  `SignatureBlockNode`, and finishing with the footer scripture as
 *  a final paragraph. Used for both seed states (brand-new wards)
 *  and migration (existing wards that only have markdown stored).
 *
 *  When the ward already has `editorStateJson` saved, the route
 *  passes the JSON directly to `LexicalComposer` and this function
 *  isn't invoked. */
export function buildInitialLetterState({ bodyMarkdown, footerMarkdown }: BuildOpts) {
  return () => {
    $convertFromMarkdownString(bodyMarkdown, LETTER_MARKDOWN_TRANSFORMERS);
    const root = $getRoot();
    const children = root.getChildren();
    // Insert assigned-Sunday callout after the greeting (first paragraph).
    if (children.length >= 1) {
      children[0].insertAfter($createAssignedSundayCalloutNode());
    } else {
      root.append($createAssignedSundayCalloutNode());
    }
    // If the body ended in a "With gratitude,"-style closing paragraph,
    // remove it — the signature block decorator renders its own closing.
    const last = root.getChildren().at(-1);
    const lastText = last?.getTextContent().trim() ?? "";
    if (last && SIGNATURE_CLOSING_PATTERN.test(lastText)) {
      last.remove();
    }
    root.append($createSignatureBlockNode());
    if (footerMarkdown.trim().length > 0) {
      const footerPara = $createParagraphNode();
      footerPara.append($createTextNode(footerMarkdown));
      root.append(footerPara);
    }
  };
}

/** Read-side helper: when the dual-write window is still open and a
 *  caller (Cloud Function, receipt-email payload) needs markdown
 *  even though the new editor wrote JSON, reproduce the legacy body
 *  + footer fields by serializing the JSON state through the same
 *  markdown transformers used at authoring time, then split on the
 *  signature-block boundary. */
export function legacyMarkdownFromEditor(editor: LexicalEditor): {
  bodyMarkdown: string;
  footerMarkdown: string;
} {
  const md = editor
    .getEditorState()
    .read(() => $convertToMarkdownString(LETTER_MARKDOWN_TRANSFORMERS));
  const sigIndex = md.indexOf("With gratitude,");
  if (sigIndex < 0) return { bodyMarkdown: md, footerMarkdown: "" };
  const before = md.slice(0, sigIndex).trimEnd();
  const after = md.slice(sigIndex);
  const lines = after
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
  const footer = lines.length > 0 ? lines[lines.length - 1] : "";
  return { bodyMarkdown: before, footerMarkdown: footer };
}
