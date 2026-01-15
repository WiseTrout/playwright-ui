import { spawn } from "child_process";

export default async function spawnPromise(cmd, args){

    return new Promise((res, rej) => {
        const process = spawn(cmd, args);

        process.stdout.setEncoding('utf-8');

        process.stdout.on('data', (data) => {
            
            console.log(data);
            
        })

        process.on('exit', () => {
            res();
        })



        process.on('error', (err) => {
            rej(err);
        })
    });
}