import { Link } from "react-router";
import type { MeetingType } from "@/lib/types";
import { TYPE_LABELS } from "../utils/meetingLabels";
import { cn } from "@/lib/cn";

interface Props {
  date: string;
  type: MeetingType;
  rightSlot?: React.ReactNode;
}

function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const PILL_CLS: Record<MeetingType, string> = {
  regular: "text-walnut-3 border-border bg-chalk",
  fast: "text-brass-deep border-brass-soft bg-[rgba(224,190,135,0.22)]",
  stake: "text-bordeaux border-danger-soft bg-danger-soft",
  general: "text-bordeaux border-danger-soft bg-danger-soft",
};

export function ProgramHead({ date, type, rightSlot }: Props) {
  return (
    <>
      <Link
        to="/schedule"
        className="inline-flex items-center gap-1.5 font-sans text-[13px] text-walnut-2 hover:text-bordeaux transition-colors py-1 mb-2"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Schedule
      </Link>
      <div className="flex items-end gap-5 mb-7 pb-5 border-b border-border">
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brass-deep mb-1.5">
            Sacrament meeting · Program
          </div>
          <h1 className="font-display font-semibold text-[40px] leading-[1.02] tracking-[-0.02em] text-walnut m-0">
            {formatLongDate(date)}
          </h1>
          <div className="mt-2">
            <span
              className={cn(
                "inline-block font-mono text-[10px] uppercase tracking-[0.14em] px-2.5 py-0.5 border rounded-full",
                PILL_CLS[type],
              )}
            >
              {TYPE_LABELS[type]}
            </span>
          </div>
        </div>
        {rightSlot && <div className="flex items-center gap-2 shrink-0">{rightSlot}</div>}
      </div>
    </>
  );
}
