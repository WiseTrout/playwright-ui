import fs from 'fs';

export default async function saveFile(file, path){
    return await new Promise((resolve, reject) => {
        file.mv(path, (err) => {
            if(err) reject(err);
            resolve('File upload successful');
        })
    })
}