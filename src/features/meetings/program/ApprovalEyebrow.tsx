import { cn } from "@/lib/cn";

export type EyebrowState = "draft" | "ready" | "pending" | "approved";

export function Eyebrow({ state }: { state: EyebrowState }) {
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

export function CheckIcon() {
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

function AlertIcon() {
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
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
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
