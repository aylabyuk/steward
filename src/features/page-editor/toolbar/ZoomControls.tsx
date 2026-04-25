import { Icon } from "./Icon";

interface Props {
  zoom: number;
  onChange: (next: number) => void;
}

/** Matches the design kit's `.tb-zoom`: minus / mono % / plus. */
export function ZoomControls({ zoom, onChange }: Props) {
  function step(delta: number) {
    onChange(Math.max(0.5, Math.min(2, +(zoom + delta).toFixed(2))));
  }
  return (
    <div className="tb-zoom" title="Zoom">
      <button
        type="button"
        className="tb-fontsize__btn"
        onClick={() => step(-0.1)}
        onMouseDown={(e) => e.preventDefault()}
      >
        <Icon name="minus" size={12} sw={2.25} />
      </button>
      <span className="tb-zoom__val">{Math.round(zoom * 100)}%</span>
      <button
        type="button"
        className="tb-fontsize__btn"
        onClick={() => step(0.1)}
        onMouseDown={(e) => e.preventDefault()}
      >
        <Icon name="plus" size={12} sw={2.25} />
      </button>
    </div>
  );
}
