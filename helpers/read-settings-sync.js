import fs from 'fs';
import { fileURLToPath } from 'url';


export default function readSettingsSync(){
    const json = fs.readFileSync('test-settings.json', 'utf-8');
    return  JSON.parse(json);
}