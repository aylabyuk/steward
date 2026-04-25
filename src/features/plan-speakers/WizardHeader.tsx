import { cn } from "@/lib/cn";
import type { WizardStep } from "./PlanSpeakersWizard";

interface Props {
  step: WizardStep;
  title: string;
  onBack: () => void;
  onClose: () => void;
}

const STEPS: { key: WizardStep; label: string }[] = [
  { key: "roster", label: "Roster" },
  { key: "invitations", label: "Invitations" },
  { key: "summary", label: "Done" },
];

export function WizardHeader({ step, title, onBack, onClose }: Props) {
  const currentIndex = STEPS.findIndex((s) => s.key === step);
  const stepLabel = STEPS[currentIndex]?.label ?? "";
  return (
    <header className="border-b border-border bg-chalk px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="shrink-0 rounded-md border border-border-strong bg-chalk px-2.5 py-1.5 font-sans text-[13px] font-semibold text-walnut hover:bg-parchment-2"
      >
        ←<span className="hidden sm:inline ml-1">Back</span>
      </button>

      <div className="flex flex-col items-center min-w-0 flex-1">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-brass-deep font-medium">
          Step {currentIndex + 1} of {STEPS.length} · {stepLabel}
        </span>
        <h1 className="font-display text-[16px] sm:text-[20px] font-semibold text-walnut truncate max-w-full">
          {title}
        </h1>
        <ol className="mt-1.5 flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <li
              key={s.key}
              aria-label={s.label}
              className={cn(
                "h-1.5 rounded-full transition-colors",
                i === currentIndex ? "w-6 bg-walnut" : "w-1.5",
                i < currentIndex && "bg-walnut-2",
                i > currentIndex && "bg-border-strong",
              )}
            />
          ))}
        </ol>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="shrink-0 rounded-md border border-border-strong bg-chalk px-2.5 py-1.5 font-sans text-[13px] font-semibold text-walnut-2 hover:bg-parchment-2"
      >
        ✕<span className="hidden sm:inline ml-1">Close</span>
      </button>
    </header>
  );
}
