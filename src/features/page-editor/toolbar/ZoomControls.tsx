import { ToolbarButton, ToolbarSep } from "./ToolbarButton";

interface Props {
  zoom: number;
  onChange: (next: number) => void;
}

const STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2];

/** Word/Docs-style zoom controls — minus / current % / plus / reset.
 *  The chip in the middle cycles through preset levels so the bishop
 *  can hit common values (75 / 100 / 125) without dragging. */
export function ZoomControls({ zoom, onChange }: Props) {
  function step(delta: number) {
    onChange(Math.max(0.4, Math.min(2.5, +(zoom + delta).toFixed(2))));
  }
  function nextPreset() {
    const idx = STEPS.findIndex((s) => Math.abs(s - zoom) < 0.05);
    const next = STEPS[(idx + 1) % STEPS.length] ?? 1;
    onChange(next);
  }
  return (
    <>
      <ToolbarSep />
      <ToolbarButton label="Zoom out" onClick={() => step(-0.1)}>
        −
      </ToolbarButton>
      <button
        type="button"
        title="Cycle zoom preset"
        onClick={nextPreset}
        onMouseDown={(e) => e.preventDefault()}
        className="h-8 min-w-14 px-2 rounded-md text-walnut hover:bg-parchment-2 font-mono text-[11.5px] tabular-nums"
      >
        {Math.round(zoom * 100)}%
      </button>
      <ToolbarButton label="Zoom in" onClick={() => step(0.1)}>
        ＋
      </ToolbarButton>
      <ToolbarButton label="Reset zoom" onClick={() => onChange(1)} className="text-[11px] px-1.5">
        100%
      </ToolbarButton>
    </>
  );
}
