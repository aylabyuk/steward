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
import { INSERT_IMAGE_COMMAND } from "./plugins/ImagePlugin";
import type { SlashCommand } from "./plugins/SlashCommandRegistry";

function setBlock(editor: LexicalEditor, factory: () => ReturnType<typeof $createParagraphNode>) {
  editor.update(() => {
    const sel = $getSelection();
    if ($isRangeSelection(sel)) $setBlocksType(sel, factory);
  });
}

/** Slash-command palette for the conducting + congregation program
 *  template editors. Mounted by `ProgramPageEditor` via
 *  `PageEditorComposer`. Bishops type `/` at the start of a paragraph
 *  to open the menu. Variables live in their own toolbar dropdown,
 *  not here — see `PROGRAM_VARIABLES` + `VariableMenu`. */
const STRUCTURAL_COMMANDS: SlashCommand[] = [
  {
    id: "heading-1",
    label: "Heading 1",
    keywords: "h1, title",
    icon: "H1",
    onSelect: (e) => setBlock(e, () => $createHeadingNode("h1" as HeadingTagType) as never),
  },
  {
    id: "heading-2",
    label: "Heading 2",
    keywords: "h2",
    icon: "H2",
    onSelect: (e) => setBlock(e, () => $createHeadingNode("h2" as HeadingTagType) as never),
  },
  {
    id: "heading-3",
    label: "Heading 3",
    keywords: "h3",
    icon: "H3",
    onSelect: (e) => setBlock(e, () => $createHeadingNode("h3" as HeadingTagType) as never),
  },
  {
    id: "bullet-list",
    label: "Bullet list",
    keywords: "ul, unordered, list",
    icon: "•",
    onSelect: (e) => e.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
  },
  {
    id: "numbered-list",
    label: "Numbered list",
    keywords: "ol, ordered",
    icon: "1.",
    onSelect: (e) => e.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
  },
  {
    id: "quote",
    label: "Quote",
    keywords: "blockquote, scripture, narration",
    icon: "❝",
    onSelect: (e) => setBlock(e, () => $createQuoteNode() as never),
  },
  {
    id: "divider",
    label: "Divider",
    description: "Horizontal rule",
    keywords: "hr, line, separator",
    icon: "—",
    onSelect: (e) => e.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined),
  },
  {
    id: "image",
    label: "Image",
    description: "Insert an image by URL",
    keywords: "img, picture",
    icon: "🖼",
    onSelect: (e) => {
      const src = window.prompt("Image URL");
      if (!src) return;
      const alt = window.prompt("Alt text", "") ?? "";
      e.dispatchCommand(INSERT_IMAGE_COMMAND, { src, alt });
    },
  },
];

export const PROGRAM_SLASH_COMMANDS: readonly SlashCommand[] = STRUCTURAL_COMMANDS;
