import { test as base } from '@playwright/test';
import { checkIfAllTestsArePending, updateTestStatus } from '../helpers/log-test';
import readSettingsSync from '../helpers/read-settings-sync';


const settings = readSettingsSync();

const { addAccessHeader, suites, biggestInterval } = settings;

export const test =  base.extend({
    forEachTest: [async ({page}, use, testInfo) => {

        const suite = findSuite(suites, testInfo);

        const testLogsInfo = findTestLogsInfo(suites, testInfo);

        if(suite.sequential){

            const thisTestIsFirst = checkIfAllTestsArePending();

            if(!thisTestIsFirst) await page.waitForTimeout(suite.sequenceInterval);
        }

        

        logTestStart(testLogsInfo);
        
        if(addAccessHeader)  {
            await page.setExtraHTTPHeaders({ "X-Salesforce": process.env.ACCESS_HEADER});
        }

        // Run the test
        await use();

        logTestEnd(testLogsInfo, testInfo);

    }, {
        auto: true, 
        timeout: biggestInterval + 3000
    }]
});


function findTestLogsInfo(suites, testInfo){
    const suiteInfo = findSuite(suites, testInfo);
    const testCategoryName = testInfo.titlePath[1];

    return {
        suiteName: suiteInfo.title, 
        groupName: testCategoryName, 
        title: testInfo.title, 
        browser: testInfo.project.name
    };

}

function findSuite(suites, testInfo){

    const testFilePathArray = testInfo.file.split('/');
    const fileName = testFilePathArray[testFilePathArray.length -1];

     for(const suiteName in suites){
            if(suites[suiteName].testFileNames.includes(fileName)){
                return suites[suiteName];
            }
    }

    throw new Error('Could not find test suite');
}

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