export let consoleLogs = '';

export function clearConsoleLogs(){
    consoleLogs = '';
}

export function writeConsoleLogs(string){
    consoleLogs += string;
}