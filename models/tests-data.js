import { spawn } from "child_process";

export let testsData;
export function readTestsData(){
            let json = '';
            const process = spawn('npx', ['playwright', 'test', '--list', '--reporter=json']);
    
            process.stdout.setEncoding('utf-8');
    
            process.stdout.on('data', (data) => {
                json += data;
            })
    
            process.on('error', (err) => {
                throw new Error(err);
            })
    
            process.on('close', () => {
                const data = JSON.parse(json);
                if(data.errors.length){
                    console.log(data.errors);
                    throw new Error('Error reading tests data');
                }else{
                    testsData = data.suites;
                }
                
            });
    
}