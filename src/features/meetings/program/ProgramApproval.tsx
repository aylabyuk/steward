import { cn } from "@/lib/cn";
import type { Approval } from "@/lib/types";
import type { ReadinessReport } from "../readiness";
import { ApprovedBody, DraftMissingBody, PendingBody } from "./ApprovalBodies";

interface Props {
  report: ReadinessReport;
  status: string;
  approvals: readonly Approval[];
  onRequestApproval?: () => void;
  busy?: boolean;
}

const REQUIRED_APPROVALS = 2;

export function ProgramApproval({ report, status, approvals, onRequestApproval, busy }: Props) {
  const { ready, missing, unconfirmed, totalItems, doneCount } = report;
  const live = approvals.filter((a) => !a.invalidated);
  const isPending = status === "pending_approval";
  const isApproved = status === "approved";
  const isDraft = !isPending && !isApproved;
  const eyebrow = isApproved ? "approved" : isPending ? "pending" : ready ? "ready" : "draft";

  return (
    <section
      id="sec-overview"
      className={cn(
        "rounded-xl border p-5 mb-7",
        isApproved && "border-success-soft bg-chalk bg-[linear-gradient(180deg,rgba(78,107,58,0.1),rgba(78,107,58,0.02))]",
        isPending && "border-info-soft bg-chalk bg-[linear-gradient(180deg,rgba(60,85,100,0.08),rgba(60,85,100,0.02))]",
        isDraft && ready && "border-success-soft bg-chalk bg-[linear-gradient(180deg,rgba(78,107,58,0.1),rgba(78,107,58,0.02))]",
        isDraft && !ready && "border-brass-soft bg-chalk bg-[linear-gradient(180deg,rgba(224,190,135,0.2),rgba(224,190,135,0.05))]",
      )}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <Eyebrow state={eyebrow} />
        <span className="ml-auto font-mono text-[11px] tracking-[0.08em] text-walnut-3">
          {isApproved || isPending
            ? `${live.length}/${REQUIRED_APPROVALS} approvals`
            : `${doneCount}/${totalItems} complete`}
        </span>
      </div>

      {isApproved && <ApprovedBody approvals={live} />}
      {isPending && <PendingBody approvals={live} />}
      {isDraft && !ready && <DraftMissingBody missing={missing} unconfirmed={unconfirmed} />}
      {isDraft && ready && (
        <p className="font-display text-[17px] font-semibold text-walnut tracking-[-0.005em] m-0 mb-2.5">
          All items assigned and confirmed.
        </p>
      )}

      {isDraft && (
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
      )}
    </section>
  );
}

function Eyebrow({ state }: { state: "draft" | "ready" | "pending" | "approved" }) {
  const cfg = {
    draft: { icon: <AlertIcon />, label: "Approval — draft", color: "text-brass-deep" },
    ready: { icon: <CheckIcon />, label: "Ready for approval", color: "text-success" },
    pending: { icon: <ClockIcon />, label: "Pending bishopric approval", color: "text-info" },
    approved: { icon: <CheckIcon />, label: "Approved", color: "text-success" },
  }[state];
  return (
    <span
      className={cn(
        "font-mono text-[10.5px] uppercase tracking-[0.16em] inline-flex items-center gap-2",
        cfg.color,
      )}
    >
      {cfg.icon}
      {cfg.label}
    </span>
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
function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
