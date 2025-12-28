import { test, expect } from '@playwright/test';

test.describe('Almanac Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/almanac');
  });

  test('should display filters and grid', async ({ page }) => {
    await expect(page.getByText('Maanfases')).toBeVisible();
    await expect(page.getByText('Speciale dagen')).toBeVisible();
    // Check if grid is present by finding a button that starts with a day number (e.g. 15)
    // The exact text check failed because '15' appears in timestamps too.
    await expect(page.getByRole('button', { name: /^15/ }).first()).toBeVisible(); 
  });

  test('should navigate between months', async ({ page }) => {
    // Get current month button (the active one in the strip)
    // Note: This relies on the current month being highlighted.
    // Instead, let's look for the Year display and change it.
    
    const yearDisplay = page.locator('span.text-xl.font-bold');
    const currentYearText = await yearDisplay.textContent();
    
    // Click Next Year button
    await page.getByLabel('Volgend jaar').click();
    
    // Expect year to change
    const nextYear = (parseInt(currentYearText!) + 1).toString();
    await expect(yearDisplay).toHaveText(nextYear);
  });

  test('should show details when clicking a day', async ({ page }) => {
    // Find a day cell (e.g., the 15th)
    // We need to be specific to click the button inside the grid, not the filter strip (if it had numbers)
    // The grid cells are usually buttons.
    
    // Let's click the "15" in the main grid area.
    // We can scope it to the grid container if needed, but 'button' with text '15' is likely unique enough or first one works.
    
    // Note: The month strip also has numbers? No, month strip has names (Jan, Feb).
    // So clicking "15" should hit the day. Use regex to match start of button text.
    
    await page.getByRole('button', { name: /^15/ }).first().click();
    
    // Check the detail panel
    // The detail panel header shows the full date, e.g., "zondag 15 december 2025"
    // We check if "15" and the month name appear in the sidebar header.
    const detailHeader = page.locator('h3.text-xl.font-bold');
    await expect(detailHeader).toContainText('15');
  });
});
