import { useEffect, useState } from "react";
import { ASSIGNMENT_STATUSES, type Assignment, type AssignmentStatus } from "@/lib/types";

const STATUS_LABELS: Record<AssignmentStatus, string> = {
  not_assigned: "Not assigned",
  draft: "Draft",
  invite_printed: "Invite printed",
  invite_emailed: "Invite emailed",
  notified: "Notified",
  accepted: "Accepted",
  declined: "Declined",
  completed: "Completed",
};

interface Props {
  label: string;
  assignment: Assignment | undefined;
  onChange: (next: Assignment) => void;
}

function emptyAssignment(): Assignment {
  return { person: null, status: "not_assigned" };
}

export function AssignmentField({ label, assignment, onChange }: Props) {
  const a = assignment ?? emptyAssignment();
  const [localName, setLocalName] = useState(a.person?.name ?? "");

  useEffect(() => {
    setLocalName(a.person?.name ?? "");
  }, [a.person?.name]);

  const commitName = () => {
    const trimmed = localName.trim();
    if (trimmed === (a.person?.name ?? "")) return;
    onChange({
      person: trimmed ? { ...a.person, name: trimmed } : null,
      status: a.status,
    });
  };

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
      <label className="w-32 shrink-0 text-sm font-medium text-slate-700">{label}</label>
      <input
        value={localName}
        onChange={(e) => setLocalName(e.target.value)}
        onBlur={commitName}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commitName();
            (e.target as HTMLInputElement).blur();
          }
        }}
        placeholder="Unassigned"
        className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
      />
      <select
        value={a.status}
        onChange={(e) => onChange({ person: a.person, status: e.target.value as AssignmentStatus })}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
      >
        {ASSIGNMENT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </div>
  );
}
