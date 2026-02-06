import getSuitesList from "../helpers/get-suites-list.js";
import { appSettings } from "../models/app-settings.js";
import { browsersList } from "../models/browsers-list.js";
import { clearConsoleLogs, consoleLogs } from "../models/console-logs.js";
import { killProcesses } from "../models/processes.js";
import { suitesMedatadata } from "../models/suites-metadata.js";
import { clearLogs, logTests, readLogs } from "../models/test-logs.js";
import { writeTestSettings } from "../models/test-settings.js";
import { readTestsData, testsData } from "../models/tests-data.js";

export function getMenu(_, res){

    const testSuites = getSuitesList(suitesMedatadata, testsData);

     const menuCategories = testSuites.map(suite => {
        const {title, categories, machineName} = suite;
        return {
            title,
            categories: categories.map(cat => ({
                title: cat.title,
                inputName: machineName + `--category--` + cat.title
            }))
        }
    })

    const menuBrowsers = browsersList.map(browser => ({
        name: browser,
        defaultChecked: appSettings.defaultBrowsersToUse.includes(browser)
    }));

    const globalSettings = getGlobalSettingsToDisplay(appSettings.globalSettings);

    res.render('index', {
        globalSettings,
        testSuites: menuCategories, 
        browsers: menuBrowsers
    });
}

export async function runTests(req, res){
    
    const testSuites = getSuitesList(suitesMedatadata, testsData);

    
    killProcesses();
    clearConsoleLogs();

    const settingsObject = getTestSettings(req, testSuites);

    await writeTestSettings(settingsObject);
    
    await readTestsData();

    const initialLogs = createInitialTestLogs(testsData, settingsObject);

    console.log('Initial logs:');
    console.log(initialLogs);
    

    clearLogs();
    logTests(initialLogs);
    
    res.redirect('/tests/status');
    
        // await launchTests(settingsObject);
    
        // await launchPlaywrightReport();
}

export function getStatusPage(_, res){
    res.render('tests-running', {
        resultsPort: process.env.TESTS_RESULTS_PORT || 9323,
        menuPort: process.env.TESTS_MENU_PORT || 3000
    });
}

export function getTestsUpdate(_, res){
    const data = readLogs();
    
        res.json({
            data,
            complete: checkIfTestsAreDone(data),
            logs: consoleLogs
        });
    
        clearConsoleLogs();
}

export function stopTests(req, res){}


function getGlobalSettingsToDisplay(globalSettings){

    const COMPLEX_INPUT_TYPES = ['select', 'checkbox', 'radio'];

    return globalSettings.map(setting => {
        const newSetting = {... setting};
        if(setting.options) newSetting.options = setting.options.map(option => ({...option, type: setting.type, name: 'global--' + setting.name}));
        for(const type of COMPLEX_INPUT_TYPES){
            if(setting.type === type) newSetting['is' + type[0].toUpperCase() + type.slice(1)] = true;
        }
        newSetting.isSimple = !COMPLEX_INPUT_TYPES.includes(setting.type);
        newSetting.name = 'global--' + setting.name;
        return newSetting;
    });
}

function getTestSettings(req, suitesList){


    const testsSettings = {
        global: {},
        selectedBrowsers: [],
        suites: []
    };

    for(let key in req.body){

        if(key === 'csrfToken') continue;
        

        if(key.split('--')[0] === 'global'){
            const settingName = key.split('--')[1];
            const inputType = appSettings.globalSettings.find(setting => setting.name === settingName).type;
            switch(inputType){
                case "checkbox":
                    testsSettings.global[settingName] = true;
                    break;
                case "number":
                    testsSettings.global[settingName] = +req.body[key];
                    break;
                default: 
                    testsSettings.global[settingName] = req.body[key];
            }
            continue;
        }

        if(key.split('--')[0] === 'browser'){
            testsSettings.selectedBrowsers.push(key.split('--')[1]);
            continue;
        }

        const [testsSuiteMachineName, settingName, settingValue] = key.split('--');

        const suiteInfo = suitesList.find(suite => suite.machineName === testsSuiteMachineName);
        

        let suiteSettings = testsSettings.suites.find(suite => suite.machineName === testsSuiteMachineName);

        if(!suiteSettings){
            suiteSettings = {
                ...suiteInfo,
                categories: []
            };

            testsSettings.suites.push(suiteSettings);
        }

        if(settingName === 'category'){
            suiteSettings.categories.push(settingValue);
        }else{
            suiteSettings[settingName] = settingValue;
        }

    }

    testsSettings.testAllSuites = testsSettings.suites.length === suitesList.length;

    return testsSettings;

}

function createInitialTestLogs(testFiles, settingsObject){

    const testLogs = [];
    

    for(const testFile of testFiles){
        const suiteInfo = settingsObject.suites.find(suite => suite.testFiles.includes(testFile.file));
        
        for(const category of testFile.suites){
            

            for(const test of category.specs){

                for(const browser of settingsObject.selectedBrowsers){
                    testLogs.push({
                        suiteName: suiteInfo.title, 
                        groupName: category.title, 
                        title: test.title, 
                        browser
                    });
                }

            }

        }

    }

    return testLogs;

}

function checkIfTestsAreDone(logsObj){
    for(const suite in logsObj){
        const suiteData = logsObj[suite];
        for(const group in suiteData){
            const groupData = suiteData[group];
            for(const testName in groupData){
                const testData = groupData[testName];
                for(const browser in testData){
                    if(testData[browser] === 'pending' || testData[browser] === 'running') return false;
                }
            }
        }
    }
    return true;
}