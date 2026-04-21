import { useState } from "react";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useWardMembers } from "@/hooks/useWardMembers";
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
  // Once this flips false, `me` has resolved (either to a member doc or to
  // null if the user isn't in this ward). We use it to disable the Request
  // approval button during the brief first-render window where a bishopric
  // user would otherwise be mis-classified as non-bishopric and have their
  // self-approval dropped.
  const { loading: memberLoading } = useWardMembers();
  const [busy, setBusy] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const memberReady = !memberLoading;
  const isActiveBishopric = me?.data.active === true && me.data.role === "bishopric";
  const alreadyApproved = authUser
    ? approvals.some((a) => a.uid === authUser.uid && !a.invalidated)
    : false;
  const canApprove = Boolean(authUser && isActiveBishopric && !alreadyApproved);

  async function handleRequestApproval() {
    if (!authUser || !memberReady) return;
    setBusy(true);
    setError(null);
    try {
      await requestApproval(wardId, date, {
        uid: authUser.uid,
        email: authUser.email ?? "",
        // Prefer the member-doc name (full name) over the Auth displayName
        // (often first-name-only) so the stored self-approval has the
        // full name from the start.
        displayName: me?.data.displayName ?? authUser.displayName ?? authUser.email ?? "",
        isBishopric: isActiveBishopric,
      });
    } catch (e) {
      setError((e as Error).message);
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
    setBusy(true);
    setError(null);
    try {
      await resetToDraft(wardId, date);
      setResetDialogOpen(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return {
    busy,
    error,
    memberReady,
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
