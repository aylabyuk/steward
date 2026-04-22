import { cn } from "@/lib/cn";

export type PrepareInvitationTab = "letter" | "email";

interface Props {
  active: PrepareInvitationTab;
  onChange: (t: PrepareInvitationTab) => void;
}

/** Pill-style tab switcher at the top of PrepareInvitationDialog. */
export function PrepareInvitationTabs({ active, onChange }: Props) {
  return (
    <div className="mb-5 inline-flex rounded-md border border-border-strong bg-chalk p-0.5">
      {(["letter", "email"] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={cn(
            "font-mono text-[10px] uppercase tracking-[0.14em] px-3 py-1.5 rounded-sm transition-colors",
            active === t ? "bg-walnut text-parchment" : "text-walnut-2 hover:bg-parchment-2",
          )}
        >
          {t === "letter" ? "Letter (landing page)" : "Email body"}
        </button>
      ))}
    </div>
  );
}
