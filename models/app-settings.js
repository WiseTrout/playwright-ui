import fs from 'fs';

export let appSettings = {};


export async function readAppSettings(){
    const json = await fs.promises.readFile('app-settings.json', 'utf-8');
    appSettings = JSON.parse(json);
}

export async function updateAppSettings(newSettings){
    const json = JSON.stringify(newSettings ,null, 2);
    appSettings = JSON.parse(json);
    await fs.promises.writeFile('app-settings.json', json);
}