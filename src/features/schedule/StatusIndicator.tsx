import { cn } from "@/lib/cn";
import type { InvitationStatus } from "@/lib/types";

interface Props {
  status: InvitationStatus;
}

const PILL_CLS: Record<InvitationStatus, string> = {
  planned: "bg-parchment-2 text-walnut-2 border-border",
  invited: "bg-brass-soft/40 text-brass-deep border-brass-soft",
  confirmed: "bg-success-soft text-success border-success-soft",
  declined: "bg-danger-soft text-bordeaux border-danger-soft",
};

const DOT_CLS: Record<InvitationStatus, string> = {
  planned: "bg-walnut-3",
  invited: "bg-brass",
  confirmed: "bg-success",
  declined: "bg-bordeaux",
};

const STATUS_LABEL: Record<InvitationStatus, string> = {
  planned: "Planned",
  invited: "Invited",
  confirmed: "Confirmed",
  declined: "Declined",
};

/** Status indicator on schedule rows. Mobile renders an 8px colored
 *  dot — phone width is tight, and the ~70pt the text pill ate is
 *  worth more given to the speaker name + topic. Desktop keeps the
 *  uppercase mono pill for at-a-glance status without hovering.
 *  Tailwind responsive (md) handles the breakpoint without a JS
 *  check; ARIA carries the status word in both variants. */
export function StatusIndicator({ status }: Props) {
  const label = `Status: ${STATUS_LABEL[status]}`;
  return (
    <>
      <span
        aria-label={label}
        className={cn("inline-block w-2 h-2 rounded-full shrink-0 md:hidden", DOT_CLS[status])}
      />
      <span
        aria-hidden="true"
        className={cn(
          "hidden md:inline-flex font-mono text-[9.5px] uppercase tracking-[0.12em] px-2.5 py-1.5 rounded-full border whitespace-nowrap",
          PILL_CLS[status],
        )}
      >
        {status}
      </span>
    </>
  );
}
