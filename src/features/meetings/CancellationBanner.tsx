import type { Cancellation } from "@/lib/types";
import { uncancelMeeting } from "./updateMeeting";

interface Props {
  wardId: string;
  date: string;
  cancellation: Cancellation | undefined;
  onStartCancel: () => void;
  isNonMeeting: boolean;
}

export function CancellationBanner({
  wardId,
  date,
  cancellation,
  onStartCancel,
  isNonMeeting,
}: Props) {
  if (cancellation?.cancelled) {
    return (
      <div className="mb-6 flex items-start justify-between gap-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <div>
          <strong>Meeting cancelled</strong>
          {cancellation.reason && <span> — {cancellation.reason}</span>}
        </div>
        <button
          type="button"
          onClick={() => void uncancelMeeting(wardId, date)}
          className="shrink-0 rounded-md border border-red-300 bg-white px-3 py-1 text-xs text-red-700 hover:bg-red-100"
        >
          Uncancel
        </button>
      </div>
    );
  }
  if (isNonMeeting) return null;
  return (
    <div className="mb-6 flex justify-end">
      <button
        type="button"
        onClick={onStartCancel}
        className="text-xs text-red-700 hover:underline"
      >
        Cancel meeting…
      </button>
    </div>
  );
}
