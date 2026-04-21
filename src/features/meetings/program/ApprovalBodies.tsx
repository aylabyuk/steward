import { useWardMembers } from "@/hooks/useWardMembers";
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
        The program is ready. Bishopric members have been notified by push notification and can
        review and approve.
      </p>
      <ApproverList approvals={approvals} />
    </>
  );
}

export function ApprovedBody({
  approvals,
  date,
}: {
  approvals: readonly Approval[];
  date: string;
}) {
  return (
    <>
      <p className="font-display text-[17px] font-semibold text-walnut tracking-[-0.005em] m-0 mb-2.5">
        Approved and ready to print
      </p>
      <ApproverList approvals={approvals} />
      <div className="mt-4 flex flex-col sm:flex-row gap-2.5 flex-wrap">
        <PrintButton
          href={`/print/${date}/congregation`}
          title="Congregation"
          subtitle="Hand out to attendees — hymns, prayers, speakers with topics."
        />
        <PrintButton
          href={`/print/${date}/conducting`}
          title="Conducting"
          subtitle="Conductor's desk copy — script cues + ward / stake business space."
        />
      </div>
    </>
  );
}

function PrintButton({ href, title, subtitle }: { href: string; title: string; subtitle: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-1 inline-flex flex-col gap-0.5 px-3.5 py-2.5 rounded-md border border-border-strong bg-chalk text-walnut hover:bg-parchment-2 hover:border-walnut-3 transition-colors"
    >
      <span className="font-sans text-[13px] font-semibold inline-flex items-center gap-1.5">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9V2h12v7" />
          <rect x="3" y="9" width="18" height="9" rx="2" />
          <path d="M6 14h12v7H6z" />
        </svg>
        Print {title.toLowerCase()} program
      </span>
      <span className="font-serif italic text-[12px] text-walnut-3 leading-snug">{subtitle}</span>
    </a>
  );
}

function ApproverList({ approvals }: { approvals: readonly Approval[] }) {
  const currentUid = useAuthStore((s) => s.user?.uid);
  const { data: members } = useWardMembers();
  if (approvals.length === 0) return null;
  // Map uid -> live display name from the member doc, so old approvals
  // stored with a truncated Auth displayName still render with the
  // full ward-roster name.
  const nameByUid = new Map(members.map((m) => [m.id, m.data.displayName]));
  return (
    <ul className="flex flex-col gap-1 mb-1 list-none p-0 m-0">
      {approvals.map((a) => (
        <li key={a.uid} className="flex items-center gap-2 font-sans text-[13px] text-walnut">
          <span className="text-success">
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
          </span>
          {nameByUid.get(a.uid) ?? a.displayName}
          {a.uid === currentUid && <span className="text-walnut-3"> (You)</span>}
        </li>
      ))}
    </ul>
  );
}
