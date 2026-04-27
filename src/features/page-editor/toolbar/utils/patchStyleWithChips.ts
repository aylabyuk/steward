import { $getSelection, $isRangeSelection, type LexicalEditor } from "lexical";
import { $patchStyleText } from "@lexical/selection";
import { VariableChipNode } from "@/features/program-templates/nodes/VariableChipNode";

/** Applies a Lexical style patch (`{color: "#fff"}`,
 *  `{"background-color": null}`, `{"font-family": "Inter"}`, …) to
 *  the current selection — both to TextNodes (via the official
 *  `$patchStyleText`) AND to any `VariableChipNode` in the same
 *  range. Without this layer, color / highlight / font-family /
 *  font-size pickers would patch the surrounding text but skip the
 *  chip, so a "Brother Park" chip wouldn't change colour while the
 *  comma after it would — visibly inconsistent. */
export function patchSelectionStyle(
  editor: LexicalEditor,
  patch: Record<string, string | null>,
): void {
  editor.update(() => {
    const sel = $getSelection();
    if (!$isRangeSelection(sel)) return;
    $patchStyleText(sel, patch);
    for (const node of sel.getNodes()) {
      if (node instanceof VariableChipNode) node.patchStyle(patch);
    }
  });
}
