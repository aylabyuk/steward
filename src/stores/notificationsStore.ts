import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NotificationsState {
  promptDismissed: boolean;
  iosNudgeDismissed: boolean;
  dismissPrompt: () => void;
  dismissIosNudge: () => void;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      promptDismissed: false,
      iosNudgeDismissed: false,
      dismissPrompt: () => set({ promptDismissed: true }),
      dismissIosNudge: () => set({ iosNudgeDismissed: true }),
    }),
    { name: "steward.notifications" },
  ),
);
