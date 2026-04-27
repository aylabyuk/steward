import type { VariableMeta } from "@/features/page-editor/utils/variableRegistry";

interface Props {
  variables: ReadonlyArray<VariableMeta>;
  groupLabels: Record<string, string>;
  currentToken: string;
  onPick: (token: string) => void;
}

/** Popover body for the variable chip's click-to-change picker.
 *  Lifted out of `VariableChipNode` so the chip's React view stays
 *  under the 150-LOC-per-function lint cap. Mirrors the toolbar's
 *  `VariableMenu` layout (grouped sections with a divider between
 *  them, each row showing the variable's label + sample preview)
 *  so the bishop's two ways to insert / swap a variable feel like
 *  the same component family. */
export function VariableChipPicker({ variables, groupLabels, currentToken, onPick }: Props) {
  const groups = groupVariables(variables);
  return (
    <span
      contentEditable={false}
      style={{
        position: "absolute",
        top: "calc(100% + 4px)",
        left: 0,
        zIndex: 50,
        display: "block",
        minWidth: 240,
        maxHeight: 320,
        overflowY: "auto",
        background: "var(--color-chalk)",
        border: "1px solid var(--color-border-strong)",
        borderRadius: 8,
        boxShadow: "0 12px 32px rgba(35, 24, 21, 0.18)",
        padding: 4,
        fontFamily: "var(--font-sans)",
        userSelect: "none",
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {groups.map(([group, items], i) => (
        <span key={group || `g${i}`} style={{ display: "block" }}>
          {i > 0 && (
            <span
              style={{
                display: "block",
                height: 1,
                background: "var(--color-border)",
                margin: "4px 0",
              }}
            />
          )}
          {group && (
            <span
              style={{
                display: "block",
                fontFamily: "var(--font-mono)",
                fontSize: 9.5,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--color-brass-deep)",
                padding: "8px 10px 4px",
              }}
            >
              {groupLabels[group] ?? group}
            </span>
          )}
          {items.map((v) => (
            <PickerRow
              key={v.token}
              variable={v}
              active={v.token === currentToken}
              onPick={onPick}
            />
          ))}
        </span>
      ))}
    </span>
  );
}

function PickerRow({
  variable,
  active,
  onPick,
}: {
  variable: VariableMeta;
  active: boolean;
  onPick: (token: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(variable.token)}
      onMouseDown={(e) => e.preventDefault()}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        width: "100%",
        padding: "6px 10px",
        borderRadius: 4,
        border: 0,
        background: active
          ? "color-mix(in srgb, var(--color-bordeaux) 12%, transparent)"
          : "transparent",
        color: "var(--color-walnut)",
        cursor: "pointer",
        textAlign: "left",
        font: "inherit",
      }}
    >
      <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 13 }}>{variable.label}</span>
        {variable.sample && (
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: 11.5,
              color: "var(--color-walnut-3)",
            }}
          >
            {variable.sample}
          </span>
        )}
      </span>
    </button>
  );
}

function groupVariables(variables: ReadonlyArray<VariableMeta>): Array<[string, VariableMeta[]]> {
  const out: Array<[string, VariableMeta[]]> = [];
  for (const v of variables) {
    const last = out.at(-1);
    const g = v.group ?? "";
    if (last && last[0] === g) last[1].push(v);
    else out.push([g, [v]]);
  }
  return out;
}
