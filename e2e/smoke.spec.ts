import { test, expect } from "@playwright/test";

test("home renders the app heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /steward/i })).toBeVisible();
});
