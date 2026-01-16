// @ts-check
import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';

const settingsJson = fs.readFileSync('test-settings.json', 'utf-8');
const settingsObj = JSON.parse(settingsJson);

const { selectedBrowsers, testAllSuites, suites, sequential } = settingsObj;

const workers = sequential ? 1 : undefined;

const availableProjects = JSON.parse(fs.readFileSync('tests-data/available-projects.json', 'utf-8'));

const projects = availableProjects
.filter(project => selectedBrowsers.includes(project.name))
.map(browser => {
  const use = {...devices[browser.device]};
  if(browser.channel) use.channel = browser.channel;
  return {
    name: browser.name,
    use
  };
})

let testMatch;

if(testAllSuites){
  // Default
    testMatch = '**/*.@(spec|test).?(c|m)[jt]s?(x)';
}else{
  testMatch = [];
  for(const suite of suites){
    testMatch = [...testMatch, ...suite.testFileNames];
  }
}


/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  testMatch,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', {open: 'never', host: '0.0.0.0'}]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: settingsObj.global.baseUrl,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    video: {
      size: {width: 1920, height: 1080},
      mode: 'on'
    }
  },

  /* Configure projects for major browsers */
  projects,
  workers

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});

