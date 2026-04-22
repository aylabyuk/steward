interface Props {
  zoomPercent: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

/** Pill-shaped zoom toolbar shown at the bottom-left of the letter
 *  preview: minus / current % / plus / reset. Scale percentage is
 *  100% at the letter's natural 1:1 print size, so a fit-to-column
 *  initial view typically reads as ~65%. */
export function LetterPreviewZoomControls({ zoomPercent, onZoomIn, onZoomOut, onReset }: Props) {
  return (
    <div className="absolute bottom-3 left-3 z-10 inline-flex items-center isolate rounded-full bg-chalk border border-border-strong shadow-[0_4px_12px_rgba(35,24,21,0.12)] overflow-hidden">
      <ZoomBtn onClick={onZoomOut} label="Zoom out">
        <MinusIcon />
      </ZoomBtn>
      <button
        type="button"
        onClick={onReset}
        title="Reset zoom"
        aria-label="Reset zoom"
        className="px-2.5 py-1 font-mono text-[11px] text-walnut tabular-nums hover:bg-parchment-2 transition-colors min-w-12 text-center"
      >
        {zoomPercent}%
      </button>
      <ZoomBtn onClick={onZoomIn} label="Zoom in">
        <PlusIcon />
      </ZoomBtn>
    </div>
  );
}

function ZoomBtn({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="px-2 py-1.5 text-walnut hover:bg-parchment-2 transition-colors focus:outline-none focus:ring-2 focus:ring-bordeaux/30 focus:z-10"
    >
      {children}
    </button>
  );
}

function PlusIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M5 12h14" />
    </svg>
  );
}
