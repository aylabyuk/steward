import { Link } from "@/lib/nav";
import { cn } from "@/lib/cn";
import type { ReadinessReport } from "../utils/readiness";

interface Props {
  date: string;
  report: ReadinessReport;
}

const STROKE = "currentColor";
const ICON_BASE = "h-3 w-3";
const PATH_CHECK = "M20 6L9 17l-5-5";
const PATH_ALERT_BANG = "M12 9v4M12 17h.01";
const PATH_ALERT_TRI =
  "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z";
const PATH_PRINTER = "M6 9V2h12v7";
const PATH_PRINTER_TRAY = "M6 14h12v7H6z";

/** Top-of-editor panel that drives printing. When ready, it surfaces
 *  the two print-nav links front and centre; when not, it lists what
 *  still needs filling so the bishop knows where to look. There's no
 *  approval workflow — readiness alone gates print. */
export function PrintReadinessPanel({ date, report }: Props) {
  const { ready, missing, unconfirmed, totalItems, doneCount } = report;
  return (
    <section
      id="sec-overview"
      className={cn(
        "rounded-xl border p-5 mb-7",
        ready
          ? "border-success-soft bg-chalk bg-[linear-gradient(180deg,rgba(78,107,58,0.1),rgba(78,107,58,0.02))]"
          : "border-brass-soft bg-chalk bg-[linear-gradient(180deg,rgba(224,190,135,0.2),rgba(224,190,135,0.05))]",
      )}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <span
          className={cn(
            "font-mono text-[10.5px] uppercase tracking-[0.16em] inline-flex items-center gap-2",
            ready ? "text-success" : "text-brass-deep",
          )}
        >
          <Icon paths={ready ? [PATH_CHECK] : [PATH_ALERT_BANG, PATH_ALERT_TRI]} />
          {ready ? "Ready to print" : "Print readiness"}
        </span>
        <span className="ml-auto font-mono text-[11px] tracking-[0.08em] text-walnut-3">
          {doneCount}/{totalItems} complete
        </span>
      </div>
      {ready ? (
        <ReadyBody date={date} />
      ) : (
        <MissingBody missing={missing} unconfirmed={unconfirmed} />
      )}
    </section>
  );
}

function ReadyBody({ date }: { date: string }) {
  return (
    <>
      <p className="font-display text-[17px] font-semibold text-walnut tracking-[-0.005em] m-0 mb-2.5">
        All items assigned and confirmed.
      </p>
      <div className="mt-1 flex flex-col sm:flex-row gap-2.5 flex-wrap">
        <PrintLink
          href={`/print/${date}/congregation`}
          title="Congregation"
          subtitle="Hand out to attendees — hymns, prayers, speakers with topics."
        />
        <PrintLink
          href={`/print/${date}/conducting`}
          title="Conducting"
          subtitle="Conductor's desk copy — script cues + ward / stake business space."
        />
      </div>
    </>
  );
}

function MissingBody({ missing, unconfirmed }: { missing: string[]; unconfirmed: string[] }) {
  return (
    <>
      <p className="font-display text-[17px] font-semibold text-walnut tracking-[-0.005em] m-0 mb-2.5">
        Still needed before printing
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 p-0 m-0 list-none">
        {missing.slice(0, 10).map((n) => (
          <li key={`n-${n}`} className="flex items-center gap-2 text-[13.5px] text-walnut-2 py-0.5">
            <span className="w-3.5 h-3.5 border-[1.25px] border-walnut-3 rounded-full shrink-0" />
            {n}
          </li>
        ))}
        {unconfirmed.slice(0, 4).map((n) => (
          <li key={`u-${n}`} className="flex items-center gap-2 text-[13.5px] text-walnut-2 py-0.5">
            <span className="w-3.5 h-3.5 border-[1.25px] border-dashed border-walnut-3 rounded-full shrink-0" />
            {n}
          </li>
        ))}
      </ul>
    </>
  );
}

function PrintLink({ href, title, subtitle }: { href: string; title: string; subtitle: string }) {
  return (
    <Link
      to={href}
      className="flex-1 inline-flex flex-col gap-0.5 px-3.5 py-2.5 rounded-md border border-border-strong bg-chalk text-walnut hover:bg-parchment-2 hover:border-walnut-3 transition-colors"
    >
      <span className="font-sans text-[13px] font-semibold inline-flex items-center gap-1.5">
        <Icon paths={[PATH_PRINTER, PATH_PRINTER_TRAY]} rect />
        Print {title.toLowerCase()} program
      </span>
      <span className="font-serif italic text-[12px] text-walnut-3 leading-snug">{subtitle}</span>
    </Link>
  );
}

function Icon({ paths, rect }: { paths: readonly string[]; rect?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={STROKE}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={ICON_BASE}
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
      {rect && <rect x="3" y="9" width="18" height="9" rx="2" />}
    </svg>
  );
}
