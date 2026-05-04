import { Link } from "@/lib/nav";
import { cn } from "@/lib/cn";
import { SaveIndicator } from "./SaveIndicator";

interface Props {
  date: string;
  ready: boolean;
  remaining: number;
}

/** Floating bottom save bar. Left: save indicator. Right: prepare-to-
 *  print shortcut. The button is always visible — disabled with a
 *  tooltip when the meeting still has unfilled items, so the bishop
 *  knows the action exists and what's blocking it. */
export function ProgramSaveBar({ date, ready, remaining }: Props) {
  const blockedTitle = ready
    ? undefined
    : `Finish ${remaining} item${remaining === 1 ? "" : "s"} to print`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-chalk border-t border-border shadow-[0_-6px_20px_rgba(35,24,21,0.08)]">
      {/* Mobile: stack the indicator above the button so a long error
          message ("Couldn't save — Connection failed…") doesn't wrap
          inside a cramped row next to a big CTA. Desktop: everything
          on one line. */}
      <div className="flex flex-col gap-2 px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:gap-3.5 sm:px-8 sm:py-3 sm:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <SaveIndicator />
        <span className="hidden sm:block sm:flex-1" />
        <PrepareLink date={date} ready={ready} blockedTitle={blockedTitle} />
      </div>
    </div>
  );
}

interface LinkProps {
  date: string;
  ready: boolean;
  blockedTitle: string | undefined;
}

function PrepareLink({ date, ready, blockedTitle }: LinkProps) {
  const className = cn(
    "font-sans text-[13px] font-semibold px-3.5 py-2 rounded-md border inline-flex items-center gap-1.5 transition-colors",
    ready
      ? "bg-bordeaux border-bordeaux-deep text-parchment shadow-[0_1px_0_rgba(35,24,21,0.18)] hover:bg-bordeaux-deep"
      : "bg-chalk border-border text-walnut-3 cursor-not-allowed",
  );
  if (!ready) {
    return (
      <span className={className} aria-disabled="true" title={blockedTitle}>
        <PrinterIcon />
        Prepare to print
      </span>
    );
  }
  return (
    <Link to={`/week/${date}/prepare`} className={className}>
      <PrinterIcon />
      Prepare to print
    </Link>
  );
}

function PrinterIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9V2h12v7" />
      <rect x="3" y="9" width="18" height="9" rx="2" />
      <path d="M6 14h12v7H6z" />
    </svg>
  );
}
