import { test, expect } from './fixtures';

test.describe('Quantity habits', () => {
    test.beforeAll(async ({ browser }) => {
        const context = await browser.newContext({
            storageState: 'e2e/.auth/user.json',
        });
        const page = await context.newPage();

        // Create a habit with quantity=3, unit="glasses"
        await page.goto('/habits');
        await page.getByRole('button', { name: 'Add Habit' }).click();
        await page.locator('input[placeholder="e.g. Morning run"]').fill('Drink Water');

        // Set quantity to 3
        const quantityInput = page.locator('input[type="number"]');
        await quantityInput.clear();
        await quantityInput.fill('3');

        // Set unit to "glasses"
        await page.locator('input[placeholder="e.g. glasses, pages, minutes"]').fill('glasses');

        await page.getByRole('button', { name: 'Create Habit' }).click();
        await expect(page.locator('[class*="overlay"]')).toBeHidden({ timeout: 10_000 });

        await page.close();
        await context.close();
    });

    test('habit list shows quantity and unit', async ({ page }) => {
        await page.goto('/habits');

        const waterCard = page.locator('[class*="card"]', { hasText: 'Drink Water' });
        await expect(waterCard).toBeVisible({ timeout: 10_000 });
        await expect(waterCard.locator('[class*="quantity"]')).toContainText('3 glasses');
    });

    test('day view shows quantity progress', async ({ page }) => {
        await page.goto('/calendar');
        await page.getByRole('button', { name: 'Day' }).click();
        await expect(page.locator('[class*="content"][class*="loading"]')).toBeHidden({ timeout: 10_000 });

        const waterRow = page.locator('button[class*="habitRow"]', { hasText: 'Drink Water' });
        await expect(waterRow).toBeVisible({ timeout: 10_000 });

        // Ensure it starts uncompleted — reset if needed
        const classes = await waterRow.getAttribute('class');
        if (classes?.includes('complete')) {
            await waterRow.click();
            await expect(waterRow).not.toHaveClass(/complete/, { timeout: 5_000 });
        }
        // Keep clicking until fully reset (completedQuantity back to 0)
        // After reset click it shows 0/3
        await expect(waterRow.locator('[class*="quantityProgress"]')).toContainText('0/3 glasses');
    });

    test('clicking increments quantity toward completion', async ({ page }) => {
        await page.goto('/calendar');
        await page.getByRole('button', { name: 'Day' }).click();
        await expect(page.locator('[class*="content"][class*="loading"]')).toBeHidden({ timeout: 10_000 });

        const waterRow = page.locator('button[class*="habitRow"]', { hasText: 'Drink Water' });
        await expect(waterRow).toBeVisible({ timeout: 10_000 });

        // Ensure starts at 0 — if complete, click to reset
        const classes = await waterRow.getAttribute('class');
        if (classes?.includes('complete')) {
            await waterRow.click();
            await expect(waterRow).not.toHaveClass(/complete/, { timeout: 5_000 });
        }

        // Click 1 → 1/3
        await waterRow.click();
        await expect(waterRow.locator('[class*="quantityProgress"]')).toContainText('1/3 glasses', { timeout: 5_000 });
        // Partial count shown in checkbox
        await expect(waterRow.locator('[class*="partialCount"]')).toContainText('1');

        // Click 2 → 2/3
        await waterRow.click();
        await expect(waterRow.locator('[class*="quantityProgress"]')).toContainText('2/3 glasses', { timeout: 5_000 });
        await expect(waterRow.locator('[class*="partialCount"]')).toContainText('2');

        // Click 3 → 3/3, should complete
        await waterRow.click();
        await expect(waterRow).toHaveClass(/complete/, { timeout: 5_000 });
        await expect(waterRow.locator('[class*="quantityProgress"]')).toContainText('3/3 glasses');
    });

    test('clicking completed quantity task resets to 0', async ({ page }) => {
        await page.goto('/calendar');
        await page.getByRole('button', { name: 'Day' }).click();
        await expect(page.locator('[class*="content"][class*="loading"]')).toBeHidden({ timeout: 10_000 });

        const waterRow = page.locator('button[class*="habitRow"]', { hasText: 'Drink Water' });
        await expect(waterRow).toBeVisible({ timeout: 10_000 });

        // Ensure it's completed — if not, click until complete
        let cls = await waterRow.getAttribute('class');
        if (!cls?.includes('complete')) {
            // Click up to 3 times to complete
            for (let i = 0; i < 3; i++) {
                await waterRow.click();
                await page.waitForTimeout(500);
                cls = await waterRow.getAttribute('class');
                if (cls?.includes('complete')) break;
            }
        }
        await expect(waterRow).toHaveClass(/complete/, { timeout: 5_000 });

        // Click to reset
        await waterRow.click();
        await expect(waterRow).not.toHaveClass(/complete/, { timeout: 5_000 });
        await expect(waterRow.locator('[class*="quantityProgress"]')).toContainText('0/3 glasses', { timeout: 5_000 });
    });
});
