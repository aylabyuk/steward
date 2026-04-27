import type { CallableRequest } from "firebase-functions/v2/https";
import type { FromNumberMode } from "./twilio/fromNumber.js";

/** Email allowlist for the dev-mode "use testing number" toggle.
 *  Sourced from the `DEV_MODE_EMAILS` env var (comma-separated),
 *  loaded by Firebase Functions at deploy time from the per-project
 *  `.env.<projectId>` file (or `.env.local` in the emulator). Empty
 *  by default — production deploys can set the var when the
 *  maintainer set is small enough not to warrant a general
 *  feature-flag system. */
const DEV_MODE_EMAILS: ReadonlySet<string> = parseEmails(process.env.DEV_MODE_EMAILS);

function parseEmails(raw: string | undefined): ReadonlySet<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

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
