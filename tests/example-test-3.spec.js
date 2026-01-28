import { expect } from '@playwright/test';
import { test } from '../tests-lib/fixtures.js';
import createDescribe from '../tests-lib/describe.js';
import readSettingsSync from '../helpers/read-settings-sync.js';

const describe = createDescribe("example-test-3.spec.js");
const settings = readSettingsSync();
const { visualRegression } = settings.global;
const TEST_VR = visualRegression != 'skip';

describe('Basic visual regression', () => {
    test('Homepage', async ({ page }) => {
        await page.goto('/');
         if(TEST_VR) await expect(page).toHaveScreenshot('homepage.png');
    });

    test('Contact page', async ({page}) => {
        await page.goto('/contact');
        if(TEST_VR) await expect(page).toHaveScreenshot('contact.png');
    });

});


