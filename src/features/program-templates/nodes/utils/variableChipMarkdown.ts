import type { TextMatchTransformer } from "@lexical/markdown";
import {
  $createVariableChipNode,
  $isVariableChipNode,
  VariableChipNode,
} from "../VariableChipNode";

/** Round-trips `{{token}}` text ↔ `VariableChipNode` so a Lexical
 *  editor backed by markdown storage (the speaker letter template,
 *  per-speaker overrides) can display chips inline while the bytes
 *  on disk stay markdown — keeping the existing renderer (which
 *  interpolates `{{token}}` text) working unchanged.
 *
 *  - `export`: chip → `{{token}}` text
 *  - `regExp` / `replace`: matches `{{token}}` typed at the end of
 *    a paragraph and converts it into a chip.
 *  - `importRegExp`: matches `{{token}}` anywhere on a line so
 *    `$convertFromMarkdownString` hydrates existing markdown into
 *    chip-bearing editor state. */
export const VARIABLE_CHIP_MARKDOWN_TRANSFORMER: TextMatchTransformer = {
  dependencies: [VariableChipNode],
  export: (node) => {
    if (!$isVariableChipNode(node)) return null;
    return `{{${node.getToken()}}}`;
  },
  importRegExp: /\{\{([a-zA-Z][a-zA-Z0-9_]*)\}\}/,
  regExp: /\{\{([a-zA-Z][a-zA-Z0-9_]*)\}\}$/,
  replace: (textNode, match) => {
    const token = match[1];
    if (!token) return;
    const chip = $createVariableChipNode(token);
    textNode.replace(chip);
  },
  trigger: "}",
  type: "text-match",
};
