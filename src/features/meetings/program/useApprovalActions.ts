import { useState } from "react";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useAuthStore } from "@/stores/authStore";
import { requestApproval, resetToDraft } from "../approvals";

interface UseApprovalActions {
  wardId: string;
  date: string;
}

/**
 * Encapsulates the two approval write paths on the Program page:
 *   - requestApproval (with bishopric self-approval shortcut)
 *   - resetToDraft   (confirm dialog)
 *
 * Keeps WeekEditor under the 150-line component cap.
 */
export function useApprovalActions({ wardId, date }: UseApprovalActions) {
  const authUser = useAuthStore((s) => s.user);
  const me = useCurrentMember();
  const [busy, setBusy] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  async function handleRequestApproval() {
    if (!authUser) return;
    setBusy(true);
    try {
      const isActiveBishopric = me?.data.active === true && me.data.role === "bishopric";
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

  async function handleResetToDraft() {
    await resetToDraft(wardId, date);
    setResetDialogOpen(false);
  }

  return {
    busy,
    resetDialogOpen,
    openResetDialog: () => setResetDialogOpen(true),
    closeResetDialog: () => setResetDialogOpen(false),
    requestApproval: () => void handleRequestApproval(),
    resetToDraft: () => handleResetToDraft(),
  };
}
