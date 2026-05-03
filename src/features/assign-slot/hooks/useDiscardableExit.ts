import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@/lib/nav";

interface Options {
  dirty: boolean;
}

interface DiscardableExit {
  /** Wire to the header cancel button. Opens the confirm when dirty,
   *  otherwise navigates straight to /schedule. */
  requestCancel: () => void;
  confirmOpen: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
}

/** Form-level "close with discard guard" — opens a confirm when there
 *  are unsaved changes, otherwise navigates back to the schedule.
 *  Also binds Esc to the same path so desktop keyboard users hit the
 *  guard. The DiscardChangesConfirm + DeleteSpeakerConfirm modals own
 *  their own Esc handlers with `stopImmediatePropagation`, so this
 *  listener stays silent while either modal is open. */
export function useDiscardableExit({ dirty }: Options): DiscardableExit {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const requestCancel = useCallback(() => {
    if (dirty) setConfirmOpen(true);
    else navigate("/schedule");
  }, [dirty, navigate]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      requestCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [requestCancel]);

  return {
    requestCancel,
    confirmOpen,
    onKeepEditing: () => setConfirmOpen(false),
    onDiscard: () => {
      setConfirmOpen(false);
      navigate("/schedule");
    },
  };
}
