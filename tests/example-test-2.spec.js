import { expect } from '@playwright/test';
import { test } from '../ui-lib/fixtures.js';
import createDescribe from '../ui-lib/describe.js';
import readSettingsSync from '../helpers/read-settings-sync.js';


const describe = createDescribe("example-test-2.spec.js");
const settings = readSettingsSync();
const { visualRegression } = settings.global;
const TEST_VR = visualRegression != 'skip';

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

    test('Visual regression', async ({page}) => {
        await page.goto('/');
        if(TEST_VR) await expect(page).toHaveScreenshot('homepage.png');
    });
    test('Long test', async ({page}) => {
        await page.waitForTimeout(5000);
    });

});

