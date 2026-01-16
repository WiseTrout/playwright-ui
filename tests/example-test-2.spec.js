import { expect } from '@playwright/test';
import { test } from "./fixtures.js";
import createDescribe from './lib/describe.js';


const describe = createDescribe("example-test-2.spec.js");

describe('Advanced tests', () => {
    test('Page title', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle('What is this site? | Wise Trout');
    });

    test('Page header', async ({page}) => {
        await page.goto('/');
        await expect(page.getByText('What is this site?')).toBeVisible();
    });

});

describe('Even more advanced tests', () => {
    test('Page title', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle('What is this site? | Wise Trout');
    });

    test('Page header', async ({page}) => {
        await page.goto('/');
        await expect(page.getByText('What is this site?')).toBeVisible();
    });

});

