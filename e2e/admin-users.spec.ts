import { test, expect } from './fixtures';
import { execSync } from 'child_process';

const SCHEMA = 'prisma/schema.prisma';

function runSQL(sql: string) {
    execSync(`npx prisma db execute --schema ${SCHEMA} --stdin`, {
        input: sql,
        cwd: process.cwd(),
    });
}

function promoteE2EUsersToAdmin() {
    runSQL(`UPDATE "users" SET "role" = 'admin' WHERE "username" LIKE 'e2e_user_%';`);
}

function demoteE2EUsers() {
    runSQL(`UPDATE "users" SET "role" = 'user' WHERE "username" LIKE 'e2e_user_%';`);
}

test.describe.serial('Admin section & users page', () => {
    test.afterAll(() => {
        demoteE2EUsers();
    });

    // --- Non-admin tests (default state) ---

    test('sidebar does not show Admin section for regular users', async ({ page }) => {
        await page.goto('/today');
        await expect(page.locator('[class*="sectionTitle"]', { hasText: 'Admin' })).not.toBeVisible();
    });

    test('sidebar shows Main section for regular users', async ({ page }) => {
        await page.goto('/today');
        await expect(page.locator('[class*="sectionTitle"]', { hasText: 'Main' })).toBeVisible();
    });

    test('non-admin is redirected away from /users', async ({ page }) => {
        await page.goto('/users');
        await page.waitForURL('**/today', { timeout: 10_000 });
        await expect(page).toHaveURL(/\/today/);
    });

    // --- Promote to admin, then test admin features ---

    test('sidebar shows Admin section after promotion to admin', async ({ page }) => {
        promoteE2EUsersToAdmin();

        await page.goto('/today');
        await expect(page.locator('[class*="sectionTitle"]', { hasText: 'Admin' })).toBeVisible();
        await expect(page.locator('[class*="sectionTitle"]', { hasText: 'Main' })).toBeVisible();
    });

    test('Admin section contains Users link', async ({ page }) => {
        await page.goto('/today');

        const adminSection = page.locator('[class*="section"]', {
            has: page.locator('[class*="sectionTitle"]', { hasText: 'Admin' }),
        });
        const usersLink = adminSection.locator('a', { hasText: 'Users' });
        await expect(usersLink).toBeVisible();
        await expect(usersLink).toHaveAttribute('href', '/users');
    });

    test('clicking Users link navigates to users page', async ({ page }) => {
        await page.goto('/today');

        const adminSection = page.locator('[class*="section"]', {
            has: page.locator('[class*="sectionTitle"]', { hasText: 'Admin' }),
        });
        await adminSection.locator('a', { hasText: 'Users' }).click();

        await page.waitForURL('**/users', { timeout: 10_000 });
        await expect(page).toHaveURL(/\/users/);
    });

    test('users page shows page header', async ({ page }) => {
        await page.goto('/users');
        await expect(page.locator('h1', { hasText: 'Users' })).toBeVisible();
    });

    test('users page shows current user highlighted', async ({ page }) => {
        await page.goto('/users');
        const currentRow = page.locator('[class*="currentUser"]');
        await expect(currentRow).toBeVisible();
    });

    test('current user shows Admin badge', async ({ page }) => {
        await page.goto('/users');
        const currentRow = page.locator('[class*="currentUser"]');
        await expect(currentRow.locator('[class*="badge"]', { hasText: 'Admin' })).toBeVisible();
    });

    test('current user row does not have role toggle button', async ({ page }) => {
        await page.goto('/users');
        const currentRow = page.locator('[class*="currentUser"]');
        await expect(currentRow.locator('button[class*="roleBtn"]')).not.toBeVisible();
    });

    test('other users have role toggle buttons', async ({ page }) => {
        await page.goto('/users');
        const otherRows = page.locator('[class*="row"]').filter({
            hasNot: page.locator('[class*="currentUser"]'),
        });
        const count = await otherRows.count();
        if (count > 0) {
            await expect(otherRows.first().locator('button[class*="roleBtn"]')).toBeVisible();
        }
    });

    test('admin can grant and revoke admin on another user', async ({ page }) => {
        await page.goto('/users');

        // Find a non-current-user row that has a "Make Admin" button
        const makeAdminBtn = page.locator('button[class*="roleBtn"]', { hasText: 'Make Admin' }).first();
        const count = await makeAdminBtn.count();
        if (count === 0) {
            test.skip();
            return;
        }

        // Get the username from that row to anchor subsequent lookups
        const targetRow = page.locator('[class*="row"]', { has: makeAdminBtn });
        const username = await targetRow.locator('[class*="handle"]').first().textContent();

        // Stable row locator anchored on username text
        const row = page.locator('[class*="row"]', {
            has: page.locator('[class*="handle"]', { hasText: username! }),
        });

        // Grant admin
        await row.locator('button[class*="roleBtn"]', { hasText: 'Make Admin' }).click();
        await expect(row.locator('[class*="badge"]', { hasText: 'Admin' })).toBeVisible({ timeout: 5_000 });
        await expect(row.locator('button[class*="roleBtn"]', { hasText: 'Remove Admin' })).toBeVisible();

        // Revoke admin
        await row.locator('button[class*="roleBtn"]', { hasText: 'Remove Admin' }).click();
        await expect(row.locator('[class*="badge"]', { hasText: 'Admin' })).not.toBeVisible({ timeout: 5_000 });
        await expect(row.locator('button[class*="roleBtn"]', { hasText: 'Make Admin' })).toBeVisible();
    });
});
