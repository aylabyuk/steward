import { Link } from "react-router";
import type { SacramentMeeting } from "@/lib/types";

interface Props {
  date: string;
  meeting: SacramentMeeting | null;
  loading: boolean;
  children: React.ReactNode;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-md p-8 text-center text-sm text-slate-700">{children}</main>
  );
}

export function PrintGate({ date, meeting, loading, children }: Props) {
  if (loading) {
    return <Shell>Loading…</Shell>;
  }
  if (!meeting) {
    return (
      <Shell>
        <p>No meeting exists for {date}.</p>
        <p className="no-print mt-4">
          <Link to="/schedule" className="text-blue-600 hover:underline">
            ← Back to schedule
          </Link>
        </p>
      </Shell>
    );
  }
  if (meeting.cancellation?.cancelled) {
    return (
      <Shell>
        <p className="text-base font-semibold text-slate-900">
          No sacrament meeting — {meeting.cancellation.reason || "cancelled"}
        </p>
      </Shell>
    );
  }
  if (meeting.status !== "approved") {
    return (
      <Shell>
        <p>
          This program is not yet approved. Printing unlocks once two bishopric members approve.
        </p>
        <p className="no-print mt-4">
          <Link to={`/week/${date}`} className="text-blue-600 hover:underline">
            ← Back to the week
          </Link>
        </p>
      </Shell>
    );
  }
  return <>{children}</>;
}
