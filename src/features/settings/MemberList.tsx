import { useState } from "react";
import type { WithId } from "@/hooks/_sub";
import type { Calling, Member } from "@/lib/types";
import { CALLING_OPTIONS } from "./callingLabels";
import { LastBishopricError, setActive, setCcOnEmails, updateCalling } from "./memberActions";

interface Props {
  wardId: string;
  members: readonly WithId<Member>[];
  canEdit: boolean;
}

export function MemberList({ wardId, members, canEdit }: Props) {
  const [error, setError] = useState<string | null>(null);

  async function run<T>(action: () => Promise<T>) {
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(
        e instanceof LastBishopricError
          ? e.message
          : `Failed: ${(e as Error).message ?? "unknown error"}`,
      );
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</p>}
      <ul className="flex flex-col divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {members
          .toSorted((a, b) => a.data.displayName.localeCompare(b.data.displayName))
          .map((m) => (
            <MemberRow
              key={m.id}
              wardId={wardId}
              members={members}
              member={m}
              canEdit={canEdit}
              onAction={run}
            />
          ))}
      </ul>
    </div>
  );
}

interface RowProps {
  wardId: string;
  members: readonly WithId<Member>[];
  member: WithId<Member>;
  canEdit: boolean;
  onAction: <T>(action: () => Promise<T>) => Promise<void>;
}

function MemberRow({ wardId, members, member, canEdit, onAction }: RowProps) {
  const m = member.data;
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
      <div className="min-w-0 flex-1">
        <div className="font-medium text-slate-900">{m.displayName}</div>
        <div className="truncate text-xs text-slate-500">{m.email}</div>
      </div>
      <select
        value={m.calling}
        onChange={(e) =>
          void onAction(() => updateCalling(wardId, members, member.id, e.target.value as Calling))
        }
        disabled={!canEdit}
        className="rounded-md border border-slate-300 px-2 py-1 text-sm"
      >
        {CALLING_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {m.role === "clerk" && (
        <label className="flex items-center gap-1 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={m.ccOnEmails}
            onChange={(e) =>
              void onAction(() => setCcOnEmails(wardId, member.id, e.target.checked))
            }
            disabled={!canEdit}
          />
          CC on emails
        </label>
      )}
      <button
        type="button"
        onClick={() => void onAction(() => setActive(wardId, members, member.id, !m.active))}
        disabled={!canEdit}
        className={`rounded-md border px-2 py-1 text-xs ${
          m.active
            ? "border-slate-300 text-slate-700 hover:bg-slate-50"
            : "border-amber-300 bg-amber-50 text-amber-800"
        }`}
      >
        {m.active ? "Deactivate" : "Reactivate"}
      </button>
    </li>
  );
}
