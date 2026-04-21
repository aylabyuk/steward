import { useState } from "react";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import type { Approval } from "@/lib/types";
import { useAuthStore } from "@/stores/authStore";
import { AlreadyApprovedError, approveMeeting, requestApproval, resetToDraft } from "../approvals";

interface UseApprovalActions {
  wardId: string;
  date: string;
  approvals: readonly Approval[];
}

/**
 * Encapsulates the approval write paths on the Program page:
 *   - requestApproval (with bishopric self-approval shortcut)
 *   - approveMeeting  (second bishopric vote)
 *   - resetToDraft    (confirm dialog)
 *
 * Also exposes `canApprove` — true when the signed-in user is an
 * active bishopric member who hasn't already approved the live
 * version of this meeting.
 */
export function useApprovalActions({ wardId, date, approvals }: UseApprovalActions) {
  const authUser = useAuthStore((s) => s.user);
  const me = useCurrentMember();
  const [busy, setBusy] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isActiveBishopric = me?.data.active === true && me.data.role === "bishopric";
  const alreadyApproved = authUser
    ? approvals.some((a) => a.uid === authUser.uid && !a.invalidated)
    : false;
  const canApprove = Boolean(authUser && isActiveBishopric && !alreadyApproved);

  async function handleRequestApproval() {
    if (!authUser) return;
    setBusy(true);
    setError(null);
    try {
      await requestApproval(wardId, date, {
        uid: authUser.uid,
        email: authUser.email ?? "",
        displayName: authUser.displayName ?? authUser.email ?? "",
        isBishopric: isActiveBishopric,
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleApprove() {
    if (!authUser) return;
    setBusy(true);
    setError(null);
    try {
      await approveMeeting({
        wardId,
        date,
        uid: authUser.uid,
        email: authUser.email ?? "",
        displayName: me?.data.displayName ?? authUser.displayName ?? authUser.email ?? "",
      });
    } catch (e) {
      setError(e instanceof AlreadyApprovedError ? e.message : (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleResetToDraft() {
    await resetToDraft(wardId, date);
    setResetDialogOpen(false);
  }

  return {
    busy,
    error,
    canApprove,
    alreadyApproved,
    resetDialogOpen,
    openResetDialog: () => setResetDialogOpen(true),
    closeResetDialog: () => setResetDialogOpen(false),
    requestApproval: () => void handleRequestApproval(),
    approve: () => void handleApprove(),
    resetToDraft: () => handleResetToDraft(),
  };
}
