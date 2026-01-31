import { test as setup, expect } from '@playwright/test';

setup('create test user and save auth state', async ({ page }) => {
    const username = `e2e_user_${Date.now()}`;
    const password = 'TestPass123!';

    await page.goto('/signup');

    await page.locator('#signup-username').fill(username);
    await page.locator('#signup-display-name').fill('E2E Test User');
    await page.locator('#signup-password').fill(password);
    await page.locator('#signup-confirm-password').fill(password);

    await page.getByRole('button', { name: 'Sign Up' }).click();

    await page.waitForURL('**/dashboard', { timeout: 15_000 });

    await expect(page).toHaveURL(/\/dashboard/);

    await page.context().storageState({ path: 'e2e/.auth/user.json' });
});
