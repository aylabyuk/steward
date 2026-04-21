import { cn } from "@/lib/cn";

interface Props {
  state: "empty" | "unconfirmed" | "confirmed";
  onToggle: () => void;
  title?: string;
}

/**
 * Small round icon that reflects assignment state:
 *  - empty: dashed outline (no person assigned yet)
 *  - unconfirmed: solid outline (person assigned, not yet confirmed)
 *  - confirmed: filled success with check
 * Clicking cycles between unconfirmed and confirmed when a person exists;
 * no-op when empty.
 */
export function StatusToggle({ state, onToggle, title }: Props) {
  return (
    <button
      type="button"
      onClick={state === "empty" ? undefined : onToggle}
      disabled={state === "empty"}
      aria-label={title ?? "Toggle status"}
      title={
        state === "confirmed"
          ? "Confirmed — click to mark not confirmed"
          : state === "unconfirmed"
            ? "Not confirmed — click to mark confirmed"
            : "Empty — add a name first"
      }
      className={cn(
        "w-6 h-6 rounded-full inline-flex items-center justify-center transition-colors",
        state === "empty" &&
          "border-[1.5px] border-dashed border-border-strong bg-parchment cursor-not-allowed opacity-60",
        state === "unconfirmed" &&
          "border-[1.5px] border-walnut-3 bg-parchment hover:border-bordeaux hover:bg-chalk cursor-pointer",
        state === "confirmed" &&
          "bg-success border-[1.5px] border-success text-chalk hover:bg-success/90 cursor-pointer",
      )}
    >
      {state === "confirmed" && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      )}
    </button>
  );
}
