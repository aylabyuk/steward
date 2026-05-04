import { Link } from "@/lib/nav";
import type { ReadinessReport } from "@/features/meetings/utils/readiness";
import { formatLongDate } from "./utils/programData";

interface Props {
  date: string;
  report: ReadinessReport;
}

/** Centred "not ready" card. Caller wraps in whatever container fits the
 *  context (full-viewport for the print routes, AppShell content area
 *  for the prepare page). */
export function NotReadyBlock({ date, report }: Props) {
  const remaining = report.missing.length + report.unconfirmed.length;
  return (
    <div className="max-w-lg mx-auto text-center">
      <p className="font-display text-[20px] text-walnut mb-2">Not ready to print</p>
      <p className="font-serif italic text-[13.5px] text-walnut-2 mb-4">
        The program for <strong>{formatLongDate(date)}</strong> still has {remaining} item
        {remaining === 1 ? "" : "s"} to fill before it's ready.
      </p>
      <ul className="text-left inline-block list-disc text-[13.5px] text-walnut-2 mb-4 max-h-60 overflow-y-auto">
        {report.missing.map((m) => (
          <li key={`m-${m}`}>{m}</li>
        ))}
        {report.unconfirmed.map((u) => (
          <li key={`u-${u}`}>{u}</li>
        ))}
      </ul>
      <div>
        <Link
          to={`/week/${date}`}
          className="font-sans text-[13px] font-semibold px-3.5 py-2 rounded-md border border-bordeaux-deep bg-bordeaux text-parchment hover:bg-bordeaux-deep transition-colors"
        >
          Back to the program
        </Link>
      </div>
    </div>
  );
}
