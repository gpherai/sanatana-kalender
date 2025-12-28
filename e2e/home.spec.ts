import { test, expect } from '@playwright/test';

test('homepage loads successfully', async ({ page }) => {
  await page.goto('/');

  // Check if the title contains expected text
  // Adjust this based on your actual homepage title
  await expect(page).toHaveTitle(/Dharma|Kalender/i);
  
  // Check if the main calendar component is visible
  // We look for something general that should always be there
  const main = page.locator('main');
  await expect(main).toBeVisible();
});
