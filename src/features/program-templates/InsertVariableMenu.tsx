import { useEffect, useRef, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection } from "lexical";
import type { ProgramVariable } from "./programVariables";
import { $createVariableChipNode } from "./nodes/VariableChipNode";

interface Props {
  /** Full list of variables the host editor exposes. The menu groups
   *  them by `variable.group` in the order they first appear. */
  variables: readonly ProgramVariable[];
  /** Map from group key → human label shown above each group. */
  groupLabels: Readonly<Record<string, string>>;
}

/** Toolbar dropdown that lists every variable the host editor exposes,
 *  grouped by purpose. Picking one inserts a `VariableChipNode` at
 *  the current selection and closes the menu. Generic — works for the
 *  program template editor and the speaker-letter editor. */
export function InsertVariableMenu({ variables, groupLabels }: Props) {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const groupOrder: string[] = [];
  for (const v of variables) if (!groupOrder.includes(v.group)) groupOrder.push(v.group);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  function insert(token: string) {
    editor.update(() => {
      const sel = $getSelection();
      if (!$isRangeSelection(sel)) return;
      sel.insertNodes([$createVariableChipNode(token)]);
    });
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="h-8 px-2.5 rounded-md font-mono text-[11px] uppercase tracking-[0.12em] text-walnut-2 hover:bg-parchment-2 hover:text-walnut transition-colors flex items-center gap-1"
      >
        Insert variable <span className="text-walnut-3">▾</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-1 w-72 max-h-80 overflow-y-auto rounded-lg border border-border bg-chalk shadow-elev-3 z-50 py-1"
        >
          {groupOrder.map((group) => {
            const items = variables.filter((v) => v.group === group);
            if (items.length === 0) return null;
            return (
              <div key={group} className="py-0.5">
                <div className="px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-walnut-3">
                  {groupLabels[group] ?? group}
                </div>
                {items.map((v) => (
                  <button
                    key={v.token}
                    type="button"
                    role="menuitem"
                    onClick={() => insert(v.token)}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-parchment-2 flex items-baseline justify-between gap-3"
                  >
                    <span className="font-sans text-[13px] text-walnut">{v.label}</span>
                    <span className="font-mono text-[10px] text-walnut-3">{`{{${v.token}}}`}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
