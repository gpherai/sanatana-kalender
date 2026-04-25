import { test, expect } from "@playwright/test";

test.describe("Kundali Page", () => {
  test("calculates a birth chart from the form", async ({ page }) => {
    await page.goto("/kundali");

    // Check header
    await expect(page.getByRole("heading", { name: "Kundali" })).toBeVisible();

    // Fill the form
    await page.getByPlaceholder("DD").fill("20");
    await page.getByPlaceholder("MM").fill("11");
    await page.getByPlaceholder("JJJJ").fill("1987");
    await page.locator('input[type="time"]').fill("10:30");

    // Default Amsterdam is usually there but let's be explicit
    await page.getByLabel(/Breedtegraad \(lat\)/i).fill("52.3676");
    await page.getByLabel(/Lengtegraad \(lon\)/i).fill("4.9041");
    await page.getByLabel(/Tijdzone/i).fill("Europe/Amsterdam");

    // Click submit
    await page.getByRole("button", { name: "Bereken Kundali" }).click();

    // Wait for result section
    await expect(page.getByText("Technische details")).toBeVisible({ timeout: 10000 });

    // Check for some results in table view
    await page.getByRole("button", { name: "D1 Tabel" }).click();
    await expect(page.getByText("Navagrahas — D1")).toBeVisible();
    await expect(page.getByRole("cell", { name: "Surya" })).toBeVisible();

    // Check technical details
    await page.getByText("Technische details").click();
    await expect(page.getByText("Julian Day:")).toBeVisible();
  });
});
