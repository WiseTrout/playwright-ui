import process from 'process';


let testsProcess;
let playwrightReportProcess;

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