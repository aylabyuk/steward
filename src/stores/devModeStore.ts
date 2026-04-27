import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Email allowlist for the dev-mode UI toggles. Mirrors the
 *  server-side allowlist in `functions/src/devModeAccess.ts` — keep
 *  them in sync. The server is authoritative; the client check just
 *  hides UI that wouldn't take effect anyway. */
export const DEV_MODE_EMAILS: ReadonlySet<string> = new Set(["6472022+aylabyuk@users.noreply.github.com"]);

export function isDevModeEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return DEV_MODE_EMAILS.has(email.toLowerCase());
}

interface DevModeState {
  /** When true, new speaker invitations are sent through the testing
   *  outbound number (TWILIO_FROM_NUMBER_TESTING) instead of the
   *  production default. Persisted across reloads. */
  useTestingNumber: boolean;
  setUseTestingNumber: (next: boolean) => void;
}

export const useDevModeStore = create<DevModeState>()(
  persist(
    (set) => ({
      useTestingNumber: false,
      setUseTestingNumber: (next) => set({ useTestingNumber: next }),
    }),
    { name: "steward.devMode" },
  ),
);
