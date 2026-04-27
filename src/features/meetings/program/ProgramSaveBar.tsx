import { cn } from "@/lib/cn";
import { SaveIndicator } from "./SaveIndicator";

interface Props {
  status: string;
  ready: boolean;
  remaining: number;
  busy?: boolean;
  onRequestApproval?: () => void;
  onPreview?: () => void;
}

export function ProgramSaveBar({
  status,
  ready,
  remaining,
  busy,
  onRequestApproval,
  onPreview,
}: Props) {
  const isPending = status === "pending_approval";
  const isApproved = status === "approved";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-chalk border-t border-border shadow-[0_-6px_20px_rgba(35,24,21,0.08)]">
      {/* Mobile: stack the indicator above the buttons so a long error
          message ("Couldn't save — Connection failed…") doesn't wrap
          inside a cramped row next to a big CTA. Desktop: everything
          on one line. */}
      <div className="flex flex-col gap-2 px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:gap-3.5 sm:px-8 sm:py-3 sm:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <SaveIndicator />
        <span className="hidden sm:block sm:flex-1" />
        <div className="flex items-center gap-2.5">
          {onPreview && (
            <button
              type="button"
              onClick={onPreview}
              className="font-sans text-[13px] font-semibold px-3.5 py-2 rounded-md border border-transparent text-walnut-2 hover:bg-parchment-2 hover:text-walnut transition-colors"
            >
              Preview print
            </button>
          )}
          <ApprovalCta
            status={status}
            ready={ready}
            remaining={remaining}
            busy={busy}
            onRequestApproval={onRequestApproval}
            isPending={isPending}
            isApproved={isApproved}
          />
        </div>
      </div>
    </div>
  );
}

interface CtaProps {
  status: string;
  ready: boolean;
  remaining: number;
  busy?: boolean;
  onRequestApproval?: () => void;
  isPending: boolean;
  isApproved: boolean;
}

function ApprovalCta({
  ready,
  remaining,
  busy,
  onRequestApproval,
  isPending,
  isApproved,
}: CtaProps) {
  if (isApproved) {
    return (
      <span className="font-sans text-[13px] font-semibold px-3.5 py-2 rounded-md border border-success-soft bg-success-soft text-success inline-flex items-center gap-1.5">
        <CheckIcon />
        Approved
      </span>
    );
  }
  if (isPending) {
    return (
      <span className="font-sans text-[13px] font-semibold px-3.5 py-2 rounded-md border border-info-soft bg-info-soft text-info inline-flex items-center gap-1.5">
        <ClockIcon />
        Pending approval
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onRequestApproval}
      disabled={!ready || busy || !onRequestApproval}
      className={cn(
        "font-sans text-[13px] font-semibold px-3.5 py-2 rounded-md border inline-flex items-center gap-1.5 transition-colors",
        ready
          ? "bg-success border-success text-chalk hover:bg-success/90"
          : "bg-bordeaux border-bordeaux-deep text-parchment hover:bg-bordeaux-deep shadow-[0_1px_0_rgba(35,24,21,0.18)]",
        "disabled:opacity-60 disabled:cursor-not-allowed",
      )}
    >
      {ready
        ? "Request approval"
        : `Finish ${remaining} item${remaining === 1 ? "" : "s"} to submit`}
    </button>
  );
}

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
