import { useState } from "react";
import type { WithId } from "@/hooks/_sub";
import type { Member } from "@/lib/types";
import { MemberRow } from "./MemberRow";

interface Props {
  wardId: string;
  members: readonly WithId<Member>[];
  canEdit: boolean;
  onInvite: () => void;
}

/** Ward Settings → Members & callings card. Row edits (calling,
 *  CC-on-emails toggle, deactivate) persist immediately — the parent
 *  page's savebar only tracks ward prefs, not roster changes. */
export function MembersSection({ wardId, members, canEdit, onInvite }: Props): React.ReactElement {
  const [error, setError] = useState<string | null>(null);

  const sorted = members.toSorted((a, b) => a.data.displayName.localeCompare(b.data.displayName));

  return (
    <section
      id="sec-members"
      className="bg-chalk border border-border rounded-lg p-6 mb-4 scroll-mt-24"
    >
      <div className="flex items-center gap-3 mb-1">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brass-deep font-medium">
          Roster
        </span>
        <div className="flex-1" />
        {canEdit && (
          <button
            type="button"
            onClick={onInvite}
            className="inline-flex items-center gap-1.5 font-sans text-[13px] font-semibold px-3.5 py-1.5 rounded-md border border-walnut bg-walnut text-parchment hover:bg-ink shadow-[0_1px_0_rgba(35,24,21,0.18)] transition-colors"
          >
            <PlusIcon />
            Invite member
          </button>
        )}
      </div>
      <h2 className="font-display text-[22px] font-semibold text-walnut mb-1">
        Members &amp; callings
      </h2>
      <p className="font-serif italic text-[14px] text-walnut-2 mb-4">
        Bishopric and secretaries plan sacrament meetings here; clerks can participate as needed.
        Assign callings, toggle CC on outgoing emails for non-bishopric members, and deactivate
        departing members.
      </p>

      {error && (
        <p className="font-sans text-[12px] text-bordeaux bg-danger-soft border border-danger-soft/70 rounded-md px-3 py-2 mb-2">
          {error}
        </p>
      )}

      <ul className="flex flex-col">
        {sorted.map((m) => (
          <MemberRow
            key={m.id}
            wardId={wardId}
            members={members}
            member={m}
            canEdit={canEdit}
            onError={setError}
          />
        ))}
      </ul>

      {!canEdit && (
        <p className="font-serif italic text-[12.5px] text-walnut-3 mt-3">
          Only bishopric members can edit the roster.
        </p>
      )}
    </section>
  );
}

function PlusIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
