import { spawn } from 'child_process';
import process from 'process';

let testsProcess;
let playwrightReportProcess;

export async function launchTests(settingsObj, loggingFn){
    return await new Promise((res, rej) => {
            const testSpawnOptions = ['playwright', 'test'];
    
            if(settingsObj.global.visualRegression === 'update') testSpawnOptions.push('--update-snapshots');
    
            testsProcess = spawn('npx', testSpawnOptions, {detached: true});
    
            testsProcess.stdout.setEncoding('utf-8');
    
            testsProcess.stdout.on('data', (data) => {
                
                console.log(data);
    
                loggingFn(data);
                
            });
    
            testsProcess.on('exit', () => {
                res();
            });
    
            testsProcess.on('error', (err) => rej(err));
    
            testsProcess.on('close', (_, signal) => {
                if(signal === 'SIGTERM') console.log('Tests stopped');
                
            });
    
        });
}

export async function launchPlaywrightReport(){
    return await new Promise((res, rej) => {
            playwrightReportProcess = spawn('npx',  ['playwright', 'show-report', '--host',  '0.0.0.0'], {detached: true});
            playwrightReportProcess.on('spawn', () => {
                res();
            })
    
            playwrightReportProcess.on('error', (err) => {
                rej(err)
            });
    
        });
}

export function killProcesses(){
     if(playwrightReportProcess 
        && !playwrightReportProcess.signalCode 
        && playwrightReportProcess.exitCode === null) {
            process.kill(-playwrightReportProcess.pid);
        }
    if(testsProcess 
        && !testsProcess.signalCode 
        && testsProcess.exitCode === null) {
            process.kill(-testsProcess.pid);
        }
}