import { useEffect } from "react";
import { create } from "zustand";

type State = { online: boolean; justReconnected: boolean };

interface OnlineStatusState extends State {
  setOnline: (online: boolean) => void;
  clearReconnected: () => void;
}

const initial: State = {
  online: typeof navigator === "undefined" ? true : navigator.onLine,
  justReconnected: false,
};

export const useOnlineStatusStore = create<OnlineStatusState>((set, get) => ({
  ...initial,
  setOnline: (online) => {
    const wasOffline = !get().online;
    set({ online, justReconnected: online && wasOffline });
  },
  clearReconnected: () => set({ justReconnected: false }),
}));

/**
 * Call once from a top-level component so the browser's online/offline
 * events drive the store. The "justReconnected" flag flips true briefly
 * after a reconnect so the UI can show a transient "Back online" note.
 */
export function useOnlineStatusEffect(): void {
  useEffect(() => {
    const set = useOnlineStatusStore.getState().setOnline;
    const onOnline = () => set(true);
    const onOffline = () => set(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    // Initial sync in case navigator.onLine changed before listeners attached.
    set(navigator.onLine);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);
}
