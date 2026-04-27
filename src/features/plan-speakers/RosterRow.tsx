import { useState } from "react";
import { SpeakerRolePicker } from "@/features/schedule/SpeakerRolePicker";
import { SpeakerStatusChip } from "./SpeakerStatusChip";
import { DeleteSpeakerConfirm } from "./DeleteSpeakerConfirm";
import type { RosterDraft } from "./utils/rosterDraft";

const INPUT_CLS =
  "font-sans text-[14px] px-3 py-2.5 bg-chalk border border-border-strong rounded-md text-walnut w-full transition-colors placeholder:text-walnut-3 focus:outline-none focus:border-bordeaux focus:ring-2 focus:ring-bordeaux/15";
const LABEL_CLS = "font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep font-medium";

interface Props {
  draft: RosterDraft;
  index: number;
  onChange: (patch: Partial<RosterDraft>) => void;
  /** Called once the user has either confirmed via the type-to-confirm
   *  dialog (for persisted speakers) or directly removed an unsaved
   *  draft. Parent decides whether to call deleteSpeaker. */
  onConfirmedRemove: () => Promise<void> | void;
}

// Delete is always available — even when this is the last speaker —
// so the bishop can clear the slot without first adding a placeholder.
// Persisted speakers still go through DeleteSpeakerConfirm (which
// pops the type-to-confirm dialog plus a status-aware warning for
// invited / confirmed); unsaved drafts delete inline.
export function RosterRow({ draft, index, onChange, onConfirmedRemove }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const persisted = draft.id !== null;

  function handleDeleteClick() {
    if (!persisted) {
      void onConfirmedRemove();
      return;
    }
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirmedRemove();
      setConfirmOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="bg-chalk border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep font-semibold">
            Speaker · {String(index + 1).padStart(2, "0")}
          </span>
          {persisted && <SpeakerStatusChip status={draft.status} />}
        </div>
        <button
          type="button"
          onClick={handleDeleteClick}
          className="inline-flex items-center gap-1 rounded-md border border-border-strong bg-chalk px-2.5 py-1 font-sans text-[12px] font-semibold text-bordeaux hover:bg-bordeaux/5 hover:border-bordeaux"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M10 11v6M14 11v6" />
          </svg>
          Delete
        </button>
      </div>
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className={LABEL_CLS}>
            Name <span className="text-bordeaux">*</span>
          </span>
          <input
            value={draft.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="e.g. Sister Hannah Reeves"
            className={INPUT_CLS}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={LABEL_CLS}>
            Topic <span className="text-walnut-3 normal-case tracking-normal">— optional</span>
          </span>
          <input
            value={draft.topic}
            onChange={(e) => onChange({ topic: e.target.value })}
            placeholder="e.g. On the still, small voice"
            className={INPUT_CLS}
          />
        </label>
        <SpeakerRolePicker
          role={draft.role}
          readOnly={false}
          onChange={(role) => onChange({ role })}
        />
      </div>

      <DeleteSpeakerConfirm
        open={confirmOpen}
        speakerName={draft.name}
        speakerStatus={draft.status}
        busy={busy}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </li>
  );
}
