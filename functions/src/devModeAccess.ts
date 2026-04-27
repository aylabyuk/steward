import type { CallableRequest } from "firebase-functions/v2/https";
import type { FromNumberMode } from "./twilio/fromNumber.js";

/** Hardcoded email allowlist for the dev-mode "use testing number"
 *  toggle. Mirrors the lightweight gating pattern used elsewhere in
 *  the codebase (e.g. bootstrap-ward) — a general feature-flag system
 *  isn't warranted yet. Add emails as the maintainer set grows. */
const DEV_MODE_EMAILS: ReadonlySet<string> = new Set(["6472022+aylabyuk@users.noreply.github.com"]);

/** Maps the inbound `useTestingNumber` flag to a FromNumberMode,
 *  silently downgrading non-allowlisted callers to "production". The
 *  client UI is hidden for non-allowlisted users; the server check
 *  here is defense-in-depth so a crafted request can't route through
 *  the testing number. */
export function resolveCallerFromNumberMode(
  auth: CallableRequest["auth"],
  useTestingNumber: boolean | undefined,
): FromNumberMode {
  if (!useTestingNumber) return "production";
  const email = (auth?.token.email ?? "").toLowerCase();
  if (!email || !DEV_MODE_EMAILS.has(email)) return "production";
  return "testing";
}
