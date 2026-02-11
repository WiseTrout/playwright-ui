import readSettingsSync from "../ui-lib/read-settings-sync";
import { test } from "./fixtures";


export default function createDescribe(filename){
    return (name, cb) => {
        const settings = readSettingsSync();
    // If !settings.suites, this means that we have not yet launched the test process 
    // and are looking to make a list of all available tests (to show in the menu).
    if(!settings.suites){
        test.describe(name, cb);
        return;
    }
    const { categories } = settings.suites.find(suite => suite.testFiles.includes(filename));

    if(categories.includes(name)) test.describe(name, cb);

    }
}