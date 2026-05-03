interface Props {
  onClick: () => void;
  /** Visible label. Defaults to "Close". Pages with a routing-style
   *  cancel pass "Cancel" here. */
  label?: string;
  /** Defaults to the visible label. Override when more context helps
   *  screen readers (e.g. "Close conversation"). */
  ariaLabel?: string;
}

/** Labeled close affordance for sticky headers and drawer headers —
 *  X icon + visible text, 44px hit target, focus ring. Replaces the
 *  small icon-only or tiny-mono-text close patterns that users
 *  couldn't find. */
export function HeaderCloseButton({ onClick, label = "Close", ariaLabel }: Props) {
  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel ?? label} className={CLASSES}>
      <HeaderCloseIcon />
      <span>{label}</span>
    </button>
  );
}

export const HEADER_CLOSE_BUTTON_CLASSES =
  "shrink-0 inline-flex items-center gap-1.5 min-h-11 rounded-md px-2.5 py-2 font-sans text-[13px] font-medium text-walnut-2 hover:text-bordeaux hover:bg-parchment-2 focus:outline-none focus:ring-2 focus:ring-bordeaux/30";

const CLASSES = HEADER_CLOSE_BUTTON_CLASSES;

export function HeaderCloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
