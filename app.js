import express from 'express';
import { engine } from 'express-handlebars';
import { spawn } from 'child_process';
import fs from 'fs';
import fileUpload from 'express-fileupload';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createFileUploadPromise } from './helpers/file-upload-promise.js';
import { clearLogs, logTests, readLogs } from './helpers/log-test.js';
import process from 'process';

console.log('Launching menu...');


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();

let testsProcess = null;
let playwrightReportProcess = null;

let testSuites;
let availableBrowsers;
let appSettings;
let testConsoleLogs = '';

app.engine('hbs', engine({extname: '.hbs', partialsDir: __dirname + '/templates/partials'}));
app.set('view engine', 'hbs');
app.set('views', './templates');
app.use(express.static('public'));

app.use(express.urlencoded());

app.use(fileUpload())

app.get('/', async (_, res) => {

    
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

    const menuBrowsers = availableBrowsers.map(browser => ({
        name: browser,
        defaultChecked: appSettings.defaultBrowsersToUse.includes(browser)
    }))

    const globalSettings = appSettings.globalSettings.map(setting => {
        if(!setting.options) return setting;
        const newOptions = setting.options.map(option => ({...option, type: setting.type, name: setting.name}));
        return {...setting, options: newOptions, isSelect: setting.type === "select"};
    }
    )

    res.render('index', {
        title: appSettings.applicationName, 
        globalSettings,
        testSuites: menuCategories, 
        browsers: menuBrowsers
    });
});

app.get('/settings', (_, res) => {

    const browsers = availableBrowsers.map(browser => {
        return {
            name: browser,
            defaultChecked: appSettings.defaultBrowsersToUse.includes(browser)
        }
    })

    const globalSettings = appSettings.globalSettings.map(setting => {
        if(!setting.options) return setting;
        const newOptions = setting.options.map(option => ({...option, type: setting.type, name: setting.name}));
        return {...setting, options: newOptions, isSelect: setting.type === "select"};
    }
    )

    res.render('settings', {globalSettings, browsers});

});

app.get('/status', async (_, res) => {
    res.render('tests-running', {
        resultsPort: process.env.TESTS_RESULTS_PORT || 9323,
        menuPort: process.env.TESTS_MENU_PORT || 3000
    });
})

app.post('/run-tests', async (req, res) => {

    killProcesses();

    testConsoleLogs = '';

    const settingsObject = getTestSettings(req, testSuites);

    const settingsJson = JSON.stringify(settingsObject, null, 2);
    fs.writeFileSync('test-settings.json', settingsJson);

    const testFilesToRun = await getTestFilesInfo(); 
    
    initializeTestLogs(testFilesToRun, settingsObject);

    res.redirect('/status');

    await launchTests(settingsObject);

    await launchPlaywrightReport();

})

app.post('/update-settings', async (req, res) => {

    const oldSettings = JSON.parse(fs.readFileSync('app-settings.json'));

    appSettings = updateAppSettings(oldSettings, req);

    const settingsWritePromise = fs.promises.writeFile('app-settings.json', JSON.stringify(appSettings ,null, 2));

    const promises = [settingsWritePromise];

    if(req.files){

        for(const fileName in req.files){

            const fileMachineName = fileName.split('--')[1];
            const extension = '.' + req.files[fileName].name.split('.')[1];

            const uploadPath = path.join(__dirname, 'tests-data', fileMachineName + extension);
            const fileUploadPromise = createFileUploadPromise(req.files[fileName], uploadPath);

            promises.push(fileUploadPromise);
        }

    }
        
    await Promise.all(promises);

    testSuites = await readSuitesInfo();

    res.redirect('/');

});

app.get('/get-tests-update', async (_, res) => {

    const data = readLogs();

    res.json({
        data,
        complete: checkIfTestsAreDone(data),
        logs: testConsoleLogs
    });

    testConsoleLogs = '';
})

app.get('/stop-tests', async (_, res) => {
    killProcesses();
    res.sendStatus(200);
});

loadAppInfo().then(({browsers, suites, settings}) => {

    availableBrowsers = browsers;
    testSuites = suites;
    appSettings = settings;

    app.listen(3000, () => console.log(`Testing menu is available at http://localhost:${process.env.TESTS_MENU_PORT || 3000}`));
})


