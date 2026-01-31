import { test, expect } from './fixtures';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

/** Helper: create a habit via the /habits UI.
 *  `days` selects specific days (0=Sun..6=Sat). Omit for all days. */
async function createHabit(
    page: import('@playwright/test').Page,
    title: string,
    options?: { onlyToday?: boolean; days?: number[] },
) {
    await page.goto('/habits');
    await page.getByRole('button', { name: 'Add Habit' }).click();
    await page.locator('input[placeholder="e.g. Morning run"]').fill(title);

    if (options?.onlyToday) {
        const dayButtons = page.locator('[class*="dayBtn"]');
        const todayIndex = new Date().getDay();
        for (let i = 0; i < 7; i++) {
            if (i !== todayIndex) {
                await dayButtons.nth(i).click();
            }
        }
    } else if (options?.days) {
        // All 7 days are selected by default. Deselect the ones not in the list.
        const dayButtons = page.locator('[class*="dayBtn"]');
        for (let i = 0; i < 7; i++) {
            if (!options.days.includes(i)) {
                await dayButtons.nth(i).click();
            }
        }
    }

    await page.getByRole('button', { name: 'Create Habit' }).click();
    await expect(page.locator('[class*="overlay"]')).toBeHidden({ timeout: 10_000 });
}

test.describe('Calendar views', () => {
    test.beforeAll(async ({ browser }) => {
        const context = await browser.newContext({
            storageState: 'e2e/.auth/user.json',
        });
        const page = await context.newPage();

        // Create an "every day" habit
        await createHabit(page, 'Daily Check-in');

        // Create a habit scheduled only for today's day of the week
        await createHabit(page, 'Today Focus', { onlyToday: true });

        await page.close();
        await context.close();
    });

    test('month view shows title', async ({ page }) => {
        await page.goto('/calendar');
        const now = new Date();
        const expectedTitle = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
        await expect(page.locator('h2')).toContainText(expectedTitle);
    });

    test('view switcher toggles views', async ({ page }) => {
        await page.goto('/calendar');

        // Switch to Week
        await page.getByRole('button', { name: 'Week' }).click();
        // Should see 7 column headers
        const colHeaders = page.locator('[class*="colHeader"]');
        await expect(colHeaders).toHaveCount(7);

        // Switch to Day
        await page.getByRole('button', { name: 'Day' }).click();
        // Should see a full day name
        const today = new Date();
        const fullDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];
        await expect(page.locator('[class*="dayName"]')).toContainText(fullDayName);

        // Switch back to Month
        await page.getByRole('button', { name: 'Month' }).click();
        await expect(page.locator('[class*="grid"]')).toBeVisible();
    });

    test('month view shows task pills', async ({ page }) => {
        await page.goto('/calendar');
        // Wait for loading to finish
        await expect(page.locator('[class*="content"][class*="loading"]')).toBeHidden({ timeout: 10_000 });

        const pill = page.locator('[class*="taskPill"]', { hasText: 'Daily Check-in' });
        await expect(pill.first()).toBeVisible({ timeout: 10_000 });
    });

    test('week view shows tasks', async ({ page }) => {
        await page.goto('/calendar');
        await page.getByRole('button', { name: 'Week' }).click();
        await expect(page.locator('[class*="content"][class*="loading"]')).toBeHidden({ timeout: 10_000 });

        const taskCard = page.locator('[class*="taskCard"]', { hasText: 'Daily Check-in' });
        await expect(taskCard.first()).toBeVisible({ timeout: 10_000 });
    });

    test('day view shows tasks and progress', async ({ page }) => {
        await page.goto('/calendar');
        await page.getByRole('button', { name: 'Day' }).click();
        await expect(page.locator('[class*="content"][class*="loading"]')).toBeHidden({ timeout: 10_000 });

        // Task should be in the list
        await expect(
            page.locator('[class*="habitTitle"]', { hasText: 'Daily Check-in' })
        ).toBeVisible({ timeout: 10_000 });

        // Progress shows "0/N complete"
        await expect(page.locator('[class*="progress"]')).toContainText(/0\/\d+ complete/);
    });

    test('navigation moves between periods', async ({ page }) => {
        await page.goto('/calendar');

        const now = new Date();
        const currentMonthTitle = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
        await expect(page.locator('h2')).toContainText(currentMonthTitle);

        // Navigate forward
        const navButtons = page.locator('[class*="navBtn"]');
        await navButtons.last().click();
        await expect(page.locator('h2')).not.toContainText(currentMonthTitle, { timeout: 5_000 });

        // Navigate back twice (past original)
        await navButtons.first().click();
        await navButtons.first().click();

        // Should be previous month
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonthTitle = `${MONTH_NAMES[prevMonth.getMonth()]} ${prevMonth.getFullYear()}`;
        await expect(page.locator('h2')).toContainText(prevMonthTitle);

        // Click Today to return
        await page.getByRole('button', { name: 'Today' }).click();
        await expect(page.locator('h2')).toContainText(currentMonthTitle);
    });

    test('habit appears only on scheduled days', async ({ page }) => {
        await page.goto('/calendar');
        await page.getByRole('button', { name: 'Week' }).click();
        await expect(page.locator('[class*="content"][class*="loading"]')).toBeHidden({ timeout: 10_000 });

        const todayIndex = new Date().getDay();
        const columns = page.locator('[class*="column"]');

        // "Today Focus" should appear in today's column
        const todayColumn = columns.nth(todayIndex);
        await expect(
            todayColumn.locator('[class*="taskCard"]', { hasText: 'Today Focus' })
        ).toBeVisible({ timeout: 10_000 });

        // "Today Focus" should NOT appear in other columns
        for (let i = 0; i < 7; i++) {
            if (i === todayIndex) continue;
            await expect(
                columns.nth(i).locator('[class*="taskCard"]', { hasText: 'Today Focus' })
            ).toBeHidden();
        }
    });
});

