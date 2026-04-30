import type { SpeakerStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

const STYLES: Record<SpeakerStatus, string> = {
  planned: "bg-parchment-2 border-border-strong text-walnut-2",
  invited: "bg-brass-soft border-brass-soft text-walnut",
  confirmed: "bg-success-soft border-success text-success-deep",
  declined: "bg-danger-soft border-danger text-bordeaux-deep",
};

export function SpeakerStatusChip({ status }: { status: SpeakerStatus }) {
  return (
    <span
      className={cn(
        "font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-1 rounded-full border whitespace-nowrap",
        STYLES[status],
      )}
    >
      {status}
    </span>
  );
}
