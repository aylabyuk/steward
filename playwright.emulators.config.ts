// Emulator-backed Playwright config. Builds the app with VITE_USE_EMULATORS=true
// so the SDK + login form route to the local Auth/Firestore emulators, then
// runs the auth-seeded specs under e2e/emulators/.
//
// Use via `pnpm test:e2e:emulators` which wraps the run with `firebase
// emulators:exec` so Auth + Firestore are guaranteed up. The default
// `pnpm test:e2e` (playwright.config.ts) keeps targeting the prod-like
// preview build with no emulators -- it stays in CI for now.

import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e/emulators",
  fullyParallel: false, // shared seeded state
  forbidOnly: Boolean(process.env["CI"]),
  retries: 0,
  workers: 1,
  reporter: process.env["CI"] ? [["list"], ["html", { open: "never" }]] : "list",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "VITE_USE_EMULATORS=true pnpm build && pnpm preview",
    url: BASE_URL,
    reuseExistingServer: !process.env["CI"],
    timeout: 180_000,
    env: { VITE_USE_EMULATORS: "true" },
  },
});
