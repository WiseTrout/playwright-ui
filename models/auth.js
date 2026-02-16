import fs from 'fs';


export async function readHashedPassword(){
    return await fs.promises.readFile('password.txt', {encoding: 'utf-8'})
}

export async function writeHashedPassword(password){
    return await fs.promises.writeFile('password.txt', password);
}