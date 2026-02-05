import getSuitesList from "../helpers/get-suites-list.js";
import { appSettings } from "../models/app-settings.js";
import { browsersList } from "../models/browsers-list.js";
import { suitesMedatadata } from "../models/suites-metadata.js";
import { testsData } from "../models/tests-data.js";

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

export function runTests(req, res){
    
}

export function getTestsUpdate(req, res){

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

function getMenuCategories(suitesMetadata, testsData){

}