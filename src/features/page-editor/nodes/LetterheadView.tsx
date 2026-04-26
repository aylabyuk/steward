import { useState } from "react";
import { $getNodeByKey, type NodeKey } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { interpolate } from "@/features/templates/interpolate";
import { EditPropModal } from "../EditPropModal";
import { useLetterVars } from "../letterRenderContext";
import { LETTER_VARIABLES } from "../letterVariables";
import { DEFAULT_EYEBROW, DEFAULT_SUBTITLE, DEFAULT_TITLE, LetterheadNode } from "./LetterheadNode";

interface Props {
  nodeKey: NodeKey;
  eyebrow: string;
  title: string;
  subtitle: string;
}

const TITLES = {
  eyebrow: "Edit eyebrow",
  title: "Edit title",
  subtitle: "Edit sub-eyebrow",
} as const;

/** Click-to-edit letterhead decorator. Lifted out of the node module
 *  to keep the class file under the per-file LOC cap. */
export function LetterheadView({ nodeKey, eyebrow, title, subtitle }: Props) {
  const [editor] = useLexicalComposerContext();
  const vars = useLetterVars();
  const [editing, setEditing] = useState<"eyebrow" | "title" | "subtitle" | null>(null);

  function save(next: string) {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (!(node instanceof LetterheadNode)) return;
      if (editing === "eyebrow") node.setEyebrow(next.trim() || DEFAULT_EYEBROW);
      else if (editing === "title") node.setTitle(next.trim() || DEFAULT_TITLE);
      else if (editing === "subtitle") node.setSubtitle(next.trim() || DEFAULT_SUBTITLE);
    });
    setEditing(null);
  }

  const initials = { eyebrow, title, subtitle };

  return (
    <>
      <div
        contentEditable={false}
        className="select-none text-center pb-5 border-b border-border mb-8"
      >
        <div className="flex items-center justify-center gap-3.5 mb-3.5">
          <span
            aria-hidden
            className="w-9 h-9 border border-brass-soft rounded-full inline-flex items-center justify-center text-brass-deep text-lg"
          >
            ✦
          </span>
        </div>
        <button
          type="button"
          onClick={() => setEditing("eyebrow")}
          className="block w-full font-mono text-[11px] tracking-[0.3em] uppercase text-walnut-3 mb-2 hover:underline focus:outline-none"
        >
          {interpolate(eyebrow, vars)}
        </button>
        <button
          type="button"
          onClick={() => setEditing("title")}
          className="block w-full font-display text-[28px] italic text-walnut tracking-[-0.01em] hover:underline focus:outline-none"
        >
          {interpolate(title, vars)}
        </button>
        <button
          type="button"
          onClick={() => setEditing("subtitle")}
          className="block w-full mt-2.5 font-mono text-[10px] tracking-[0.22em] uppercase text-walnut-3 hover:underline focus:outline-none"
        >
          {interpolate(subtitle, vars)}
        </button>
      </div>
      <EditPropModal
        open={editing !== null}
        title={editing ? TITLES[editing] : ""}
        initial={editing ? initials[editing] : ""}
        variables={LETTER_VARIABLES}
        onSave={save}
        onCancel={() => setEditing(null)}
      />
    </>
  );
}
