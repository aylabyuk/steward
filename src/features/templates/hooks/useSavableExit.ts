import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@/lib/nav";

interface Options {
  /** True when the editor has unsaved changes. When false the
   *  Cancel/Esc path navigates straight to /schedule with no
   *  confirmation. */
  dirty: boolean;
  /** Persist the in-flight letter. Returns/awaits a promise so the
   *  modal can show a busy state and avoid navigating on save
   *  failure. Throws on failure — caller surfaces the error. */
  onSave: () => Promise<void>;
}

interface SavableExit {
  /** Wire to the header Cancel/X button. Opens the confirm modal
   *  when there are unsaved edits, otherwise navigates straight to
   *  /schedule. */
  requestCancel: () => void;
  confirmOpen: boolean;
  busy: boolean;
  error: string | null;
  onKeepEditing: () => void;
  onDiscard: () => void;
  onSaveAndExit: () => Promise<void>;
}

/** Three-way exit guard for editors with explicit Save (Prepare
 *  Invitation, Prepare Prayer Invitation). When `dirty`, opens a
 *  modal offering Save & exit / Discard / Cancel. Mirrors
 *  `useDiscardableExit` in the assign-slot feature but adds the
 *  Save path and the busy/error bookkeeping it needs.
 *
 *  Esc routes through `requestCancel` so desktop keyboard users hit
 *  the same guard. The host modal owns its own Esc handler with
 *  `stopImmediatePropagation`, so this listener stays silent while
 *  the modal is already open. */
export function useSavableExit({ dirty, onSave }: Options): SavableExit {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestCancel = useCallback(() => {
    if (dirty) {
      setError(null);
      setConfirmOpen(true);
    } else {
      navigate("/schedule");
    }
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
    busy,
    error,
    onKeepEditing: () => {
      if (busy) return;
      setConfirmOpen(false);
    },
    onDiscard: () => {
      setConfirmOpen(false);
      navigate("/schedule");
    },
    onSaveAndExit: async () => {
      if (busy) return;
      setBusy(true);
      setError(null);
      try {
        await onSave();
        setConfirmOpen(false);
        navigate("/schedule");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't save. Try again.");
      } finally {
        setBusy(false);
      }
    },
  };
}