function getTestSettings(req, suitesList){


    const testsSettings = {
        global: {},
        selectedBrowsers: [],
        suites: []
    };

    for(let key in req.body){

        if(key.split('--')[0] === 'global'){
            testsSettings.global[key.split('--')[1]] = req.body[key];
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

    testsSettings.testAllSuites = testsSettings.suites.length === testSuites.length;

    return testsSettings;

}

async function initializeTestLogs(testFiles, settingsObject){

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

    clearLogs();
    logTests(testLogs);


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
function updateAppSettings(oldSettings, req){

    const newSettings = JSON.parse(JSON.stringify(oldSettings));

    const checkedBrowsers = [];

    for(const key in req.body){
        if(key.includes('global--')){
            const settingName = key.split('--')[1];
            const setting = newSettings.globalSettings.find(setting => setting.name === settingName);
            
            if(setting.options){
                setting.options.forEach(option => {
                    option.defaultSelected = option.value === req.body[key] ? true : undefined;
                })
            }else{
                setting.defaultValue = req.body[key];
            }
            continue;
        }
        if(key.includes('browser--')){
            checkedBrowsers.push(key.split('--')[1]);
        }
    }

    newSettings.defaultBrowsersToUse = checkedBrowsers;
    
    return newSettings;
}

async function loadAppInfo(){

    const [browsers, suites, settings]  = await Promise.all([readAvailableBrowsers(), readSuitesInfo(), readAppSettings()]);


    return{
        browsers,
        suites, 
        settings
    }
}

async function readAvailableBrowsers(){
    const json = await fs.promises.readFile('tests-data/available-projects.json');
    const availableProjects = JSON.parse(json, 'utf-8'); 
    return availableProjects.map(pr => pr.name);
}

async function readSuitesInfo(){

    enableAllTests();

    const [testFilesInfo, suitesMetadata] = await Promise.all([getTestFilesInfo(), readSuitesMetadata()]);
    

    const suitesInfo = combineTestAndSuiteInfo(testFilesInfo, suitesMetadata);
    

    return suitesInfo;
}

function enableAllTests(){
    const defaultSettings = fs.readFileSync('default-test-settings.json');
    fs.writeFileSync('test-settings.json', defaultSettings);
}

async function getTestFilesInfo(){

    return new Promise((res, rej) => {
        const process = spawn('npx', ['playwright', 'test', '--list', '--reporter=json']);

        process.stdout.setEncoding('utf-8');

        process.stdout.on('data', (json) => {
            
            const data = JSON.parse(json);
            res(data.suites);
            
        })

        process.on('error', (err) => {
            rej(err);
        })

    });
}

async function readSuitesMetadata(){

    const testSuitesDir = path.join(__dirname, 'tests-data', 'suites');

    const suiteNames = await fs.promises.readdir(testSuitesDir);

    const metadataPromises = suiteNames.map(suiteName => {
        const filePath = path.join(testSuitesDir, suiteName, 'suite-metadata.json');
        return fs.promises.readFile(filePath, 'utf-8')
    })

    const suitesJson = await Promise.all(metadataPromises);

    const suitesMetadata = suitesJson.map(json => JSON.parse(json));

    for(let i=0; i<suiteNames.length; i++){
        suitesMetadata[i].machineName = suiteNames[i];
    }

    return suitesMetadata;
}

function combineTestAndSuiteInfo(testFiles, suitesMetadata){
    const suitesInfo = suitesMetadata.map(metadata => {
        const suiteInfo = {...metadata, categories: []};

        for(const fileName of metadata.testFiles){
            
            const fileInfo = testFiles.find(test => test.file === fileName);
            if(!fileInfo) throw new Error(`Test file ${fileName} not found`);

            const fileTestCategories = fileInfo.suites.map(testGroup => ({
                title: testGroup.title,
                tests: testGroup.specs.map(test => test.title)
            }))
            
            suiteInfo.categories = suiteInfo.categories.concat(fileTestCategories);


        }
         return suiteInfo;
    });

    return suitesInfo;
}

async function readAppSettings(){
    const json = await fs.promises.readFile('app-settings.json', 'utf-8');
    return JSON.parse(json);
}

function launchTests(settingsObj){
    return new Promise((res, rej) => {
        const testSpawnOptions = ['playwright', 'test'];

        if(settingsObj.global.visualRegression === 'update') testSpawnOptions.push('--update-snapshots');

        testsProcess = spawn('npx', testSpawnOptions, {detached: true});

        testsProcess.stdout.setEncoding('utf-8');

        testsProcess.stdout.on('data', (data) => {
            
            console.log(data);

            testConsoleLogs += data;
            
        });

        testsProcess.on('exit', () => {
            res();
        });

        testsProcess.on('error', (err) => rej(err));

        testsProcess.on('close', (_, signal) => {
            if(signal === 'SIGTERM') console.log('Tests stopped');
            
        });

    });
}

function launchPlaywrightReport(){
    return new Promise((res, rej) => {
        playwrightReportProcess = spawn('npx',  ['playwright', 'show-report', '--host',  '0.0.0.0'], {detached: true});
        playwrightReportProcess.on('spawn', () => {
            res();
        })

        playwrightReportProcess.on('error', (err) => {
            rej(err)
        });

    });
}

function killProcesses(){
    if(playwrightReportProcess && !playwrightReportProcess.signalCode) process.kill(-playwrightReportProcess.pid);
    if(testsProcess && !testsProcess.signalCode) process.kill(-testsProcess.pid);
}

