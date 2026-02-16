import fs from 'fs';

export async function resetTestSettings(){
    const defaultSettings = await fs.promises.readFile('default-test-settings.json');
    await fs.promises.writeFile('test-settings.json', defaultSettings);
}

export async function writeTestSettings(settings){
    const settingsJson = JSON.stringify(settings, null, 2);
    await fs.promises.writeFile('test-settings.json', settingsJson);
}