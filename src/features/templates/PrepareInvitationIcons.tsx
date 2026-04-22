/** Toolbar-specific icons for `PrepareInvitationActionBar` — kept in
 *  their own module so the action-bar file stays under the 150-LOC
 *  ceiling. Reusable icons used elsewhere (Check / Print / Send /
 *  Remove / Mail) live in `SpeakerInviteIcons`. */

const baseProps = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: "1.75",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function RevertIcon() {
  return (
    <svg width="14" height="14" {...baseProps} aria-hidden>
      <path d="M3 7v6h6" />
      <path d="M3 13a9 9 0 1 0 3-7.7L3 9" />
    </svg>
  );
}

export function SmsIcon() {
  return (
    <svg width="14" height="14" {...baseProps} aria-hidden>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}
