import { useState } from "react";
import type { NonMeetingSunday, SacramentMeeting } from "@/lib/types";
import {
  copyableFields,
  findPreviousMeeting,
  hasExistingValues,
  type PreviousMeeting,
} from "./copyFromPrevious";
import { updateMeetingField } from "./updateMeeting";

interface Props {
  wardId: string;
  date: string;
  meeting: SacramentMeeting | null;
  nonMeetingSundays: readonly NonMeetingSunday[];
}

type State =
  | { kind: "idle" }
  | { kind: "searching" }
  | { kind: "confirming"; prev: PreviousMeeting }
  | { kind: "done"; prev: PreviousMeeting }
  | { kind: "none" }
  | { kind: "error"; message: string };

function formatShort(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function CopyFromPreviousButton({ wardId, date, meeting, nonMeetingSundays }: Props) {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function start() {
    setState({ kind: "searching" });
    try {
      const prev = await findPreviousMeeting(wardId, date);
      if (!prev) {
        setState({ kind: "none" });
        return;
      }
      if (hasExistingValues(meeting)) {
        setState({ kind: "confirming", prev });
        return;
      }
      await updateMeetingField(wardId, date, nonMeetingSundays, copyableFields(prev.data));
      setState({ kind: "done", prev });
    } catch (error) {
      setState({ kind: "error", message: (error as Error).message });
    }
  }

  async function commit(prev: PreviousMeeting) {
    setState({ kind: "searching" });
    await updateMeetingField(wardId, date, nonMeetingSundays, copyableFields(prev.data));
    setState({ kind: "done", prev });
  }

  if (state.kind === "none") {
    return <p className="text-xs text-walnut-2">No previous meeting to copy from.</p>;
  }
  if (state.kind === "done") {
    return <p className="text-xs text-green-700">Copied from {formatShort(state.prev.date)}.</p>;
  }
  if (state.kind === "confirming") {
    return (
      <div className="flex flex-col gap-2 text-xs text-walnut">
        <span>
          Overwrite existing music/sacrament with values from {formatShort(state.prev.date)}?
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void commit(state.prev)}
            className="rounded-md bg-walnut px-3 py-1 text-xs text-white"
          >
            Overwrite
          </button>
          <button
            type="button"
            onClick={() => setState({ kind: "idle" })}
            className="rounded-md border border-border px-3 py-1 text-xs text-walnut"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }
  if (state.kind === "error") {
    return <p className="text-xs text-red-700">Copy failed: {state.message}</p>;
  }
  return (
    <button
      type="button"
      onClick={() => void start()}
      disabled={state.kind === "searching"}
      className="text-xs text-blue-600 hover:underline disabled:text-walnut-3"
    >
      {state.kind === "searching"
        ? "Searching…"
        : "Copy pianist/chorister/sacrament from previous week"}
    </button>
  );
}
