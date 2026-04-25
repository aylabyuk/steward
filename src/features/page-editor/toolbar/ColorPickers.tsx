import { $getSelection, $isRangeSelection, type LexicalEditor } from "lexical";
import { $patchStyleText } from "@lexical/selection";
import { Icon } from "./Icon";
import { usePopover } from "./usePopover";

const FONT_COLORS = [
  "#3B2A22",
  "#8B2E2A",
  "#6B1F1C",
  "#C89B5A",
  "#8E6A36",
  "#5A4636",
  "#8A7460",
  "#4E6B3A",
  "#B97A19",
  "#3F5B6B",
  "#231815",
  "#FBF6EE",
  "#FFFFFF",
  "#000000",
];

const BG_COLORS = [
  "transparent",
  "#F3E3DC",
  "#F4ECDC",
  "#E9DCC2",
  "#F6E6C4",
  "#DCE5EB",
  "#E2EAD3",
  "#F3DAD5",
  "#FBF6EE",
  "#E0BE87",
  "#C89B5A",
  "#8B2E2A",
  "#3B2A22",
  "#231815",
];

interface Props {
  editor: LexicalEditor;
  current: string;
}

function patch(editor: LexicalEditor, style: Record<string, string | null>) {
  editor.update(() => {
    const sel = $getSelection();
    if ($isRangeSelection(sel)) $patchStyleText(sel, style);
  });
}

export function FontColorPicker({ editor, current }: Props) {
  const pop = usePopover();
  return (
    <div ref={pop.ref} style={{ position: "relative" }}>
      <button
        type="button"
        title="Text color"
        className="tb-color"
        onClick={() => pop.setOpen((o) => !o)}
        onMouseDown={(e) => e.preventDefault()}
      >
        <span className="tb-color__icon-wrap">
          <Icon name="type" size={14} sw={2} />
          <span className="tb-color__swatch" style={{ background: current }} />
        </span>
        <Icon name="chevronDown" size={11} sw={2} className="tb-color__caret lucide" />
      </button>
      {pop.open && (
        <div className="tb-popover" style={{ position: "absolute", top: 38, left: 0 }}>
          <div className="tb-popover__label">Text color</div>
          <div className="tb-color-grid">
            {FONT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                className="tb-color-swatch"
                style={{ background: c }}
                onClick={() => {
                  patch(editor, { color: c });
                  pop.setOpen(false);
                }}
                onMouseDown={(e) => e.preventDefault()}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function BgColorPicker({ editor, current }: Props) {
  const pop = usePopover();
  const swatchBg = current === "transparent" ? "var(--color-brass-soft)" : current;
  return (
    <div ref={pop.ref} style={{ position: "relative" }}>
      <button
        type="button"
        title="Highlight color"
        className="tb-color"
        onClick={() => pop.setOpen((o) => !o)}
        onMouseDown={(e) => e.preventDefault()}
      >
        <span className="tb-color__icon-wrap">
          <Icon name="highlight" size={14} sw={2} />
          <span className="tb-color__swatch" style={{ background: swatchBg }} />
        </span>
        <Icon name="chevronDown" size={11} sw={2} className="tb-color__caret lucide" />
      </button>
      {pop.open && (
        <div className="tb-popover" style={{ position: "absolute", top: 38, left: 0 }}>
          <div className="tb-popover__label">Highlight</div>
          <div className="tb-color-grid">
            {BG_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c === "transparent" ? "No highlight" : c}
                className={
                  c === "transparent" ? "tb-color-swatch tb-color-swatch--clear" : "tb-color-swatch"
                }
                style={c === "transparent" ? undefined : { background: c }}
                onClick={() => {
                  patch(editor, { "background-color": c === "transparent" ? null : c });
                  pop.setOpen(false);
                }}
                onMouseDown={(e) => e.preventDefault()}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
