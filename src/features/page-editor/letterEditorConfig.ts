import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  type Transformer,
} from "@lexical/markdown";
import { $createParagraphNode, $createTextNode, $getRoot, type LexicalEditor } from "lexical";
import { $createVariableChipNode } from "@/features/program-templates/nodes/VariableChipNode";
import { $createAssignedSundayCalloutNode } from "./nodes/AssignedSundayCalloutNode";
import { $createLetterheadNode } from "./nodes/LetterheadNode";
import { $createSignatureBlockNode } from "./nodes/SignatureBlockNode";
import { PAGE_EDITOR_BASE_NODES } from "./pageEditorNodes";
import { PAGE_EDITOR_MARKDOWN_TRANSFORMERS } from "./plugins/PageEditorMarkdownShortcuts";

export { LETTER_SLASH_COMMANDS } from "./letterSlashCommands";

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

/** Builds a Lexical EditorState for a brand-new editor.
 *
 *  Pre-Phase-6 builds had a render-only `LetterChrome` component
 *  outside the editor that painted the ornament + eyebrow + title +
 *  date — all the bishop's eye landed on but couldn't touch. The
 *  user explicitly asked for *every* text on the letter to be
 *  100% editable, so the seed now prepends those as actual content
 *  paragraphs. Page-canvas chrome reduces to the paper frame and
 *  drop shadow.
 *
 *  Migration: when an existing ward has `editorStateJson` saved,
 *  the route hands the JSON straight to LexicalComposer and this
 *  function isn't called — those wards keep their authored content
 *  unchanged. They can hit "Discard" or paste in headers manually.
 *  When only legacy markdown exists, we hydrate it + prepend the
 *  chrome content + splice in the assigned-Sunday callout +
 *  signature block + footer scripture. */
export function buildInitialLetterState({ bodyMarkdown, footerMarkdown }: BuildOpts) {
  return () => {
    $convertFromMarkdownString(bodyMarkdown, LETTER_MARKDOWN_TRANSFORMERS);
    const root = $getRoot();
    const bodyChildren = [...root.getChildren()];
    root.clear();

    // Header is now a single LetterheadNode (circled brass ornament,
    // eyebrow with {{wardName}}, italic title, sub-eyebrow). Replaces
    // the previous five-paragraph chrome stack — one node, three
    // click-to-edit fields, identical typography.
    root.append(
      $createLetterheadNode(
        "Sacrament Meeting · {{wardName}}",
        "Invitation to Speak",
        "From the Bishopric",
      ),
    );

    // Date line stays as its own paragraph below the letterhead so
    // the formal letter format (heading on top, date below) survives.
    const dateLine = $createParagraphNode();
    dateLine.append($createVariableChipNode("today"));
    root.append(dateLine);

    // Restore body paragraphs (originally hydrated from markdown).
    for (const child of bodyChildren) root.append(child);

    // Insert assigned-Sunday callout after the greeting paragraph.
    const greetingIdx = root
      .getChildren()
      .findIndex(
        (c) => c.getType() === "paragraph" && c.getTextContent().toLowerCase().startsWith("dear"),
      );
    const callout = $createAssignedSundayCalloutNode();
    if (greetingIdx >= 0) {
      root.getChildren()[greetingIdx]!.insertAfter(callout);
    } else {
      root.append(callout);
    }
    // Strip a trailing "With gratitude,"-style paragraph; signature node renders its own closing.
    const last = root.getChildren().at(-1);
    if (last && SIGNATURE_CLOSING_PATTERN.test(last.getTextContent().trim())) last.remove();
    root.append($createSignatureBlockNode());
    if (footerMarkdown.trim().length > 0) {
      const footerPara = $createParagraphNode();
      footerPara.setFormat("center");
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
