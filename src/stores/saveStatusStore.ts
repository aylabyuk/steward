import { create } from "zustand";

export type SaveStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: Date }
  | { kind: "error"; message: string };

interface SaveStatusState {
  status: SaveStatus;
  markSaving: () => void;
  markSaved: () => void;
  markError: (message: string) => void;
  clear: () => void;
}

export const useSaveStatusStore = create<SaveStatusState>((set) => ({
  status: { kind: "idle" },
  markSaving: () => set({ status: { kind: "saving" } }),
  markSaved: () => set({ status: { kind: "saved", at: new Date() } }),
  markError: (message) => set({ status: { kind: "error", message } }),
  clear: () => set({ status: { kind: "idle" } }),
}));

/**
 * Translate a raw write error into a short user-facing sentence. Keeps
 * the message bank in one place so the SaveBar / any other consumer can
 * render consistent copy.
 */
export function friendlyWriteError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (/permission-denied|PERMISSION_DENIED/i.test(raw)) {
    return "You don't have permission to make that change.";
  }
  if (/network|offline|unavailable|failed to fetch/i.test(raw)) {
    return "Can't reach the server — we'll retry when you're back online.";
  }
  return raw;
}

/**
 * Back-compat helper used by write-path wrappers. Reports the error on
 * the global save-status store so the ProgramSaveBar can surface it
 * inline. Callers typically re-throw so per-component error handlers
 * (modals, dialogs) can also react.
 */
export function reportSaveError(err: unknown): void {
  useSaveStatusStore.getState().markError(friendlyWriteError(err));
}

export function reportSaving(): void {
  useSaveStatusStore.getState().markSaving();
}

export function reportSaved(): void {
  useSaveStatusStore.getState().markSaved();
}
