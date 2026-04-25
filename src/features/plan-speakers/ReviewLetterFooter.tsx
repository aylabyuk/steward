import type { ActionMode } from "./SpeakerActionPicker";
import { WizardFooter } from "./WizardFooter";

interface Props {
  mode: ActionMode;
  busy: boolean;
  onBack: () => void;
  onPrimary: () => void;
}

const PRIMARY_LABEL: Record<ActionMode, string> = {
  send: "Send invitation →",
  resend: "Resend invitation →",
  print: "Print →",
};

export function ReviewLetterFooter({ mode, busy, onBack, onPrimary }: Props) {
  return (
    <WizardFooter align="between">
      <button
        type="button"
        onClick={onBack}
        disabled={busy}
        className="rounded-md border border-border-strong bg-chalk px-3.5 py-2 font-sans text-[13px] font-semibold text-walnut hover:bg-parchment-2 disabled:opacity-60"
      >
        ← Back
      </button>
      <button
        type="button"
        onClick={onPrimary}
        disabled={busy}
        className="rounded-md border border-bordeaux bg-bordeaux px-4 py-2.5 font-sans text-[14px] font-semibold text-chalk hover:bg-bordeaux-deep disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {busy ? "Working…" : PRIMARY_LABEL[mode]}
      </button>
    </WizardFooter>
  );
}
