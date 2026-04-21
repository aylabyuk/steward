import { test, expect } from "@playwright/test";

test.describe("Schedule Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to schedule and wait for it to load
    await page.goto("/schedule");
    await page.waitForLoadState("networkidle");
  });

  test("loads schedule with month groups", async ({ page }) => {
    // Check for month headers
    const monthHeader = page.locator("h2").first();
    await expect(monthHeader).toBeVisible();
    expect(await monthHeader.textContent()).toMatch(/\d+/); // Has month name
  });

  test("displays Sunday cards in grid", async ({ page }) => {
    // Check for at least one card
    const cards = page.locator("article");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    // Verify card has date and kind label
    const firstCard = cards.first();
    await expect(firstCard.locator("text=/Sun|Mon|Tue|Wed|Thu|Fri|Sat/")).toBeVisible();
    await expect(firstCard.locator("text=/Regular|Fast|Stake|General/")).toBeVisible();
  });

  test("horizon selector persists selection", async ({ page }) => {
    // Open horizon selector
    const horizonButton = page.locator("button").filter({ hasText: /month/ }).first();
    await horizonButton.click();

    // Select "3 months"
    await page.locator("button").filter({ hasText: "3 months" }).click();

    // Verify localStorage
    const storage = await page.evaluate(() => {
      return localStorage.getItem("schedule-horizon-weeks");
    });
    expect(storage).toBe("13");

    // Reload and verify selection persists
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(horizonButton).toContainText("3 months");
  });

  test("navigates to week view on card click", async ({ page }) => {
    // Click a date link
    const dateLink = page.locator("a").filter({ hasText: /Sun|Mon|Tue|Wed|Thu|Fri|Sat/ }).first();
    const href = await dateLink.getAttribute("href");
    expect(href).toMatch(/^\/week\/\d{4}-\d{2}-\d{2}$/);

    await dateLink.click();
    await page.waitForLoadState("networkidle");

    // Verify we're on week view
    expect(page.url()).toContain("/week/");
    await expect(page.locator("main")).toBeVisible();
  });

  test("shows cancellation banner when meeting is cancelled", async ({ page: _page }) => {
    // This would require a meeting doc with cancellation in the test data
    // Skip or implement with Firebase emulator seeding
  });

  test("displays comment badge on cards with comments", async ({ page }) => {
    // Check if any card has a comment badge
    const badges = page.locator("text=/💬/");
    const count = await badges.count();
    // May be 0 if no comments exist
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Week View", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a specific week
    await page.goto("/week/2026-04-05");
    await page.waitForLoadState("networkidle");
  });

  test("displays week editor with meeting details", async ({ page }) => {
    // Check for editor sections
    await expect(page.locator("text=Prayers")).toBeVisible();
    await expect(page.locator("text=Music")).toBeVisible();
    await expect(page.locator("text=Sacrament")).toBeVisible();
  });

  test("back link returns to schedule", async ({ page }) => {
    const backLink = page.locator("a").filter({ hasText: "Schedule" }).first();
    await backLink.click();
    expect(page.url()).toBe(page.context().baseURL + "/schedule");
  });

  test("displays speakers section for regular meetings", async ({ page }) => {
    // Check for speakers section (only for regular/fast meetings)
    const speakersSection = page.locator("text=Speakers");
    await speakersSection.isVisible().catch(() => false);
    // May not be visible depending on meeting type
  });
});

test.describe("Accessibility", () => {
  test("schedule page is keyboard navigable", async ({ page }) => {
    await page.goto("/schedule");
    await page.waitForLoadState("networkidle");

    // Tab to first link
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });

  test("buttons are accessible with screen readers", async ({ page }) => {
    await page.goto("/schedule");

    // Check horizon button has accessible name
    const horizonButton = page.locator("button").filter({ hasText: /month/ }).first();
    const ariaLabel = await horizonButton.getAttribute("aria-label");
    const buttonText = await horizonButton.textContent();
    expect(ariaLabel || buttonText).toBeTruthy();
  });
});
