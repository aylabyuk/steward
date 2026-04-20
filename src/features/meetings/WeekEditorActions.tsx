import { Link } from "react-router";
import type { MeetingType, SacramentMeeting } from "@/lib/types";
import { ApprovalPanel } from "./ApprovalPanel";

interface Props {
  wardId: string;
  date: string;
  type: MeetingType;
  meeting: SacramentMeeting | null;
}

export function WeekEditorActions({ wardId, date, type, meeting }: Props) {
  return (
    <div className="mb-6 flex flex-col gap-3">
      <ApprovalPanel wardId={wardId} date={date} type={type} meeting={meeting} />
      {meeting?.status === "approved" && (
        <nav className="flex flex-wrap gap-2 text-xs">
          <Link
            to={`/print/${date}/conducting`}
            className="rounded-md border border-border bg-chalk px-3 py-1 text-walnut hover:bg-parchment-2"
          >
            Print — conducting
          </Link>
          <Link
            to={`/print/${date}/congregation`}
            className="rounded-md border border-border bg-chalk px-3 py-1 text-walnut hover:bg-parchment-2"
          >
            Print — congregation
          </Link>
        </nav>
      )}
    </div>
  );
}
