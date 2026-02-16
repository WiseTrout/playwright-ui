import { spawn } from "child_process";

export let allTestsData;
export let selectedTestsData;

// We have two separate variables for tests data.
// allTestsData describes all the available tests, these will be shown in the menu. 
// selectedTestsData describes the specific tests we have selected to run.
// The output of getListOfCurrentlySelectedTests() depends on the contents of "test-settings.json". 
// That's why storeTestsInAllTestsArray() must be called when "test-settings.json" is set to default, 
// while storeTestsInSelectedTestsArray() must be called after we have submitted the tests launch form
// and the selected options have been saved to "settings.json".

export async function storeTestsInAllTestsArray(){
    allTestsData = await getListOfCurrentlySelectedTests();
}

export async function storeTestsInSelectedTestsArray(){
    selectedTestsData = await getListOfCurrentlySelectedTests();
}

async function getListOfCurrentlySelectedTests(){
    const data = await new Promise((res, rej) => {
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

    return data;
}