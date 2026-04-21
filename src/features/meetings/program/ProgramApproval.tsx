import { cn } from "@/lib/cn";
import type { Approval } from "@/lib/types";
import type { ReadinessReport } from "../readiness";
import { ApprovedBody, DraftMissingBody, PendingBody } from "./ApprovalBodies";
import { CheckIcon, Eyebrow } from "./ApprovalEyebrow";

interface Props {
  date: string;
  report: ReadinessReport;
  status: string;
  approvals: readonly Approval[];
  requiredApprovals: number | undefined;
  onRequestApproval?: () => void;
  onApprove?: () => void;
  canApprove?: boolean;
  alreadyApproved?: boolean;
  error?: string | null;
  busy?: boolean;
  /** False until useWardMembers has loaded; gates the Request button so a
   *  still-loading bishopric role isn't mis-classified. */
  memberReady?: boolean;
}

export function ProgramApproval({
  date,
  report,
  status,
  approvals,
  requiredApprovals,
  onRequestApproval,
  onApprove,
  canApprove,
  alreadyApproved,
  error,
  busy,
  memberReady,
}: Props) {
  const { ready, missing, unconfirmed, totalItems, doneCount } = report;
  const live = approvals.filter((a) => !a.invalidated);
  const isPending = status === "pending_approval";
  const isApproved = status === "approved";
  const isDraft = !isPending && !isApproved;
  const threshold = requiredApprovals ?? 2;
  const eyebrow = isApproved ? "approved" : isPending ? "pending" : ready ? "ready" : "draft";

  return (
    <section
      id="sec-overview"
      className={cn(
        "rounded-xl border p-5 mb-7",
        isApproved &&
          "border-success-soft bg-chalk bg-[linear-gradient(180deg,rgba(78,107,58,0.1),rgba(78,107,58,0.02))]",
        isPending &&
          "border-info-soft bg-chalk bg-[linear-gradient(180deg,rgba(60,85,100,0.08),rgba(60,85,100,0.02))]",
        isDraft &&
          ready &&
          "border-success-soft bg-chalk bg-[linear-gradient(180deg,rgba(78,107,58,0.1),rgba(78,107,58,0.02))]",
        isDraft &&
          !ready &&
          "border-brass-soft bg-chalk bg-[linear-gradient(180deg,rgba(224,190,135,0.2),rgba(224,190,135,0.05))]",
      )}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <Eyebrow state={eyebrow} />
        <span className="ml-auto font-mono text-[11px] tracking-[0.08em] text-walnut-3">
          {isApproved || isPending
            ? `${live.length}/${threshold} approvals`
            : `${doneCount}/${totalItems} complete`}
        </span>
      </div>

      {isApproved && <ApprovedBody approvals={live} date={date} />}
      {isPending && <PendingBody approvals={live} />}
      {isDraft && !ready && <DraftMissingBody missing={missing} unconfirmed={unconfirmed} />}
      {isDraft && ready && (
        <p className="font-display text-[17px] font-semibold text-walnut tracking-[-0.005em] m-0 mb-2.5">
          All items assigned and confirmed.
        </p>
      )}

      {error && <p className="font-sans text-[12.5px] text-bordeaux mb-2.5">{error}</p>}

      {isDraft && (
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={onRequestApproval}
            disabled={!ready || busy || !onRequestApproval || memberReady === false}
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

      {isPending && canApprove && (
        <div className="flex items-center gap-2.5 flex-wrap mt-3.5">
          <button
            type="button"
            onClick={onApprove}
            disabled={busy || !onApprove}
            className="font-sans text-[13px] font-semibold px-3.5 py-2 rounded-md border bg-success border-success text-chalk inline-flex items-center gap-1.5 transition-colors hover:bg-success/90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <CheckIcon />
            {busy ? "Approving…" : "Approve this program"}
          </button>
        </div>
      )}
      {isPending && !canApprove && alreadyApproved && (
        <p className="font-serif italic text-[13px] text-walnut-3 mt-3">
          You've already approved this version. Waiting on one more bishopric member.
        </p>
      )}
    </section>
  );
}
