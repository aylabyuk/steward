import { useState } from "react";
import { $getNodeByKey, type NodeKey } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { interpolate } from "@/features/templates/utils/interpolate";
import { EditPropModal } from "../EditPropModal";
import { useLetterVars } from "../utils/letterRenderContext";
import { LETTER_VARIABLES } from "../utils/letterVariables";
import { DEFAULT_CLOSING, DEFAULT_SIGNATORY, SignatureBlockNode } from "./SignatureBlockNode";

interface Props {
  nodeKey: NodeKey;
  closing: string;
  signatory: string;
}

/** Click-to-edit signature block decorator. Lifted out of the node
 *  module to keep the class file under the per-file LOC cap. */
export function SignatureBlockView({ nodeKey, closing, signatory }: Props) {
  const [editor] = useLexicalComposerContext();
  const vars = useLetterVars();
  const [editing, setEditing] = useState<"closing" | "signatory" | null>(null);

  function save(next: string) {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (!(node instanceof SignatureBlockNode)) return;
      if (editing === "closing") node.setClosing(next.trim() || DEFAULT_CLOSING);
      else if (editing === "signatory") node.setSignatory(next.trim() || DEFAULT_SIGNATORY);
    });
    setEditing(null);
  }

  return (
    <>
      <div contentEditable={false} className="select-none mt-7 mb-2 [&_.sig-rule]:border-walnut-3">
        <button
          type="button"
          onClick={() => setEditing("closing")}
          className="block font-serif italic text-[16px] text-walnut mb-2 text-left hover:underline focus:outline-none"
        >
          {interpolate(closing, vars)}
        </button>
        <div className="sig-rule border-b border-walnut-3 w-[260px] mb-1.5" />
        <button
          type="button"
          onClick={() => setEditing("signatory")}
          className="block font-mono text-[10px] tracking-[0.18em] uppercase text-walnut-3 text-left hover:underline focus:outline-none"
        >
          {interpolate(signatory, vars)}
        </button>
      </div>
      <EditPropModal
        open={editing !== null}
        title={editing === "signatory" ? "Edit signed-by line" : "Edit closing phrase"}
        initial={editing === "signatory" ? signatory : closing}
        variables={LETTER_VARIABLES}
        onSave={save}
        onCancel={() => setEditing(null)}
      />
    </>
  );
}
