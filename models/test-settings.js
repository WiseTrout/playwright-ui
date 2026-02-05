import fs from 'fs';

export async function resetTestSettings(){
    const defaultSettings = await fs.promises.readFile('default-test-settings.json');
    await fs.promises.writeFile('test-settings.json', defaultSettings);
}