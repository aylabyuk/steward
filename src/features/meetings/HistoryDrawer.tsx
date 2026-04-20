import { useState } from "react";
import type { Timestamp } from "firebase/firestore";
import type { WithId } from "@/hooks/_sub";
import { useHistory } from "@/hooks/useHistory";
import type { HistoryEvent } from "@/lib/types";
import { formatHistoryEvent } from "./historyFormat";

const PAGE_STEP = 20;

interface Props {
  date: string;
}

function formatTime(at: unknown): string {
  if (at && typeof at === "object" && "toDate" in (at as object)) {
    return (at as Timestamp).toDate().toLocaleString();
  }
  return "";
}

function HistoryRow({ event }: { event: WithId<HistoryEvent> }) {
  const f = formatHistoryEvent({
    actorDisplayName: event.data.actorDisplayName,
    target: event.data.target,
    action: event.data.action,
    changes: event.data.changes,
  });
  return (
    <li className="flex flex-col gap-0.5 border-b border-slate-200 py-2 text-xs last:border-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-slate-800">{f.summary}</span>
        <span className="text-slate-400">{formatTime(event.data.at)}</span>
      </div>
      {f.details.length > 0 && (
        <ul className="ml-3 list-disc text-slate-600">
          {f.details.map((d) => (
            <li key={`${event.id}-${d}`}>{d}</li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function HistoryDrawer({ date }: Props) {
  const [open, setOpen] = useState(false);
  const [pageSize, setPageSize] = useState(PAGE_STEP);
  const history = useHistory(open ? date : null, pageSize);

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between p-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <span>History</span>
        <span className="text-slate-400">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="border-t border-slate-200 p-3">
          {history.loading && <p className="text-xs text-slate-500">Loading…</p>}
          {history.error && <p className="text-xs text-red-600">{history.error.message}</p>}
          {!history.loading && history.data.length === 0 && (
            <p className="text-xs text-slate-500">No history yet.</p>
          )}
          {history.data.length > 0 && (
            <ul className="flex flex-col">
              {history.data.map((e) => (
                <HistoryRow key={e.id} event={e} />
              ))}
            </ul>
          )}
          {history.data.length === pageSize && (
            <button
              type="button"
              onClick={() => setPageSize((n) => n + PAGE_STEP)}
              className="mt-2 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
            >
              Load more
            </button>
          )}
        </div>
      )}
    </section>
  );
}
