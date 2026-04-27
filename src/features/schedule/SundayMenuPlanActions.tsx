import { Link } from "@/lib/nav";

interface Props {
  date: string;
  onSelect: () => void;
}

/** Top section of the SundayTypeMenu surfaced on the mobile list view.
 *  Replaces the desktop card's hover-revealed plan links — the menu is
 *  the only place these actions live on a phone. Calls `onSelect` after
 *  navigation so the menu closes itself. */
export function SundayMenuPlanActions({ date, onSelect }: Props) {
  return (
    <>
      <Link
        role="menuitem"
        to={`/plan/${date}`}
        onClick={onSelect}
        className="flex items-center gap-2 w-full px-2.5 py-1.5 text-left font-display text-[13px] rounded-sm text-walnut hover:bg-parchment transition-colors"
      >
        <PlusIcon />
        <span>Plan speakers</span>
      </Link>
      <Link
        role="menuitem"
        to={`/plan/${date}/prayers`}
        onClick={onSelect}
        className="flex items-center gap-2 w-full px-2.5 py-1.5 text-left font-display text-[13px] rounded-sm text-walnut hover:bg-parchment transition-colors"
      >
        <PlusIcon />
        <span>Plan prayers</span>
      </Link>
      <div className="border-t border-border my-1.5" />
    </>
  );
}

function PlusIcon() {
  return (
    <span className="w-4 h-4 border border-bordeaux rounded-sm flex items-center justify-center text-bordeaux shrink-0">
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
    </span>
  );
}
