import { test, expect } from './fixtures';

test.describe.serial('Habit creation & management', () => {
    test('shows empty state', async ({ page }) => {
        await page.goto('/habits');
        await expect(
            page.getByText('No habits yet. Create your first habit to get started.')
        ).toBeVisible();
    });

    test('creates habit with all days', async ({ page }) => {
        await page.goto('/habits');

        await page.getByRole('button', { name: 'Add Habit' }).click();

        // Fill in the form
        await page.locator('input[placeholder="e.g. Morning run"]').fill('Morning Run');
        await page.locator('textarea[placeholder="Optional description"]').fill('5k jog');

        // All 7 days are selected by default — just submit
        await page.getByRole('button', { name: 'Create Habit' }).click();

        // Wait for modal to close
        await expect(page.locator('[class*="overlay"]')).toBeHidden({ timeout: 10_000 });

        // Verify the card appears
        await expect(page.locator('[class*="cardTitle"]', { hasText: 'Morning Run' })).toBeVisible();
        await expect(page.locator('[class*="cardDesc"]', { hasText: '5k jog' })).toBeVisible();
        await expect(page.locator('[class*="schedule"]', { hasText: 'Every day' })).toBeVisible();
    });

    test('creates habit with specific days', async ({ page }) => {
        await page.goto('/habits');

        await page.getByRole('button', { name: 'Add Habit' }).click();

        await page.locator('input[placeholder="e.g. Morning run"]').fill('Read Book');

        // Deselect Sun (0), Tue (2), Thu (4), Sat (6) — keep Mon, Wed, Fri
        const dayButtons = page.locator('[class*="dayBtn"]');
        await dayButtons.nth(0).click(); // deselect Sun
        await dayButtons.nth(2).click(); // deselect Tue
        await dayButtons.nth(4).click(); // deselect Thu
        await dayButtons.nth(6).click(); // deselect Sat

        await page.getByRole('button', { name: 'Create Habit' }).click();

        await expect(page.locator('[class*="overlay"]')).toBeHidden({ timeout: 10_000 });

        await expect(page.locator('[class*="cardTitle"]', { hasText: 'Read Book' })).toBeVisible();
        await expect(page.locator('[class*="schedule"]', { hasText: 'Mon, Wed, Fri' })).toBeVisible();
    });

    test('edits a habit', async ({ page }) => {
        await page.goto('/habits');

        // Find the "Morning Run" card and click its Edit button
        const morningRunCard = page.locator('[class*="card"]', { hasText: 'Morning Run' });
        await morningRunCard.locator('button[title="Edit"]').click();

        // Change the title
        const titleInput = page.locator('input[placeholder="e.g. Morning run"]');
        await titleInput.clear();
        await titleInput.fill('Evening Run');

        await page.getByRole('button', { name: 'Save Changes' }).click();

        await expect(page.locator('[class*="overlay"]')).toBeHidden({ timeout: 10_000 });

        // Verify updated title
        await expect(page.locator('[class*="cardTitle"]', { hasText: 'Evening Run' })).toBeVisible();
        await expect(page.locator('[class*="cardTitle"]', { hasText: 'Morning Run' })).toBeHidden();
    });

    test('archives a habit', async ({ page }) => {
        await page.goto('/habits');

        // Archive "Evening Run"
        const eveningRunCard = page.locator('[class*="card"]', { hasText: 'Evening Run' });
        await eveningRunCard.locator('button[title="Archive"]').click();

        // Evening Run should disappear
        await expect(page.locator('[class*="cardTitle"]', { hasText: 'Evening Run' })).toBeHidden({ timeout: 10_000 });

        // Read Book should still be visible
        await expect(page.locator('[class*="cardTitle"]', { hasText: 'Read Book' })).toBeVisible();
    });
});
