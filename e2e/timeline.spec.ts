import { test, expect } from './fixtures';

test.describe.serial('Timeline & Share Day', () => {
    test('timeline page loads and shows empty state', async ({ page }) => {
        await page.goto('/timeline');
        await expect(
            page.getByText('No posts yet. Be the first to share something!')
        ).toBeVisible();
    });

    test('create a user post', async ({ page }) => {
        await page.goto('/timeline');

        // Type in the post form
        await page.locator('textarea[placeholder="What\'s on your mind?"]').fill(
            'Hello from e2e test!'
        );

        // Submit
        await page.getByRole('button', { name: 'Post' }).click();

        // Verify post appears in the feed
        await expect(page.getByText('Hello from e2e test!')).toBeVisible({ timeout: 10_000 });
    });

    test('like a post then unlike', async ({ page }) => {
        await page.goto('/timeline');

        // Wait for a post to appear
        await expect(page.getByText('Hello from e2e test!')).toBeVisible({ timeout: 10_000 });

        // Find the like button (Heart icon)
        const likeButton = page.locator('[class*="action"]').first();
        await likeButton.click();

        // Count should show 1
        await expect(likeButton.locator('span')).toHaveText('1', { timeout: 5_000 });

        // Unlike
        await likeButton.click();

        // Count should disappear (0 likes = hidden)
        await expect(likeButton.locator('span')).toBeHidden({ timeout: 5_000 });
    });

    test('add a comment', async ({ page }) => {
        await page.goto('/timeline');

        // Wait for post
        await expect(page.getByText('Hello from e2e test!')).toBeVisible({ timeout: 10_000 });

        // Click the comment button (second action button)
        const commentButton = page.locator('[class*="action"]').nth(1);
        await commentButton.click();

        // Type and submit a comment
        await page.locator('input[placeholder="Write a comment..."]').fill('Nice post!');
        await page.locator('[class*="submitBtn"]').last().click();

        // Verify comment appears
        await expect(page.getByText('Nice post!')).toBeVisible({ timeout: 10_000 });
    });

    test('edit a post', async ({ page }) => {
        await page.goto('/timeline');

        // Wait for the post we created earlier
        await expect(page.getByText('Hello from e2e test!')).toBeVisible({ timeout: 10_000 });

        // Open the post menu (three-dot icon)
        const menuBtn = page.locator('[aria-label="Post options"]').first();
        await menuBtn.click();

        // Click Edit
        await page.getByRole('button', { name: 'Edit' }).click();

        // The textarea should appear with the current body
        const editTextarea = page.locator('[class*="editTextarea"]');
        await expect(editTextarea).toBeVisible({ timeout: 5_000 });
        await expect(editTextarea).toHaveValue('Hello from e2e test!');

        // Clear and type new text
        await editTextarea.clear();
        await editTextarea.fill('Edited post content');

        // Save
        await page.getByRole('button', { name: 'Save' }).click();

        // Verify the updated text appears
        await expect(page.getByText('Edited post content')).toBeVisible({ timeout: 10_000 });
        // Old text should be gone
        await expect(page.getByText('Hello from e2e test!')).toBeHidden({ timeout: 5_000 });
    });

    test('delete a post', async ({ page }) => {
        await page.goto('/timeline');

        // First create a post to delete
        await page.locator('textarea[placeholder="What\'s on your mind?"]').fill(
            'Post to be deleted'
        );
        await page.getByRole('button', { name: 'Post' }).click();
        await expect(page.getByText('Post to be deleted')).toBeVisible({ timeout: 10_000 });

        // Open the menu on that post
        const card = page.locator('[class*="card"]', { hasText: 'Post to be deleted' });
        await card.locator('[aria-label="Post options"]').click();

        // Click Delete
        await page.getByRole('button', { name: 'Delete' }).click();

        // Post should disappear
        await expect(page.getByText('Post to be deleted')).toBeHidden({ timeout: 10_000 });
    });

    test('share day from today page', async ({ page }) => {
        // First, make sure there are habits and complete at least one task
        await page.goto('/today');

        // Check if there are tasks to complete
        const taskRows = page.locator('[class*="taskRow"]');
        const taskCount = await taskRows.count();

        if (taskCount > 0) {
            // Complete the first task
            await taskRows.first().click();
            await page.waitForTimeout(500);

            // Look for the Share Day button
            const shareButton = page.getByRole('button', { name: 'Share Day' });

            if (await shareButton.isVisible({ timeout: 5_000 })) {
                await shareButton.click();

                // Modal should appear
                await expect(page.getByText('Share Your Day')).toBeVisible({ timeout: 5_000 });

                // Add optional description
                await page.locator('textarea[placeholder="Add a description (optional)"]').fill(
                    'Productive day!'
                );

                // Click Share
                await page.locator('[class*="shareBtn"]').click();

                // Modal should close
                await expect(page.getByText('Share Your Day')).toBeHidden({ timeout: 10_000 });

                // Verify the post on the timeline
                await page.goto('/timeline');
                await expect(page.getByText('Productive day!')).toBeVisible({ timeout: 10_000 });
                await expect(page.getByText('Day Result')).toBeVisible();
            }
        }
    });

    test('share day dedup prevents double share', async ({ page }) => {
        await page.goto('/today');

        const shareButton = page.getByRole('button', { name: 'Share Day' });

        if (await shareButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
            await shareButton.click();
            await expect(page.getByText('Share Your Day')).toBeVisible({ timeout: 5_000 });

            // Try to share again
            await page.locator('[class*="shareBtn"]').click();

            // Should show error about already shared
            await expect(page.getByText('You have already shared this day.')).toBeVisible({ timeout: 5_000 });
        }
    });
});
