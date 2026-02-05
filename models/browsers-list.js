import fs from 'fs';

export let browsersList = [];

export async function readBrowsersList(){
    const json = await fs.promises.readFile('tests-data/available-projects.json');
    const availableProjects = JSON.parse(json, 'utf-8'); 
    browsersList =  availableProjects.map(pr => pr.name);
}