import type { PreviewSide } from "./panelLayoutStorage";

interface Props {
  previewSide: PreviewSide;
  onClick: () => void;
}

/** Tiny icon button in the editor header that flips the preview from
 *  the right to the left side of the page (or back). Hidden on
 *  mobile since the layout there is single-column. */
export function SwapSidesButton({ previewSide, onClick }: Props) {
  const label = previewSide === "left" ? "Move preview to the right" : "Move preview to the left";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="hidden lg:inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-walnut-3 hover:bg-parchment-2 hover:text-walnut transition-colors"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M7 7h13M7 7l3-3M7 7l3 3" />
        <path d="M17 17H4M17 17l-3 3M17 17l-3-3" />
      </svg>
    </button>
  );
}
