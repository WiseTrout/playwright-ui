import express from 'express';
import { engine } from 'express-handlebars';
import { spawn } from 'child_process';
import fs, { readFileSync, writeFileSync } from 'fs';
import fileUpload from 'express-fileupload';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createFileUploadPromise } from './helpers/file-upload-promise.js';
import { readLogs } from './helpers/log-test.js';

console.log('Launching menu...');


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();

let testsProcess = null;
let playwrightReportProcess = null;
let serverError = null;

let testSuites;
let availableBrowsers;
let appSettings;

app.engine('hbs', engine({extname: '.hbs'}));
app.set('view engine', 'hbs');
app.set('views', './templates');
app.use(express.static('public'));

app.use(express.urlencoded());

app.use(fileUpload())

app.get('/', async (_, res) => {

    const globalSettings = appSettings.globalSettings.map(setting => ({...setting, name: `global--${setting.name}`}));

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
    

    res.render('index', {
        title: appSettings.applicationName, 
        globalSettings,
        testSuites: menuCategories, 
        browsers: menuBrowsers, 
        default_base_url: appSettings.defaultBaseURL
    });
});

app.get('/settings', (_, res) => {

    const browsers = availableBrowsers.map(browser => {
        return {
            name: browser,
            defaultChecked: appSettings.defaultBrowsersToUse.includes(browser)
        }
    })

    res.render('settings', {...appSettings, browsers});

});

app.get('/status', async (_, res) => {
    res.render('tests-running', {
        resultsPort: process.env.TESTS_RESULTS_PORT || 9323,
        menuPort: process.env.TESTS_MENU_PORT || 3000
    });
})

app.post('/run-tests', async (req, res) => {

    if(playwrightReportProcess) stopPlaywrightReport();

    if(testsProcess) stopTests();

    const settingsObject = getTestSettings(req, testSuites);

    try{

        const settingsJson = JSON.stringify(settingsObject, null, 2);
        await  fs.promises.writeFile('test-settings.json', settingsJson);
    }catch(err){
        
        serverError = 'File writing error:' + err;
        return;
        
    }   

    // await spawnPromise('npx', ['playwright', 'test', '--list', '--reporter=json']);

    // initializeTestLogs();

    // res.redirect('/');

    // return;

    const process = spawn('npx', ['playwright', 'test', '--list', '--reporter=json']);

    process.stdout.setEncoding('utf-8');

    process.stdout.on('data', (data) => {
        
        console.log(data);
        fs.writeFileSync('results.json', data);
        
    })

    process.on('exit', () => {
        res.redirect('/status');
    });

    return;

    const testSpawnOptions = ['playwright', 'test'];

    if(settingsObject.visualRegression === 'update') testSpawnOptions.push('--update-snapshots');

    testsProcess = spawn('npx', testSpawnOptions);

    testsProcess.stdout.setEncoding('utf-8');

    testsProcess.stdout.on('data', (data) => {
        
        console.log(data);
        
    })

    testsProcess.on('exit', () => {
        playwrightReportProcess = spawn('npx',  ['playwright', 'show-report', '--host',  '0.0.0.0']);
        playwrightReportProcess.on('spawn', () => {
        })

        playwrightReportProcess.on('error', (err) => {
            console.error(`Failed to start Playwright report subprocess: ${err.message}`);
            serverError = 'Failed to launch PLaywright report';
        });
    })
})

app.post('/update-settings', async (req, res) => {
    
    appSettings = getAppSettings(req);

    const oldSettings = JSON.parse(fs.readFileSync('app-settings.json'));

    const settingsWritePromise = fs.promises.writeFile('app-settings.json', JSON.stringify({...oldSettings, ...appSettings},null, 2));

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
    

    res.json({
        data: [],
        complete: true
    })

    return;

    if(serverError) throw new Error(serverError);

    res.json({
        data: readLogs(),
        complete: checkIfTestsAreDone(data)
    })
})

loadAppInfo().then(({browsers, suites, settings}) => {

    availableBrowsers = browsers;
    testSuites = suites;
    appSettings = settings;

    console.log(suites[0].categories);

    app.listen(3000, () => console.log(`Testing menu is available at http://localhost:${process.env.TESTS_MENU_PORT || 3000}`));
})

function stopTests(){
    testsProcess.kill();
    testsProcess = null;
}

function stopPlaywrightReport(){
    playwrightReportProcess.kill();
    playwrightReportProcess = null;
}

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
                machineName: testsSuiteMachineName,
                title: suiteInfo.title,
                categories: [],
                testFileNames: suiteInfo.testFileNames
            };
            

            if(suiteInfo.sequencial){
                suiteSettings.sequencial = true;
                suiteSettings.sequenceInterval = suiteInfo.sequenceInterval || 0;
            }

            testsSettings.suites.push(suiteSettings);
        }

        if(settingName === 'category' || settingName === 'file'){
            suiteSettings.categories.push({
                title: settingValue,
                type: settingName
            });
        }else{
            suiteSettings[settingName] = settingValue;
        }

    }

    testsSettings.testAllSuites = testsSettings.suites.length === testSuites.length;

    return testsSettings;

}

async function initializeTestLogs(settingsObject){

    const testLogs = [];

    for(const suiteMachineName in settingsObject.suites){

        const suite = settingsObject.suites[suiteMachineName];

        for(const category of suite.categories){

            for(const test of category.tests){
                for(const browser of settingsObject.selectedBrowsers){
                testLogs.push({suiteName: suite.title, groupName: category.title, title: test.title, browser});
            }
            }

        }
    }

    rewriteLogs(testLogs);


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
function getAppSettings(req){

    const newSettings = {};

    newSettings.defaultBaseURL = req.body['base-url'];
    newSettings.addAccessHeaderByDefault = req.body['add-header'] === 'on';

    const checkedBrowsers = [];

    for(const key in req.body){
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

    setDefaultTestSettings();

    const [testFilesInfo, suitesMetadata] = await Promise.all([getTestFilesInfo(), readSuitesMetadata()]);
    

    const suitesInfo = combineTestAndSuiteInfo(testFilesInfo, suitesMetadata);
    

    return suitesInfo;
}

function setDefaultTestSettings(){
    const defaultSettingsJson = readFileSync('all-suites-selected.json');

    writeFileSync('test-settings.json', defaultSettingsJson);
}

async function getTestFilesInfo(){

    return new Promise((res, rej) => {
        const process = spawn('npx', ['playwright', 'test', '--list', '--reporter=json']);

        process.stdout.setEncoding('utf-8');

        process.stdout.on('data', (json) => {
            
            const data = JSON.parse(json);
            res(data.suites)
            
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
            console.log(fileName);
            
            const fileInfo = testFiles.find(test => test.file === fileName);
            if(!fileInfo) throw new Error(`Test file ${fileName} not found`);
            const fileTestCategories = fileInfo.suites.map(testGroup => ({
                title: testGroup.title,
                tests: testGroup.specs.map(test => test.title)
            }))
            console.log(fileTestCategories);
            
            suiteInfo.categories = suiteInfo.categories.concat(fileTestCategories);

            console.log(suiteInfo.categories);
            
        }
         return suiteInfo;
    });

    return suitesInfo;
}

async function readAppSettings(){
    const json = await fs.promises.readFile('app-settings.json', 'utf-8');
    return JSON.parse(json);
}

