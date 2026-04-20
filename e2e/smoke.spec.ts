import { test, expect } from "@playwright/test";

test("login page renders the sign-in button", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /steward/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
});
