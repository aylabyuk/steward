import { useEffect, useState } from "react";
import type { Assignment } from "@/lib/types";
import { StatusToggle } from "./StatusToggle";

interface Props {
  label: string;
  placeholder?: string;
  assignment: Assignment | undefined;
  showStatus?: boolean;
  onChange: (next: Assignment) => void;
}

/**
 * Single-row editor for a Prayer/Music/Sacrament/Leader assignment.
 * Layout: `label | inline text input | status toggle`.
 * Values debounce onto Firestore via onBlur + Enter.
 */
export function AssignRow({ label, placeholder, assignment, showStatus = true, onChange }: Props) {
  const a = assignment ?? { person: null, confirmed: false };
  const [local, setLocal] = useState(a.person?.name ?? "");

  useEffect(() => {
    setLocal(a.person?.name ?? "");
  }, [a.person?.name]);

  function commitName() {
    const trimmed = local.trim();
    if (trimmed === (a.person?.name ?? "")) return;
    onChange({
      person: trimmed ? { ...(a.person ?? {}), name: trimmed } : null,
      confirmed: trimmed ? a.confirmed : false,
    });
  }

  const hasPerson = Boolean(a.person?.name);
  const state: "empty" | "unconfirmed" | "confirmed" = !hasPerson
    ? "empty"
    : a.confirmed
      ? "confirmed"
      : "unconfirmed";

  return (
    <div className="grid grid-cols-[86px_minmax(0,1fr)_30px] items-center gap-3 py-2 border-b border-dashed border-border last:border-b-0">
      <div className="text-[13.5px] font-sans font-medium text-walnut-2">{label}</div>
      <input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commitName}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commitName();
            (e.target as HTMLInputElement).blur();
          }
        }}
        placeholder={placeholder}
        className="font-sans text-[14px] px-2.5 py-1.5 bg-parchment border border-transparent rounded-md text-walnut w-full transition-colors placeholder:text-walnut-3 placeholder:italic hover:border-border-strong hover:bg-chalk focus:outline-none focus:border-bordeaux focus:bg-chalk focus:ring-2 focus:ring-bordeaux/15"
      />
      {showStatus ? (
        <StatusToggle
          state={state}
          onToggle={() =>
            onChange({ ...a, confirmed: !a.confirmed })
          }
          title={`${label} status`}
        />
      ) : (
        <span />
      )}
    </div>
  );
}
