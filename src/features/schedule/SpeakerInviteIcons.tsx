/** Inline icons for the invite action row, kept in their own module so
 *  Biome's JSX split doesn't push SpeakerInviteAction past 150 LOC. */

const baseProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.75",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function MailIcon() {
  return (
    <svg width="14" height="14" {...baseProps} className="text-brass-deep shrink-0">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg width="12" height="12" {...baseProps}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function PrintIcon() {
  return (
    <svg width="12" height="12" {...baseProps}>
      <path d="M6 9V2h12v7" />
      <rect x="3" y="9" width="18" height="9" rx="2" />
      <path d="M6 14h12v7H6z" />
    </svg>
  );
}

export function SendIcon() {
  return (
    <svg width="12" height="12" {...baseProps}>
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

export function RemoveIcon() {
  return (
    <svg width="14" height="14" {...baseProps}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
