import { spawn } from "child_process";

export let testsData;
export async function readTestsData(){
    testsData = await new Promise((res, rej) => {
            let json = '';
            const process = spawn('npx', ['playwright', 'test', '--list', '--reporter=json']);
    
            process.stdout.setEncoding('utf-8');
    
            process.stdout.on('data', (data) => {
                json += data;
            })
    
            process.on('error', (err) => {
                rej(err);
            })
    
            process.on('close', () => {
                const data = JSON.parse(json);
                if(data.errors.length){
                    console.log(data.errors);
                    rej('Error reading tests data');
                }else{
                    res(data.suites);
                }
                
            });
        }
        )
}