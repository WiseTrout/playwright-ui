import { fileURLToPath } from "url";
import getGlobalSettingsToDisplay from "../helpers/get-global-settings-to-display.js";
import { appSettings, updateAppSettings } from "../models/app-settings.js";
import { browsersList } from "../models/browsers-list.js";
import saveFile from "../models/files.js";
import { storeTestsInAllTestsArray } from "../models/tests-data.js";
import path, { dirname } from "path";
import { resetTestSettings } from "../models/test-settings.js";

export function getSettingsPage(_, res){
    const browsers = browsersList.map(browser => {
            return {
                name: browser,
                defaultChecked: appSettings.defaultBrowsersToUse.includes(browser)
            }
        })
    
        const globalSettings = getGlobalSettingsToDisplay(appSettings.globalSettings);
        const fileUploads = appSettings.fileUploads;
    
        res.render('settings', {
            globalSettings, 
            browsers, 
            fileUploads, 
            showLogoutButton: !!process.env.USERNAME});
    
}

export async function updateSettings(req, res){
    
        const newAppSettings = createNewAppSettings(appSettings, req);

        const promises = [updateAppSettings(newAppSettings)];
    
        if(req.files){

            const __filename = fileURLToPath(import.meta.url);
            const __dirname = dirname(__filename);
    
            for(const fileName in req.files){
    
                const fileUploadName = fileName.split('--')[1];
                const fileUploadSettings = appSettings.fileUploads.find(fileUpload => fileUpload.name === fileUploadName);
                const uploadPath = path.join(__dirname, '..',  fileUploadSettings.savePath);
                const fileUploadPromise = saveFile(req.files[fileName], uploadPath);
    
                promises.push(fileUploadPromise);
            }
    
        }
            
        await Promise.all(promises);
    
        // Rereading tests data in case the uploaded files changed something in them
        await resetTestSettings();
        await storeTestsInAllTestsArray();
    
        res.redirect('/tests');
}

function createNewAppSettings(oldSettings, req){
    const newSettings = JSON.parse(JSON.stringify(oldSettings));

    const checkedBrowsers = [];

    for(const key in req.body){
        if(key.includes('global--')){
            const settingName = key.split('--')[1];
            const setting = newSettings.globalSettings.find(setting => setting.name === settingName);

            if(setting.options){
                setting.options.forEach(option => {
                    option.defaultSelected = option.value === req.body[key] ? true : undefined;
                });

                continue;
            }
            
            if(setting.type === "checkbox") continue;

            if(setting.type === "number"){
                setting.defaultValue = +req.body[key];
                continue;
            }

            setting.defaultValue = req.body[key];
            continue;
        }
        if(key.includes('browser--')){
            checkedBrowsers.push(key.split('--')[1]);
        }
    }

    newSettings.globalSettings
    .filter(setting => setting.type === "checkbox")
    .forEach(setting => {
        setting.defaultSelected = req.body['global--' + setting.name] === 'on';
    });

    newSettings.defaultBrowsersToUse = checkedBrowsers;
    
    return newSettings;
}
