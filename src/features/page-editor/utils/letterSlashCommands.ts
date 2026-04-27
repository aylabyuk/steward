import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  type LexicalEditor,
} from "lexical";
import { $createHeadingNode, $createQuoteNode, type HeadingTagType } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from "@lexical/list";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import { $createCalloutNode } from "../nodes/CalloutNode";
import { $createLetterheadNode } from "../nodes/LetterheadNode";
import { $createSignatureBlockNode } from "../nodes/SignatureBlockNode";
import { INSERT_IMAGE_COMMAND } from "../plugins/ImagePlugin";
import type { SlashCommand } from "../plugins/SlashCommandRegistry";

function setBlock(editor: LexicalEditor, factory: () => ReturnType<typeof $createParagraphNode>) {
  editor.update(() => {
    const sel = $getSelection();
    if ($isRangeSelection(sel)) $setBlocksType(sel, factory);
  });
}

const BRASS_ORNAMENT_SVG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><circle cx='12' cy='12' r='10' fill='none' stroke='%238e6a36' stroke-width='1.5'/><text x='12' y='16' text-anchor='middle' font-family='serif' font-size='14' fill='%238e6a36'>%E2%9C%A6</text></svg>";

/** Slash-command palette for the speaker-letter editor. Mounted by
 *  `LetterPageEditor` via `PageEditorComposer`. Bishops type `/` at
 *  the start of a paragraph to open the menu. */
export const LETTER_SLASH_COMMANDS: readonly SlashCommand[] = [
  {
    id: "heading-1",
    label: "Heading 1",
    description: "Large section heading",
    keywords: "h1, title",
    icon: "H1",
    onSelect: (editor) =>
      setBlock(editor, () => $createHeadingNode("h1" as HeadingTagType) as never),
  },
  {
    id: "heading-2",
    label: "Heading 2",
    description: "Medium section heading",
    keywords: "h2",
    icon: "H2",
    onSelect: (editor) =>
      setBlock(editor, () => $createHeadingNode("h2" as HeadingTagType) as never),
  },
  {
    id: "heading-3",
    label: "Heading 3",
    description: "Small section heading",
    keywords: "h3",
    icon: "H3",
    onSelect: (editor) =>
      setBlock(editor, () => $createHeadingNode("h3" as HeadingTagType) as never),
  },
  {
    id: "bullet-list",
    label: "Bullet list",
    keywords: "ul, unordered, list",
    icon: "•",
    onSelect: (editor) => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
  },
  {
    id: "numbered-list",
    label: "Numbered list",
    keywords: "ol, ordered, list",
    icon: "1.",
    onSelect: (editor) => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
  },
  {
    id: "quote",
    label: "Quote",
    description: "Set off a scripture or saying",
    keywords: "blockquote, scripture",
    icon: "❝",
    onSelect: (editor) => setBlock(editor, () => $createQuoteNode() as never),
  },
  {
    id: "divider",
    label: "Divider",
    description: "Horizontal rule",
    keywords: "hr, line, separator",
    icon: "—",
    onSelect: (editor) => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined),
  },
  {
    id: "image",
    label: "Image",
    description: "Insert an image (click to set URL)",
    keywords: "img, picture, photo",
    icon: "🖼",
    onSelect: (editor) => editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src: "", alt: "" }),
  },
  {
    id: "ornament",
    label: "Brass ornament",
    description: "Decorative ✦ ornament",
    keywords: "decoration, flourish, brass",
    icon: "✦",
    onSelect: (editor) =>
      editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
        src: BRASS_ORNAMENT_SVG,
        alt: "Brass ornament",
        widthPct: 8,
      }),
  },
  {
    id: "letterhead",
    label: "Letterhead",
    description: "Masthead with title, subtitle, and meta line",
    keywords: "header, masthead, top, ward, formal",
    icon: "≡",
    onSelect: (editor) => {
      editor.update(() => {
        const sel = $getSelection();
        if ($isRangeSelection(sel)) sel.insertNodes([$createLetterheadNode()]);
      });
    },
  },
  {
    id: "callout",
    label: "Callout",
    description: "Eyebrow label + body band (e.g. Topic, Note)",
    keywords: "block, note, reminder, callout, band",
    icon: "▢",
    onSelect: (editor) => {
      editor.update(() => {
        const sel = $getSelection();
        if ($isRangeSelection(sel)) sel.insertNodes([$createCalloutNode("Note", "")]);
      });
    },
  },
  {
    id: "signature",
    label: "Signature",
    description: "Closing phrase + signing line",
    keywords: "sign, gratitude, bishopric, sincerely",
    icon: "✎",
    onSelect: (editor) => {
      editor.update(() => {
        const sel = $getSelection();
        if ($isRangeSelection(sel)) sel.insertNodes([$createSignatureBlockNode()]);
      });
    },
  },
];
