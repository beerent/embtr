import { test, expect } from './fixtures';

test.describe('Task completion & metrics', () => {
    test.beforeAll(async ({ browser }) => {
        const context = await browser.newContext({
            storageState: 'e2e/.auth/user.json',
        });
        const page = await context.newPage();

        // Create an "every day" habit so today always has tasks
        await page.goto('/habits');
        await page.getByRole('button', { name: 'Add Habit' }).click();
        await page.locator('input[placeholder="e.g. Morning run"]').fill('Hydrate');
        await page.getByRole('button', { name: 'Create Habit' }).click();
        await expect(page.locator('[class*="overlay"]')).toBeHidden({ timeout: 10_000 });

        await page.close();
        await context.close();
    });

    test('completing a task shows checkmark and strikethrough', async ({ page }) => {
        await page.goto('/calendar');
        await page.getByRole('button', { name: 'Day' }).click();
        await expect(page.locator('[class*="content"][class*="loading"]')).toBeHidden({ timeout: 10_000 });

        // Find the Hydrate row and click it
        const hydrateRow = page.locator('button[class*="habitRow"]', { hasText: 'Hydrate' });
        await expect(hydrateRow).toBeVisible({ timeout: 10_000 });
        await hydrateRow.click();

        // Row should gain the complete class
        await expect(hydrateRow).toHaveClass(/complete/, { timeout: 5_000 });

        // Check icon should appear in the checkbox
        await expect(hydrateRow.locator('[class*="checkbox"] svg')).toBeVisible();
    });

    test('progress counter updates', async ({ page }) => {
        await page.goto('/calendar');
        await page.getByRole('button', { name: 'Day' }).click();
        await expect(page.locator('[class*="content"][class*="loading"]')).toBeHidden({ timeout: 10_000 });

        const progress = page.locator('[class*="progress"]');

        // Extract total count from the progress text
        const progressText = await progress.textContent();
        const totalMatch = progressText?.match(/(\d+)\/(\d+)/);
        const total = totalMatch ? parseInt(totalMatch[2]) : 0;

        // Make sure all tasks start uncompleted — uncomplete any that are complete
        const rows = page.locator('button[class*="habitRow"]');
        const rowCount = await rows.count();
        for (let i = 0; i < rowCount; i++) {
            const row = rows.nth(i);
            const classes = await row.getAttribute('class');
            if (classes?.includes('complete')) {
                await row.click();
                await expect(row).not.toHaveClass(/complete/, { timeout: 5_000 });
            }
        }

        await expect(progress).toContainText(`0/${total} complete`);

        // Complete first task
        await rows.first().click();
        await expect(progress).toContainText(`1/${total} complete`, { timeout: 5_000 });

        // Complete second task if available
        if (rowCount >= 2) {
            await rows.nth(1).click();
            await expect(progress).toContainText(`2/${total} complete`, { timeout: 5_000 });
        }
    });

    test('uncompleting reverts UI', async ({ page }) => {
        await page.goto('/calendar');
        await page.getByRole('button', { name: 'Day' }).click();
        await expect(page.locator('[class*="content"][class*="loading"]')).toBeHidden({ timeout: 10_000 });

        const hydrateRow = page.locator('button[class*="habitRow"]', { hasText: 'Hydrate' });
        await expect(hydrateRow).toBeVisible({ timeout: 10_000 });

        // Ensure it's uncompleted first
        const classes = await hydrateRow.getAttribute('class');
        if (classes?.includes('complete')) {
            await hydrateRow.click();
            await expect(hydrateRow).not.toHaveClass(/complete/, { timeout: 5_000 });
        }

        // Complete it
        await hydrateRow.click();
        await expect(hydrateRow).toHaveClass(/complete/, { timeout: 5_000 });
        await expect(hydrateRow.locator('[class*="checkbox"] svg')).toBeVisible();

        // Uncomplete it
        await hydrateRow.click();
        await expect(hydrateRow).not.toHaveClass(/complete/, { timeout: 5_000 });
        await expect(hydrateRow.locator('[class*="checkbox"] svg')).toBeHidden();
    });

    test('week view toggle works', async ({ page }) => {
        await page.goto('/calendar');
        await page.getByRole('button', { name: 'Week' }).click();
        await expect(page.locator('[class*="content"][class*="loading"]')).toBeHidden({ timeout: 10_000 });

        const taskCard = page.locator('button[class*="taskCard"]', { hasText: 'Hydrate' });
        await expect(taskCard.first()).toBeVisible({ timeout: 10_000 });

        // Ensure uncompleted state
        const firstCard = taskCard.first();
        const classes = await firstCard.getAttribute('class');
        if (classes?.includes('complete')) {
            await firstCard.click();
            await expect(firstCard).not.toHaveClass(/complete/, { timeout: 5_000 });
        }

        // Complete it
        await firstCard.click();
        await expect(firstCard).toHaveClass(/complete/, { timeout: 5_000 });

        // Uncomplete it
        await firstCard.click();
        await expect(firstCard).not.toHaveClass(/complete/, { timeout: 5_000 });
    });

    test('completion persists across navigation', async ({ page }) => {
        await page.goto('/calendar');
        await page.getByRole('button', { name: 'Day' }).click();
        await expect(page.locator('[class*="content"][class*="loading"]')).toBeHidden({ timeout: 10_000 });

        const hydrateRow = page.locator('button[class*="habitRow"]', { hasText: 'Hydrate' });
        await expect(hydrateRow).toBeVisible({ timeout: 10_000 });

        // Ensure it's uncompleted, then complete it
        const classes = await hydrateRow.getAttribute('class');
        if (classes?.includes('complete')) {
            await hydrateRow.click();
            await expect(hydrateRow).not.toHaveClass(/complete/, { timeout: 5_000 });
        }

        await hydrateRow.click();
        await expect(hydrateRow).toHaveClass(/complete/, { timeout: 5_000 });

        // Navigate away to /habits
        await page.goto('/habits');
        await expect(page.locator('[class*="addBtn"]')).toBeVisible({ timeout: 10_000 });

        // Navigate back to /calendar and switch to day view
        await page.goto('/calendar');
        await page.getByRole('button', { name: 'Day' }).click();
        await expect(page.locator('[class*="content"][class*="loading"]')).toBeHidden({ timeout: 10_000 });

        // Task should still be complete
        const hydrateRowAgain = page.locator('button[class*="habitRow"]', { hasText: 'Hydrate' });
        await expect(hydrateRowAgain).toHaveClass(/complete/, { timeout: 10_000 });

        // Progress should reflect the completion
        await expect(page.locator('[class*="progress"]')).toContainText(/[1-9]\/\d+ complete/);
    });
});
