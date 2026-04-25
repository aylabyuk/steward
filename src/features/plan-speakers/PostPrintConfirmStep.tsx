import { HandDeliveryConfirmPrompt } from "./HandDeliveryConfirmPrompt";
import { WizardFooter } from "./WizardFooter";

interface Props {
  speakerName: string;
  busy: boolean;
  onConfirm: () => void;
  onSkip: () => void;
}

export function PostPrintConfirmStep({ speakerName, busy, onConfirm, onSkip }: Props) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-3xl w-full mx-auto px-5 sm:px-8 py-5">
          <HandDeliveryConfirmPrompt speakerName={speakerName} />
        </div>
      </div>
      <WizardFooter align="end">
        <button
          type="button"
          onClick={onSkip}
          disabled={busy}
          className="rounded-md border border-border-strong bg-chalk px-3.5 py-2 font-sans text-[13px] font-semibold text-walnut hover:bg-parchment-2 disabled:opacity-60"
        >
          Not yet
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="rounded-md border border-bordeaux bg-bordeaux px-4 py-2.5 font-sans text-[14px] font-semibold text-chalk hover:bg-bordeaux-deep disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {busy ? "Saving…" : "Yes, mark invited"}
        </button>
      </WizardFooter>
    </div>
  );
}
