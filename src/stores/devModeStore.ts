import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Email allowlist for the dev-mode UI toggles. Sourced from the
 *  `VITE_DEV_MODE_EMAILS` env var (comma-separated). Empty in
 *  production builds where the var isn't set, so dev-mode toggles
 *  are hidden for everyone. The server-side mirror lives at
 *  `functions/src/devModeAccess.ts` and reads its own env var
 *  (`DEV_MODE_EMAILS`). The server is authoritative; the client
 *  check just hides UI that wouldn't take effect anyway. */
export const DEV_MODE_EMAILS: ReadonlySet<string> = parseEmails(
  import.meta.env.VITE_DEV_MODE_EMAILS,
);

export function isDevModeEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return DEV_MODE_EMAILS.has(email.toLowerCase());
}

function parseEmails(raw: string | undefined): ReadonlySet<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
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
