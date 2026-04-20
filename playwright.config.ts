import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // Auth-seeded specs live under e2e/emulators/ and need the Firebase
  // emulators running. They're driven by the separate test:e2e:emulators
  // script + playwright.emulators.config.ts.
  testIgnore: ["emulators/**"],
  fullyParallel: true,
  forbidOnly: Boolean(process.env["CI"]),
  retries: 0,
  workers: process.env["CI"] ? 1 : undefined,
  reporter: process.env["CI"] ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm build && pnpm preview",
    url: BASE_URL,
    reuseExistingServer: !process.env["CI"],
    timeout: 120_000,
  },
});
