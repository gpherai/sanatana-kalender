import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads successfully with title and main content", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Dharma|Kalender/i);
    await expect(page.locator("main")).toBeVisible();
  });

  test("hero shows today's Dutch weekday", async ({ page }) => {
    await page.goto("/");

    const days = [
      "zondag",
      "maandag",
      "dinsdag",
      "woensdag",
      "donderdag",
      "vrijdag",
      "zaterdag",
    ];
    const todayDay = days[new Date().getDay()]!;

    await expect(page.locator("body")).toContainText(new RegExp(todayDay, "i"));
  });

  test("calendar renders", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator(".dharma-calendar")).toBeVisible({ timeout: 10000 });
  });

  test("sidebar shows upcoming events section", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText(/Binnenkort \(7 dagen\)/i)).toBeVisible();
  });

  test("category legend is visible", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText(/Godheden/i)).toBeVisible();
  });

  test("does not throw browser runtime errors on load", async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (message) => {
      if (message.type() === "error") {
        errors.push(message.text());
      }
    });
    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const criticalErrors = errors.filter(
      (error) => !error.includes("favicon") && !error.includes("404")
    );
    expect(criticalErrors).toEqual([]);
  });
});
