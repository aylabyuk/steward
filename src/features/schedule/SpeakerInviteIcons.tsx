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

export function RemoveIcon() {
  return (
    <svg width="14" height="14" {...baseProps}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
