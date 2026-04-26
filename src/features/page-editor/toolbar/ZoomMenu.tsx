import { Icon } from "./Icon";
import { usePopover } from "./usePopover";

export type ZoomMode =
  | { kind: "manual"; value: number }
  | { kind: "fit-width" }
  | { kind: "fit-page" };

interface Props {
  /** Effective zoom factor (always a number). The host derives this
   *  from `mode` plus `fitWidth` / `fitPage` for the fit modes. */
  zoom: number;
  mode: ZoomMode;
  onMode: (next: ZoomMode) => void;
}

const PERCENTS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

/** Replaces the bare minus / % / plus stepper with a popover-driven
 *  preset menu plus the same +/- buttons. Picking "Fit width" or
 *  "Fit page" puts the host into fit mode so window resizes re-apply
 *  the right factor; clicking +/− or a fixed % pins manual mode. */
export function ZoomMenu({ zoom, mode, onMode }: Props) {
  const pop = usePopover();
  function step(delta: number) {
    const next = Math.max(0.4, Math.min(2.5, +(zoom + delta).toFixed(2)));
    onMode({ kind: "manual", value: next });
  }
  return (
    <div ref={pop.ref} style={{ position: "relative" }}>
      <div className="tb-zoom" title="Zoom">
        <button
          type="button"
          className="tb-fontsize__btn"
          onClick={() => step(-0.1)}
          onMouseDown={(e) => e.preventDefault()}
        >
          <Icon name="minus" size={12} sw={2.25} />
        </button>
        <button
          type="button"
          className="tb-zoom__val"
          onClick={() => pop.setOpen((o) => !o)}
          onMouseDown={(e) => e.preventDefault()}
          style={{
            background: "transparent",
            border: 0,
            cursor: "pointer",
            padding: 0,
            color: "inherit",
            font: "inherit",
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <span>{Math.round(zoom * 100)}%</span>
          <Icon name="chevronDown" size={11} className="caret lucide" sw={2} />
        </button>
        <button
          type="button"
          className="tb-fontsize__btn"
          onClick={() => step(0.1)}
          onMouseDown={(e) => e.preventDefault()}
        >
          <Icon name="plus" size={12} sw={2.25} />
        </button>
      </div>
      {pop.open && (
        <div
          className="tb-popover"
          style={{ position: "absolute", top: 38, right: 0, minWidth: 180 }}
        >
          <Item
            active={mode.kind === "fit-width"}
            label="Fit width"
            onClick={() => {
              onMode({ kind: "fit-width" });
              pop.setOpen(false);
            }}
          />
          <Item
            active={mode.kind === "fit-page"}
            label="Fit page"
            onClick={() => {
              onMode({ kind: "fit-page" });
              pop.setOpen(false);
            }}
          />
          <div className="tb-popover__divider" />
          {PERCENTS.map((p) => (
            <Item
              key={p}
              active={mode.kind === "manual" && Math.abs(mode.value - p) < 0.005}
              label={`${Math.round(p * 100)}%`}
              onClick={() => {
                onMode({ kind: "manual", value: p });
                pop.setOpen(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Item({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="tb-popover__item"
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      style={
        active
          ? { background: "color-mix(in srgb, var(--color-bordeaux) 12%, transparent)" }
          : undefined
      }
    >
      <span style={{ flex: 1 }}>{label}</span>
      {active && <Icon name="check" size={14} sw={2} />}
    </button>
  );
}
