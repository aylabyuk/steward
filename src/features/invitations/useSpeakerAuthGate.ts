import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/stores/authStore";

interface UseSpeakerAuthGateArgs {
  /** Called by the gate after a write action needs a signed-in
   *  speaker but there isn't one — opens the phone auth dialog. */
  requestAuth: () => void;
}

interface SpeakerAuthGateController {
  dialogOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
  /** Call after the phone-auth dialog's onVerified fires — resumes
   *  whatever write was queued by `ensureReady`. */
  handleVerified: () => void;
  /** Wraps a write: returns true once the user is phone-authed +
   *  the Twilio client is ready. Opens the auth dialog + waits
   *  when auth is missing; throws `"Phone verification cancelled."`
   *  if the user backs out of the dialog without verifying. */
  ensureAuthed: () => Promise<boolean>;
}

/** Pulls the imperative "need auth? open dialog, wait, resume"
 *  dance out of SpeakerInvitationChat so the component itself
 *  stays under the LOC ceiling. */
export function useSpeakerAuthGate({
  requestAuth,
}: UseSpeakerAuthGateArgs): SpeakerAuthGateController {
  const [dialogOpen, setDialogOpen] = useState(false);
  const resumeRef = useRef<(() => void) | null>(null);
  const rejectRef = useRef<((err: Error) => void) | null>(null);
  const dialogOpenRef = useRef(dialogOpen);
  dialogOpenRef.current = dialogOpen;

  useEffect(
    () => () => {
      rejectRef.current?.(new Error("Unmounted during phone verification."));
    },
    [],
  );

  async function ensureAuthed(): Promise<boolean> {
    const user = useAuthStore.getState().user;
    if (user?.phoneNumber) return true;
    return new Promise<boolean>((resolve, reject) => {
      resumeRef.current = () => resolve(true);
      rejectRef.current = (e) => reject(e);
      requestAuth();
      // If the dialog closes without verifying, reject.
      const pollId = window.setInterval(() => {
        const current = useAuthStore.getState().user;
        if (current?.phoneNumber) {
          window.clearInterval(pollId);
          return;
        }
        if (!dialogOpenRef.current) {
          window.clearInterval(pollId);
          reject(new Error("Phone verification cancelled."));
          resumeRef.current = null;
          rejectRef.current = null;
        }
      }, 200);
    });
  }

  function openDialog() {
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
  }

  function handleVerified() {
    setDialogOpen(false);
    resumeRef.current?.();
    resumeRef.current = null;
    rejectRef.current = null;
  }

  return { dialogOpen, openDialog, closeDialog, handleVerified, ensureAuthed };
}
