import { useState } from "react";
import { useSpeakers } from "@/hooks/useMeeting";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import type { MeetingType, SacramentMeeting } from "@/lib/types";
import { useAuthStore } from "@/stores/authStore";
import { AlreadyApprovedError, approveMeeting, requestApproval } from "./approvals";
import { checkMeetingReadiness } from "./readiness";

interface Props {
  wardId: string;
  date: string;
  type: MeetingType;
  meeting: SacramentMeeting | null;
}

const REQUIRED_APPROVALS = 2;

function InvalidationNotice({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <p className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800">
      {count} prior approval{count === 1 ? " was" : "s were"} invalidated by recent edits.
    </p>
  );
}

function MissingList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">
      <p className="font-medium">Still needed before approval:</p>
      <ul className="ml-4 list-disc">
        {items.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
    </div>
  );
}

export function ApprovalPanel({ wardId, date, type, meeting }: Props) {
  const me = useCurrentMember();
  const authUser = useAuthStore((s) => s.user);
  const { data: speakers } = useSpeakers(date);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!meeting) return null;

  const approvals = meeting.approvals ?? [];
  const live = approvals.filter((a) => !a.invalidated);
  const invalidatedCount = approvals.length - live.length;
  const status = meeting.status;
  const canApprove = me?.data.active === true && me.data.role === "bishopric";
  const alreadyApproved = authUser ? live.some((a) => a.uid === authUser.uid) : false;
  const missing = checkMeetingReadiness(meeting, speakers, type);
  const ready = missing.length === 0;

  async function handleRequest() {
    setBusy(true);
    setError(null);
    try {
      await requestApproval(wardId, date);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleApprove() {
    if (!authUser) return;
    setBusy(true);
    setError(null);
    try {
      await approveMeeting({
        wardId,
        date,
        uid: authUser.uid,
        email: authUser.email ?? "",
        displayName: authUser.displayName ?? authUser.email ?? "",
      });
    } catch (e) {
      setError(e instanceof AlreadyApprovedError ? e.message : (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <header className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Approval — {status.replace(/_/g, " ")}
        </h2>
        <span className="text-xs text-slate-500">
          {live.length} / {REQUIRED_APPROVALS}
        </span>
      </header>

      <InvalidationNotice count={invalidatedCount} />
      <MissingList items={missing} />

      {live.length > 0 && (
        <ul className="flex flex-col gap-1 text-xs text-slate-700">
          {live.map((a) => (
            <li key={a.uid}>✓ {a.displayName}</li>
          ))}
        </ul>
      )}

      {error && <p className="text-xs text-red-700">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {status === "draft" && (
          <button
            type="button"
            onClick={() => void handleRequest()}
            disabled={busy || !ready}
            title={ready ? undefined : "Fill the items above first."}
            className="rounded-md bg-slate-900 px-3 py-1 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Request approval
          </button>
        )}
        {status === "pending_approval" && canApprove && !alreadyApproved && (
          <button
            type="button"
            onClick={() => void handleApprove()}
            disabled={busy || !ready}
            title={ready ? undefined : "Fill the items above first."}
            className="rounded-md bg-green-600 px-3 py-1 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Approve
          </button>
        )}
        {status === "approved" && (
          <p className="text-xs text-green-700">
            Approved — printing is unlocked. Editing content will invalidate approvals.
          </p>
        )}
      </div>
    </section>
  );
}
