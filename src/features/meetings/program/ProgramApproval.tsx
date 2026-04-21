import { cn } from "@/lib/cn";
import type { ReadinessReport } from "../readiness";

interface Props {
  report: ReadinessReport;
  status: string;
  onRequestApproval?: () => void;
  busy?: boolean;
}

export function ProgramApproval({ report, status, onRequestApproval, busy }: Props) {
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
          {ready ? <CheckIcon /> : <AlertIcon />}
          {ready ? "Ready for approval" : `Approval — ${status.replace(/_/g, " ")}`}
        </span>
        <span className="ml-auto font-mono text-[11px] tracking-[0.08em] text-walnut-3">
          {doneCount}/{totalItems} complete
        </span>
      </div>

      {ready ? (
        <p className="font-display text-[17px] font-semibold text-walnut tracking-[-0.005em] m-0 mb-2.5">
          All items assigned and confirmed.
        </p>
      ) : (
        <>
          <p className="font-display text-[17px] font-semibold text-walnut tracking-[-0.005em] m-0 mb-2.5">
            Still needed before approval
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 p-0 m-0 mb-3.5 list-none">
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
      )}

      <div className="flex items-center gap-2.5 flex-wrap">
        <button
          type="button"
          onClick={onRequestApproval}
          disabled={!ready || busy || !onRequestApproval}
          className={cn(
            "font-sans text-[13px] font-semibold px-3.5 py-2 rounded-md border inline-flex items-center gap-1.5 transition-colors",
            ready
              ? "bg-success border-success text-chalk hover:bg-success/90"
              : "bg-chalk border-border-strong text-walnut hover:bg-parchment-2",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          )}
        >
          {ready && <CheckIcon />}
          {busy ? "Requesting…" : "Request approval"}
        </button>
        <span className="font-serif italic text-[13px] text-walnut-3">
          Bishopric members will be notified by push notification.
        </span>
      </div>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    </svg>
  );
}
