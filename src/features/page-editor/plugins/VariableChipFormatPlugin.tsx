import { useEffect } from "react";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  VariableChipNode,
  variableChipFormatBit,
} from "@/features/program-templates/nodes/VariableChipNode";

/** Routes Lexical's `FORMAT_TEXT_COMMAND` (Bold / Italic / Underline /
 *  Strike / Code) through any `VariableChipNode` inside the current
 *  selection — so a bishop can select "Dear Brother Park," and hit
 *  ⌘B and the chip flips bold alongside the surrounding text.
 *
 *  Lexical's built-in handler only knows about TextNodes; chips would
 *  silently no-op. This plugin runs at COMMAND_PRIORITY_LOW and
 *  returns false so the default handler still formats text nodes —
 *  the chip just gets the same toggle layered on top. */
export function VariableChipFormatPlugin(): null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerCommand(
      FORMAT_TEXT_COMMAND,
      (formatType) => {
        const bit = variableChipFormatBit(formatType);
        if (bit === 0) return false;
        const sel = $getSelection();
        if (!$isRangeSelection(sel)) return false;
        // sel.getNodes() returns every node touched by the selection,
        // including chips even though they're decorator nodes — the
        // selection range itself is at the text level, but Lexical
        // walks contents and surfaces the chips in between.
        for (const node of sel.getNodes()) {
          if (node instanceof VariableChipNode) {
            const current = node.getFormat();
            node.setFormat(current ^ bit);
          }
        }
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);
  return null;
}
