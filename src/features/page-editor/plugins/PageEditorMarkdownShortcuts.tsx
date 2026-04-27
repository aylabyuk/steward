import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import {
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  HEADING,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  LINK,
  ORDERED_LIST,
  QUOTE,
  STRIKETHROUGH,
  UNORDERED_LIST,
} from "@lexical/markdown";
import { VARIABLE_CHIP_MARKDOWN_TRANSFORMER } from "@/features/program-templates/nodes/utils/variableChipMarkdown";

/** Hand-picked transformer set — excludes CODE / INLINE_CODE / CHECK_LIST
 *  / HIGHLIGHT because those require nodes (`CodeNode`,
 *  `CodeHighlightNode`, etc.) we don't register on the page editors.
 *  `MarkdownShortcutPlugin` validates dependencies up front and throws
 *  if any transformer references an unregistered node. Exported so
 *  `letterEditorConfig` can use the same set for hydration via
 *  `$convertFromMarkdownString`. */
export const PAGE_EDITOR_MARKDOWN_TRANSFORMERS = [
  VARIABLE_CHIP_MARKDOWN_TRANSFORMER,
  HEADING,
  QUOTE,
  UNORDERED_LIST,
  ORDERED_LIST,
  LINK,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
];

/** Wires `# `, `> `, `* `, `1. `, `**bold**`, `*italic*`, `~~strike~~`,
 *  `[link](url)`, and `{{token}}` shortcuts through Lexical's official
 *  markdown shortcut plugin. The variable-chip transformer turns
 *  `{{speakerName}}` typed mid-paragraph into a chip the moment the
 *  closing `}` is typed (matching the trigger we already use in the
 *  program-template editor). */
export function PageEditorMarkdownShortcuts() {
  return <MarkdownShortcutPlugin transformers={PAGE_EDITOR_MARKDOWN_TRANSFORMERS} />;
}
