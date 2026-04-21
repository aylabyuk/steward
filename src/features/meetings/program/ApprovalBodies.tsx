import type { Approval } from "@/lib/types";
import { useAuthStore } from "@/stores/authStore";

interface DraftProps {
  missing: string[];
  unconfirmed: string[];
}

export function DraftMissingBody({ missing, unconfirmed }: DraftProps) {
  return (
    <>
      <p className="font-display text-[17px] font-semibold text-walnut tracking-[-0.005em] m-0 mb-2.5">
        Still needed before approval
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 p-0 m-0 mb-3.5 list-none">
        {missing.slice(0, 10).map((n) => (
          <li key={`n-${n}`} className="flex items-center gap-2 text-[13.5px] text-walnut-2 py-0.5">
            <span className="w-3.5 h-3.5 border-[1.25px] border-walnut-3 rounded-full shrink-0" />
            {n}
          </li>
        ))}
        {unconfirmed.slice(0, 4).map((n) => (
          <li key={`u-${n}`} className="flex items-center gap-2 text-[13.5px] text-walnut-2 py-0.5">
            <span className="w-3.5 h-3.5 border-[1.25px] border-dashed border-walnut-3 rounded-full shrink-0" />
            {n}
          </li>
        ))}
      </ul>
    </>
  );
}

export function PendingBody({ approvals }: { approvals: readonly Approval[] }) {
  return (
    <>
      <p className="font-display text-[17px] font-semibold text-walnut tracking-[-0.005em] m-0 mb-2.5">
        Waiting on the bishopric
      </p>
      <p className="font-serif italic text-[13px] text-walnut-2 mb-3">
        The program is ready. Bishopric members have been notified by push notification and can review and approve.
      </p>
      <ApproverList approvals={approvals} />
    </>
  );
}

export function ApprovedBody({ approvals }: { approvals: readonly Approval[] }) {
  return (
    <>
      <p className="font-display text-[17px] font-semibold text-walnut tracking-[-0.005em] m-0 mb-2.5">
        Approved and ready to print
      </p>
      <ApproverList approvals={approvals} />
    </>
  );
}

function ApproverList({ approvals }: { approvals: readonly Approval[] }) {
  const currentUid = useAuthStore((s) => s.user?.uid);
  if (approvals.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1 mb-1 list-none p-0 m-0">
      {approvals.map((a) => (
        <li key={a.uid} className="flex items-center gap-2 font-sans text-[13px] text-walnut">
          <span className="text-success">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
          {a.displayName}
          {a.uid === currentUid && <span className="text-walnut-3"> (You)</span>}
        </li>
      ))}
    </ul>
  );
}
