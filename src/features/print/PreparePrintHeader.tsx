import { Link } from "@/lib/nav";
import { formatLongDate } from "./utils/programData";

interface Props {
  date: string;
  printSegment: string;
  usingOverride: boolean;
}

/** Top bar of /week/:date/prepare. Mirrors the chrome of the program-
 *  templates editor: eyebrow back link, title, date, and a primary
 *  "Print …" CTA whose label tracks the active tab. A small green
 *  "Customised for this Sunday" pill appears once a per-Sunday
 *  override has been saved — there's no chrome in the default state. */
export function PreparePrintHeader({ date, printSegment, usingOverride }: Props) {
  return (
    <header className="shrink-0 border-b border-border bg-chalk px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
      <div className="flex flex-col gap-1 min-w-0">
        <Link
          to={`/week/${date}`}
          className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brass-deep hover:text-walnut"
        >
          ← Back to the program
        </Link>
        <h1 className="font-display text-[22px] sm:text-[26px] font-semibold text-walnut leading-tight">
          Prepare to print
        </h1>
        <p className="font-serif italic text-[12.5px] text-walnut-2 m-0">{formatLongDate(date)}</p>
      </div>
      <div className="flex items-center gap-2">
        <StatusPill usingOverride={usingOverride} />
        <Link
          to={`/print/${date}/${printSegment}`}
          className="inline-flex items-center gap-1.5 font-sans text-[13px] font-semibold px-3.5 py-2 rounded-md border border-bordeaux-deep bg-bordeaux text-parchment shadow-[0_1px_0_rgba(35,24,21,0.18)] hover:bg-bordeaux-deep transition-colors"
        >
          Print {printSegment}
        </Link>
      </div>
    </header>
  );
}

function StatusPill({ usingOverride }: { usingOverride: boolean }) {
  if (!usingOverride) return null;
  return (
    <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-success-soft bg-success/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-success">
      <span aria-hidden>●</span>
      Customised for this Sunday
    </span>
  );
}
