import { test, expect } from '@playwright/test';

test('home page shows JoJo Flora heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /jojo flora/i })).toBeVisible();
});
