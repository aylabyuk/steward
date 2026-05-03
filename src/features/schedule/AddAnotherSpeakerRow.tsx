import { Link } from "@/lib/nav";

interface Props {
  /** Meeting date (ISO YYYY-MM-DD) — destination is the same
   *  per-row Assign + Invite flow that empty placeholder rows use. */
  date: string;
}

/** "+ Add another speaker" affordance shown below the filled
 *  speaker rows when the count is at or above the floor but below
 *  the ceiling. Visually distinct from a slot placeholder: no
 *  numbered leading column (since this is an action, not a slot),
 *  brass `+` glyph + walnut verb. Mirrors the iOS `addSpeakerRow`
 *  pattern on `MeetingCardBody`. */
export function AddAnotherSpeakerRow({ date }: Props) {
  return (
    <li className="border-b border-border last:border-b-0">
      <Link
        to={`/week/${date}/speaker/new/assign`}
        className="flex items-center gap-3 h-12 group/add hover:bg-parchment-2 transition-colors"
      >
        {/* Spacer matching the leading-label column on the rows above
            so the pill aligns with the assignee-name column. */}
        <div className="w-6 shrink-0" aria-hidden="true" />
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-brass bg-parchment-2 text-brass-deep shrink-0">
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <span className="font-sans text-[13px] text-walnut-2 group-hover/add:text-walnut">
            Add another speaker
          </span>
        </div>
      </Link>
    </li>
  );
}