test.describe('Overlapping schedules', () => {
    // Regression: adding a new habit must backfill tasks into PlannedDays
    // that were already created for an earlier habit.
    test('new every-day habit appears alongside existing weekend habit', async ({ page }) => {
        // 1. Create a weekend-only habit and visit calendar to materialise PlannedDays
        await createHabit(page, 'Weekend Jog', { days: [0, 6] }); // Sun, Sat
        await page.goto('/calendar');
        await page.getByRole('button', { name: 'Week' }).click();
        await expect(page.locator('[class*="content"][class*="loading"]')).toBeHidden({ timeout: 10_000 });

        // Saturday column (index 6) should have "Weekend Jog"
        const columns = page.locator('[class*="column"]');
        await expect(
            columns.nth(6).locator('[class*="taskCard"]', { hasText: 'Weekend Jog' })
        ).toBeVisible({ timeout: 10_000 });

        // 2. Now create an every-day habit AFTER the PlannedDays already exist
        await createHabit(page, 'Stretch');

        // 3. Go back to the calendar
        await page.goto('/calendar');
        await page.getByRole('button', { name: 'Week' }).click();
        await expect(page.locator('[class*="content"][class*="loading"]')).toBeHidden({ timeout: 10_000 });

        // Saturday (index 6) should now show BOTH habits
        const satCol = columns.nth(6);
        await expect(
            satCol.locator('[class*="taskCard"]', { hasText: 'Weekend Jog' })
        ).toBeVisible({ timeout: 10_000 });
        await expect(
            satCol.locator('[class*="taskCard"]', { hasText: 'Stretch' })
        ).toBeVisible({ timeout: 10_000 });

        // A weekday column should also show "Stretch" (pick Wednesday, index 3)
        await expect(
            columns.nth(3).locator('[class*="taskCard"]', { hasText: 'Stretch' })
        ).toBeVisible({ timeout: 10_000 });
    });
});
