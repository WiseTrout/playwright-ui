import { expect } from '@playwright/test';
import { test } from '../ui-lib/fixtures.js';
import createDescribe from '../ui-lib/describe.js';

const describe = createDescribe("example-test-1.spec.js");

describe('Basic tests', () => {
        test('Page title', async ({ page, baseURL }) => {
            await page.goto('/');
            await expect(page).toHaveTitle('What is this site? | Wise Trout');
        });

        test('Page header', async ({page}) => {
            await page.goto('/');
            await expect(page.getByText('What is this site?')).toBeVisible();
        });

        test('Contact page', async ({page}) => {
            await page.goto('/contact');
            await expect(page).toHaveTitle('Contact Us | Wise Trout');
        });

        test('failing test', async () => { await expect(0).toEqual(1) })

});



