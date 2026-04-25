/** Inline caption shown above the form fields on a non-planned
 *  speaker card in step 1 of the Assign-Speakers modal. The fields
 *  remain editable (the project rule disallows hard locks on
 *  status), but a small lock glyph + reminder explains why edits
 *  here won't reach the already-sent invitation. */
export function SoftLockedNote() {
  return (
    <p
      className="mb-2.5 font-serif italic text-[12px] text-walnut-3 flex items-start gap-1.5"
      title="Edits to a speaker that's already been invited stay local until you resend the invitation."
    >
      <LockGlyph />
      <span>Edits won't update the sent invitation. Resend to push changes.</span>
    </p>
  );
}

function LockGlyph() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="mt-0.5 shrink-0 text-brass-deep"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
