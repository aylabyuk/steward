import { $getSelection, $isRangeSelection, type LexicalEditor } from "lexical";
import { $createVariableChipNode } from "@/features/program-templates/nodes/VariableChipNode";
import { Icon } from "./Icon";
import { usePopover } from "./usePopover";

export interface VariableEntry {
  token: string;
  label: string;
  /** Group key — used to render group headers in the popover. The
   *  human-readable name comes from `groupLabels[group]`. */
  group: string;
  /** Sample-value preview shown beside the row in the dropdown so
   *  the bishop can see what the chip would resolve to (e.g.
   *  `Brother Park`, `Sunday, May 31, 2026`). Optional — rows
   *  without a sample fall back to the bare `{{token}}` line. */
  sample?: string;
}

interface Props {
  editor: LexicalEditor;
  variables: ReadonlyArray<VariableEntry>;
  groupLabels: Record<string, string>;
}

/** Variables dropdown — replaces the variable rows that used to live
 *  in the Insert popover. Items are grouped by category so a 20-token
 *  program palette stays scannable; each click inserts a
 *  `VariableChipNode` at the current selection. */
export function VariableMenu({ editor, variables, groupLabels }: Props) {
  const pop = usePopover();
  function insert(token: string) {
    editor.update(() => {
      const sel = $getSelection();
      if ($isRangeSelection(sel)) sel.insertNodes([$createVariableChipNode(token)]);
    });
    pop.setOpen(false);
  }
  const groups = groupVariables(variables);
  return (
    <div ref={pop.ref} style={{ position: "relative" }}>
      <button
        type="button"
        title="Insert variable"
        className="tb-btn"
        onClick={() => pop.setOpen((o) => !o)}
        onMouseDown={(e) => e.preventDefault()}
      >
        <Icon name="braces" sw={1.75} />
        <span>Variables</span>
        <Icon name="chevronDown" size={11} className="caret lucide" sw={2} />
      </button>
      {pop.open && (
        <div
          className="tb-popover"
          style={{
            position: "absolute",
            top: 38,
            left: 0,
            minWidth: 240,
            maxHeight: 360,
            overflowY: "auto",
          }}
        >
          {groups.map(([group, items], i) => (
            <div key={group}>
              {i > 0 && <div className="tb-popover__divider" />}
              <div className="tb-popover__label">{groupLabels[group] ?? group}</div>
              {items.map((v) => (
                <button
                  key={v.token}
                  type="button"
                  className="tb-popover__item"
                  onClick={() => insert(v.token)}
                  onMouseDown={(e) => e.preventDefault()}
                  title={`Inserts {{${v.token}}}`}
                >
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    <span>{v.label}</span>
                    {v.sample && (
                      <span
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontStyle: "italic",
                          fontSize: 11.5,
                          color: "var(--color-walnut-3)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {v.sample}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function groupVariables(variables: ReadonlyArray<VariableEntry>): Array<[string, VariableEntry[]]> {
  const out: Array<[string, VariableEntry[]]> = [];
  for (const v of variables) {
    const last = out.at(-1);
    if (last && last[0] === v.group) last[1].push(v);
    else out.push([v.group, [v]]);
  }
  return out;
}
