import { expect, test } from "@playwright/test";
import { TEST_USER } from "../global-setup";

test.describe("emulator-backed sign-in", () => {
  test("signs in via the emulator-only form and lands on the schedule", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("e2e-email").fill(TEST_USER.email);
    await page.getByTestId("e2e-password").fill(TEST_USER.password);
    await page.getByTestId("e2e-signin").click();

    // After auth + access check, the AuthGate redirects "/" -> "/schedule".
    await expect(page).toHaveURL(/\/schedule$/);
    await expect(page.getByRole("heading", { name: /schedule/i })).toBeVisible();
  });
});
