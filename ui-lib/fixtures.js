import { test as base } from '@playwright/test';
import { checkIfAllTestsArePending, updateTestStatus } from '../helpers/log-test';
import readSettingsSync from '../helpers/read-settings-sync';
import beforeEach from '../hooks/before-each.js';
import afterEach from '../hooks/after-each.js';


const settings = readSettingsSync();

const { suites, biggestInterval } = settings;

export const test =  base.extend({
    forEachTest: [async ({page}, use, testInfo) => {

        const testFilePathArray = testInfo.file.split('/');
        const fileName = testFilePathArray[testFilePathArray.length -1];

        const suite = suites.find(suite => suite.testFiles.includes(fileName));

        const testCategoryName = testInfo.titlePath[1];

        if(!suite.categories.includes(testCategoryName)){
            testInfo.skip();
            return;
        }

        const testLogsInfo =  {
            suiteName: suite.title, 
            groupName: testCategoryName, 
            title: testInfo.title, 
            browser: testInfo.project.name
        };

        if(suite.sequential){
            const thisTestIsFirst = checkIfAllTestsArePending();
            if(!thisTestIsFirst) await page.waitForTimeout(suite.sequenceInterval);
        }

        

        logTestStart(testLogsInfo);

        await beforeEach({page}, use, testInfo);

        // Run the test
        await use();

        await afterEach({page}, use, testInfo);

        logTestEnd(testLogsInfo, testInfo);

    }, {
        auto: true, 
        timeout: biggestInterval + 3000
    }]
});

function logTestStart(testLogsInfo){

    updateTestStatus(
        {
            ...testLogsInfo, 
            status: 'running'
        }
    );
}

function logTestEnd(testLogsInfo, testInfo){

    let status;

    if(testInfo.status === 'timedOut' || testInfo.status === 'failed'){
            status = testInfo.error.message;
        }else{
            status = testInfo.status;
        }

    updateTestStatus(
        {
            ...testLogsInfo, 
            status
        }
    );
}