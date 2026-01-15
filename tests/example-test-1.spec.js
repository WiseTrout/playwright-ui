import { expect } from '@playwright/test';
import { test } from "./fixtures.js";

test.describe('Basic tests', () => {
    test('Page title', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle('What is this site? | Wise Trout');
    });

    test('Page header', async ({page}) => {
        await page.goto('/');
        await expect(page.getByText('What is this site?')).toBeVisible();
    });

});


