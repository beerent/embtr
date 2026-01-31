import { test, expect } from './fixtures';

test.describe('Hard mode', () => {
    test.afterAll(async ({ browser }) => {
        // Ensure hard mode is off so it doesn't leak to other test files
        const context = await browser.newContext({
            storageState: 'e2e/.auth/user.json',
        });
        const page = await context.newPage();
        await page.goto('/settings');
        const toggle = page.locator('input[type="checkbox"]');
        if (await toggle.isChecked()) {
            await toggle.click();
            await page.waitForTimeout(1000);
        }
        await page.close();
        await context.close();
    });

    test('blocks past day completion in day view', async ({ page }) => {
        // Enable hard mode via settings toggle
        await page.goto('/settings');
        const toggle = page.locator('input[type="checkbox"]');
        await expect(toggle).toBeVisible({ timeout: 10_000 });

        if (!(await toggle.isChecked())) {
            await toggle.click();
            await page.waitForTimeout(1000);
        }
        await expect(toggle).toBeChecked();

        // Navigate to calendar day view
        await page.goto('/calendar');
        await page.getByRole('button', { name: 'Day' }).click();
        await expect(page.locator('[class*="content"][class*="loading"]')).toBeHidden({ timeout: 10_000 });

        // Navigate to yesterday using the left nav button
        const navButtons = page.locator('[class*="navBtn"]');
        await navButtons.first().click();
        await expect(page.locator('[class*="content"][class*="loading"]')).toBeHidden({ timeout: 10_000 });

        // Yesterday's tasks should be disabled
        const yesterdayRows = page.locator('button[class*="habitRow"]');
        const yesterdayCount = await yesterdayRows.count();
        if (yesterdayCount > 0) {
            await expect(yesterdayRows.first()).toBeDisabled();
            await expect(yesterdayRows.first()).toHaveClass(/disabled/);
        }
    });

    test('allows today completion when hard mode enabled', async ({ page }) => {
        // Ensure hard mode is on
        await page.goto('/settings');
        const toggle = page.locator('input[type="checkbox"]');
        await expect(toggle).toBeVisible({ timeout: 10_000 });

        if (!(await toggle.isChecked())) {
            await toggle.click();
            await page.waitForTimeout(1000);
        }

        // Navigate to calendar day view (today)
        await page.goto('/calendar');
        await page.getByRole('button', { name: 'Day' }).click();
        await expect(page.locator('[class*="content"][class*="loading"]')).toBeHidden({ timeout: 10_000 });

        // Today's tasks should be clickable (not disabled)
        const todayRows = page.locator('button[class*="habitRow"]');
        const todayCount = await todayRows.count();
        if (todayCount > 0) {
            await expect(todayRows.first()).toBeEnabled();
            await expect(todayRows.first()).not.toHaveClass(/disabled/);
        }
    });

    test('blocks past day in week view', async ({ page }) => {
        // Ensure hard mode is on
        await page.goto('/settings');
        const toggle = page.locator('input[type="checkbox"]');
        await expect(toggle).toBeVisible({ timeout: 10_000 });

        if (!(await toggle.isChecked())) {
            await toggle.click();
            await page.waitForTimeout(1000);
        }

        await page.goto('/calendar');
        await page.getByRole('button', { name: 'Week' }).click();
        await expect(page.locator('[class*="content"][class*="loading"]')).toBeHidden({ timeout: 10_000 });

        const todayIndex = new Date().getDay();
        const columns = page.locator('[class*="column"]');

        // Check a non-today column for disabled task cards
        for (let i = 0; i < 7; i++) {
            if (i === todayIndex) continue;
            const col = columns.nth(i);
            const cards = col.locator('button[class*="taskCard"]');
            const count = await cards.count();
            if (count > 0) {
                await expect(cards.first()).toBeDisabled();
                await expect(cards.first()).toHaveClass(/disabled/);
                break; // Found at least one non-today disabled card
            }
        }

        // Today's column tasks should NOT be disabled
        const todayCol = columns.nth(todayIndex);
        const todayCards = todayCol.locator('button[class*="taskCard"]');
        const todayCardCount = await todayCards.count();
        if (todayCardCount > 0) {
            await expect(todayCards.first()).toBeEnabled();
            await expect(todayCards.first()).not.toHaveClass(/disabled/);
        }
    });

    test('disabling hard mode re-enables past days', async ({ page }) => {
        // Ensure hard mode is on first
        await page.goto('/settings');
        const toggle = page.locator('input[type="checkbox"]');
        await expect(toggle).toBeVisible({ timeout: 10_000 });

        if (!(await toggle.isChecked())) {
            await toggle.click();
            await page.waitForTimeout(1000);
        }
        await expect(toggle).toBeChecked();

        // Now disable hard mode
        await toggle.click();
        await page.waitForTimeout(1000);
        await expect(toggle).not.toBeChecked();

        // Navigate to calendar, go to yesterday
        await page.goto('/calendar');
        await page.getByRole('button', { name: 'Day' }).click();
        await expect(page.locator('[class*="content"][class*="loading"]')).toBeHidden({ timeout: 10_000 });

        // Navigate to yesterday
        const navButtons = page.locator('[class*="navBtn"]');
        await navButtons.first().click();
        await expect(page.locator('[class*="content"][class*="loading"]')).toBeHidden({ timeout: 10_000 });

        // Tasks should be clickable (not disabled)
        const rows = page.locator('button[class*="habitRow"]');
        const count = await rows.count();
        if (count > 0) {
            await expect(rows.first()).toBeEnabled();
            await expect(rows.first()).not.toHaveClass(/disabled/);
        }
    });
});
