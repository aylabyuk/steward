import { create } from "zustand";

export interface CurrentWardState {
  wardId: string | null;
  setWardId: (id: string | null) => void;
}

export const useCurrentWardStore = create<CurrentWardState>((set) => ({
  wardId: null,
  setWardId: (id) => set({ wardId: id }),
}));
