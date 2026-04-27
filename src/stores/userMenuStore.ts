import { create } from "zustand";

interface UserMenuStore {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  close: () => void;
}

/** Open/close state for the user menu. Lifted to a store because the
 *  trigger (in Topbar/UserMenu) and the mobile side drawer (rendered
 *  by AppShell so it can coordinate the page-push transform) live in
 *  different parts of the tree. Desktop continues to use the inline
 *  popover, which also reads from this same store so the trigger stays
 *  in sync regardless of which surface is rendering the contents. */
export const useUserMenuStore = create<UserMenuStore>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
  close: () => set({ open: false }),
}));
