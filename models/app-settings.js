export let appSettings = {};


export async function readAppSettings(){
    const json = await fs.promises.readFile('app-settings.json', 'utf-8');
    appSettings = JSON.parse(json);
}