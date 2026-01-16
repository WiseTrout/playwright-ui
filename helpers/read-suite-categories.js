import { fileURLToPath } from "url";
import readSettingsSync from "./read-settings-sync";

export default function readSuiteCategories(fileName){

    const settings = readSettingsSync();

    // If !settings.suites, this means that we have not yet launched the test process 
    // and are looking to make a list of all available tests (to show in the menu).
    if(!settings.suites) return null;
    const suite = settings.suites.find(suite => suite.testFiles.includes(fileName));
    return suite.categories;
}