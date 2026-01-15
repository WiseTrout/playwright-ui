export function createFileUploadPromise(file, path){
    return new Promise((resolve, reject) => {
        file.mv(path, (err) => {
            if(err) reject('File upload failed');
            resolve('File upload successful');
        })
    })
}