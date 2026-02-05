import fs from 'fs';
import path from 'path';

export let suitesMedatadata = [];

export async function readSuitesMetadata(){
    const testSuitesDir = path.join('tests-data', 'suites');
    
        const suiteNames = await fs.promises.readdir(testSuitesDir);
    
        const metadataPromises = suiteNames.map(suiteName => {
            const filePath = path.join(testSuitesDir, suiteName, 'suite-metadata.json');
            return fs.promises.readFile(filePath, 'utf-8')
        })
    
        const suitesJson = await Promise.all(metadataPromises);
    
        const metadata = suitesJson.map(json => JSON.parse(json));
    
        for(let i=0; i<suiteNames.length; i++){
            metadata[i].machineName = suiteNames[i];
        }
    
        suitesMedatadata = metadata;
}