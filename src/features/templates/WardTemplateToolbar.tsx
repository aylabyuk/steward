import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PrepareInvitationGroupBtn as GroupBtn } from "./PrepareInvitationGroupBtn";

interface Props {
  canEdit: boolean;
  busy: boolean;
  saving: boolean;
  onSave: () => void;
  onReset: () => void;
}

type PendingConfirm = "save" | "reset" | null;

/** Icon-only toolbar for the ward-level template editor pages: Save
 *  and Reset in a connected button group, each gated on a confirm
 *  dialog that spells out the side effects. Mirrors the Prepare
 *  Invitation toolbar in shape and behavior. */
export function WardTemplateToolbar({ canEdit, busy, saving, onSave, onReset }: Props) {
  const [pending, setPending] = useState<PendingConfirm>(null);
  const disabled = !canEdit || busy;

  function confirmSave() {
    setPending(null);
    onSave();
  }

  function confirmReset() {
    setPending(null);
    onReset();
  }

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <div className="inline-flex isolate rounded-md shadow-[0_1px_0_rgba(35,24,21,0.08)]">
        <GroupBtn
          position="first"
          label="Reset editor to built-in defaults"
          onClick={() => setPending("reset")}
          disabled={disabled}
        >
          <ResetIcon />
        </GroupBtn>
        <GroupBtn
          position="last"
          label="Save as ward default"
          onClick={() => setPending("save")}
          disabled={disabled}
          primary
        >
          {saving ? <SpinnerDot /> : <SaveIcon />}
        </GroupBtn>
      </div>

      <ConfirmDialog
        open={pending === "reset"}
        title="Reset editor to built-in defaults?"
        body="This replaces any unsaved edits with the seed template shipped with the app. The ward template on file stays as-is until you click Save — so you can undo by navigating away without saving."
        confirmLabel="Reset"
        onConfirm={confirmReset}
        onCancel={() => setPending(null)}
      />
      <ConfirmDialog
        open={pending === "save"}
        title="Save as ward default?"
        body="This updates the ward's speaker invitation letter template. Every future speaker invitation will use this text unless a per-speaker override is in place. Existing sent invitations aren't affected — each was snapshotted at send time."
        confirmLabel="Save template"
        onConfirm={confirmSave}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}

function SaveIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <path d="M17 21v-8H7v8" />
      <path d="M7 3v5h8" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 7v6h6" />
      <path d="M3 13a9 9 0 1 0 3-7.7L3 9" />
    </svg>
  );
}

function SpinnerDot() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px]">
      <span className="animate-pulse">…</span>
    </span>
  );
}
