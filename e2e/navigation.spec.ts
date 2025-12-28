import { test, expect } from '@playwright/test';

test('navigation works via header links', async ({ page }) => {
  await page.goto('/');

  // Navigate to Almanac
  await page.getByRole('link', { name: 'Almanac' }).click();
  await expect(page).toHaveURL(/.*almanac/);
  await expect(page.getByText('Maanfases')).toBeVisible(); // Check for specific content

  // Navigate to Events
  await page.getByRole('link', { name: 'Events' }).click();
  await expect(page).toHaveURL(/.*events/);
  
  // Navigate to Settings
  await page.getByRole('link', { name: 'Instellingen' }).click();
  await expect(page).toHaveURL(/.*settings/);
});
