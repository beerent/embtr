import { test, expect } from './fixtures';

test.describe('DayView task completion', () => {
    test.beforeAll(async ({ browser }) => {
        const context = await browser.newContext({
            storageState: 'e2e/.auth/user.json',
        });
        const page = await context.newPage();

        // Create an "every day" habit for this spec
        await page.goto('/habits');
        await page.getByRole('button', { name: 'Add Habit' }).click();
        await page.locator('input[placeholder="e.g. Morning run"]').fill('DayViewToggle');
        await page.getByRole('button', { name: 'Create Habit' }).click();
        await expect(page.locator('[class*="overlay"]')).toBeHidden({ timeout: 10_000 });

        await page.close();
        await context.close();
    });

    test('completing a task shows checkmark', async ({ page }) => {
        await page.goto('/calendar');
        await page.getByRole('button', { name: 'Day' }).click();
        await expect(page.locator('[class*="content"][class*="loading"]')).toBeHidden({ timeout: 10_000 });

        const row = page.locator('button[class*="habitRow"]', { hasText: 'DayViewToggle' });
        await expect(row).toBeVisible({ timeout: 10_000 });

        // Ensure uncompleted first
        const classes = await row.getAttribute('class');
        if (classes?.includes('complete')) {
            await row.click();
            await expect(row).not.toHaveClass(/complete/, { timeout: 5_000 });
        }

        // Complete it
        await row.click();
        await expect(row).toHaveClass(/complete/, { timeout: 5_000 });
        await expect(row.locator('[class*="checkbox"] svg')).toBeVisible();
    });

    test('uncompleting reverts UI', async ({ page }) => {
        await page.goto('/calendar');
        await page.getByRole('button', { name: 'Day' }).click();
        await expect(page.locator('[class*="content"][class*="loading"]')).toBeHidden({ timeout: 10_000 });

        const row = page.locator('button[class*="habitRow"]', { hasText: 'DayViewToggle' });
        await expect(row).toBeVisible({ timeout: 10_000 });

        // Ensure it's completed first
        const classes = await row.getAttribute('class');
        if (!classes?.includes('complete')) {
            await row.click();
            await expect(row).toHaveClass(/complete/, { timeout: 5_000 });
        }

        // Uncomplete it
        await row.click();
        await expect(row).not.toHaveClass(/complete/, { timeout: 5_000 });
        await expect(row.locator('[class*="checkbox"] svg')).toBeHidden();
    });

    test('progress counter updates', async ({ page }) => {
        await page.goto('/calendar');
        await page.getByRole('button', { name: 'Day' }).click();
        await expect(page.locator('[class*="content"][class*="loading"]')).toBeHidden({ timeout: 10_000 });

        const progress = page.locator('[class*="progress"]');

        // Extract total from progress text
        const progressText = await progress.textContent();
        const totalMatch = progressText?.match(/(\d+)\/(\d+)/);
        const total = totalMatch ? parseInt(totalMatch[2]) : 0;

        // Reset all tasks to uncompleted
        const rows = page.locator('button[class*="habitRow"]');
        const rowCount = await rows.count();
        for (let i = 0; i < rowCount; i++) {
            const r = rows.nth(i);
            const cls = await r.getAttribute('class');
            if (cls?.includes('complete')) {
                await r.click();
                await expect(r).not.toHaveClass(/complete/, { timeout: 5_000 });
            }
        }

        await expect(progress).toContainText(`0/${total} complete`);

        // Complete the DayViewToggle task
        const row = page.locator('button[class*="habitRow"]', { hasText: 'DayViewToggle' });
        await row.click();
        await expect(row).toHaveClass(/complete/, { timeout: 5_000 });

        await expect(progress).toContainText(`1/${total} complete`, { timeout: 5_000 });
    });

    test('completion syncs to today page', async ({ page }) => {
        await page.goto('/calendar');
        await page.getByRole('button', { name: 'Day' }).click();
        await expect(page.locator('[class*="content"][class*="loading"]')).toBeHidden({ timeout: 10_000 });

        const row = page.locator('button[class*="habitRow"]', { hasText: 'DayViewToggle' });
        await expect(row).toBeVisible({ timeout: 10_000 });

        // Ensure uncompleted first
        const classes = await row.getAttribute('class');
        if (classes?.includes('complete')) {
            await row.click();
            await expect(row).not.toHaveClass(/complete/, { timeout: 5_000 });
        }

        // Complete on calendar Day view
        await row.click();
        await expect(row).toHaveClass(/complete/, { timeout: 5_000 });

        // Navigate to /today and verify
        await page.goto('/today');
        await expect(page.locator('[class*="content"][class*="loading"]')).toBeHidden({ timeout: 10_000 });

        const todayRow = page.locator('button[class*="habitRow"]', { hasText: 'DayViewToggle' });
        await expect(todayRow).toHaveClass(/complete/, { timeout: 10_000 });
    });
});
