import type { SpeakerStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

const STATUS_STYLES: Record<SpeakerStatus, string> = {
  planned: "bg-info-soft text-blue-900",
  invited: "bg-warning-soft text-yellow-900",
  confirmed: "bg-success-soft text-green-900",
  declined: "bg-danger-soft text-red-900",
};

interface Props {
  status: SpeakerStatus;
  size?: "sm" | "md";
}

export function StatePill({ status, size = "md" }: Props) {
  const sizeClass = size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm";
  return (
    <span className={cn("rounded-full font-medium", sizeClass, STATUS_STYLES[status])}>
      {status}
    </span>
  );
}
