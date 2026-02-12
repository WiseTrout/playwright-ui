import fs from 'fs';
export let appSettings = {};

const FILE_PATH = '/app/settings/app-settings.json';

export async function readAppSettings(){
    const json = await fs.promises.readFile(FILE_PATH, 'utf-8');
    appSettings = JSON.parse(json);
}

export async function updateAppSettings(newSettings){
    const json = JSON.stringify(newSettings ,null, 2);
    appSettings = JSON.parse(json);
    await fs.promises.writeFile(FILE_PATH, json);
}