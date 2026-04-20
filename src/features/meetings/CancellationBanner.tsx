import type { Cancellation } from "@/lib/types";
import { uncancelMeeting } from "./updateMeeting";

interface Props {
  wardId: string;
  date: string;
  cancellation: Cancellation | undefined;
}

export function CancellationBanner({ wardId, date, cancellation }: Props) {
  if (!cancellation?.cancelled) return null;
  return (
    <div className="mb-6 flex items-start justify-between gap-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <div>
        <strong>Meeting cancelled</strong>
        {cancellation.reason && <span> — {cancellation.reason}</span>}
      </div>
      <button
        type="button"
        onClick={() => void uncancelMeeting(wardId, date)}
        className="shrink-0 rounded-md border border-red-300 bg-chalk px-3 py-1 text-xs text-red-700 hover:bg-red-100"
      >
        Uncancel
      </button>
    </div>
  );
}
