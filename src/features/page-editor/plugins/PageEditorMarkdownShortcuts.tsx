import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import { VARIABLE_CHIP_MARKDOWN_TRANSFORMER } from "@/features/program-templates/nodes/variableChipMarkdown";

const PAGE_EDITOR_MARKDOWN_TRANSFORMERS = [VARIABLE_CHIP_MARKDOWN_TRANSFORMER, ...TRANSFORMERS];

/** Wires `# `, `> `, `* `, `1. `, `---`, `**bold**`, `*italic*`,
 *  `[link](url)`, and `{{token}}` shortcuts through Lexical's official
 *  markdown shortcut plugin. The variable-chip transformer turns
 *  `{{speakerName}}` typed mid-paragraph into a chip the moment the
 *  closing `}` is typed (matching the trigger we already use in the
 *  program-template editor). */
export function PageEditorMarkdownShortcuts() {
  return <MarkdownShortcutPlugin transformers={PAGE_EDITOR_MARKDOWN_TRANSFORMERS} />;
}
