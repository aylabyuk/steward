// One-off Playwright config for iterating against an already-running
// `pnpm dev` server + already-running Firebase emulators. The spec
// under e2e/emulators/wysiwyg-letter-persist.spec.ts seeds its own
// unique ward + user via the emulator REST APIs so we don't trample
// the developer's existing Firestore state.
//
// Usage: `FIREBASE_PROJECT=<projectId> pnpm exec playwright test \
//   --config playwright.iterate.config.ts wysiwyg-letter-persist`

import { defineConfig, devices } from "@playwright/test";

const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e/emulators",
  testMatch: /wysiwyg-letter-persist\.spec\.ts$/,
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
