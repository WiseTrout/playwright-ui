import { logTests } from "./log-test";
import readSettingsSync from "./read-settings-sync";

export function markAsPending(testGroups){

    const __filename = fileURLToPath(import.meta.url);

    const settings = readSettingsSync();
    const { browsers } = settings;
    const suite = settings.suites.find(suite => suite.testFiles.includes(__filename));

    if(!suite) throw new Error('Suite not found for test file ' + __filename);

    const logs = [];

    for(const group of testGroups){
        for(const testTitle of group.tests){
            for(const browser of browsers){
                logs.push({
                    suiteName: suite.title,
                    groupName: group.title,
                    title: testTitle,
                    browser,
                    status: 'pending'
                })
            }
        }
    }
    
    logTests(logs);
}