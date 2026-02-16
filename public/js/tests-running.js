 const UPDATE_INTERVAL_MS = 1000;

const h1 = document.querySelector('h1');
const div = document.getElementById('tests-progress');
const terminalOutput = document.getElementById('terminal-output');
const [retryBtn, viewResultsBtn, stopButton] = document.querySelectorAll('button');

const INITIAL_TESTS_COUNT = {
            pending: 0,
            running: 0,
            passed: 0,
            failed: 0,
            total: 0
};

const POSSIBLE_STATUSES = ["passed", "failed", "pending", "running"];

let openedAccordions = [];

startPeriodicDataUpdate();

function startPeriodicDataUpdate(){

    let requestInProcess = false;

    const interval = setInterval(async () => {
    if(requestInProcess) return;
    requestInProcess = true;
    try{
        
        const { data, complete, logs } = await fetchData();
        showData(data);
        showLogs(logs);

        if(complete) {
            clearInterval(interval);
            h1.innerText = 'Tests complete';
            retryBtn.disabled = false;
            viewResultsBtn.disabled = false;
            stopButton.disabled = true;
        }

    }catch(err){
        console.error(err);
        clearInterval(interval);
        h1.innerText = 'Error while running tests';
        retryBtn.disabled = false;
        stopButton.disabled = true;
    }
    requestInProcess = false;
    }, UPDATE_INTERVAL_MS);
}

async function fetchData(){
    const res = await fetch('/tests/get-update');
    if(!res.ok) throw new Error('Response not okay');
    const json = await res.json();
    return json;

}



function showData(data){

    div.innerText = '';

    for(const suite in data){

        const suiteTestsCount = {...INITIAL_TESTS_COUNT};

        const h2 = createAccordion('h2', suite);
        const groupsList = document.createElement('ul');

        div.append(h2);
        div.append(groupsList);

        for(const group in data[suite]){

            const groupTestsCount = {...INITIAL_TESTS_COUNT};

            const groupLi = document.createElement('li');
            const h3 = createAccordion('h3', group);
            const testsList = document.createElement('ul');
            
            
            groupLi.append(h3);
            groupLi.append(testsList);

            groupsList.append(groupLi);

            for(const testTitle in data[suite][group]){

                for(const browser in data[suite][group][testTitle]){

                    let status;
                    let message;

                    if(POSSIBLE_STATUSES.includes(data[suite][group][testTitle][browser])){
                        status = data[suite][group][testTitle][browser];
                    }else{
                        status = 'failed';
                        message = cleanText(data[suite][group][testTitle][browser]);
                    }

                    groupTestsCount[status]++;
                    groupTestsCount.total++;
                    suiteTestsCount[status]++;
                    suiteTestsCount.total++;

                    const testLi = createTestItem(testTitle, browser, status, message);
                    
                    testsList.append(testLi);


                }

            }

            displayTestCounts(h3, groupTestsCount);
        }

        displayTestCounts(h2, suiteTestsCount);
    }

}

function showLogs(logs){
    if(logs) console.log(logs);
}

function createAccordion(tag, innerText){
    const acc = document.createElement(tag);

    let bracketsContent = '<span>0/0 complete</span>';

    for(const status in INITIAL_TESTS_COUNT){
        if(status === 'total') continue;
        bracketsContent += `, <span class="label label--${status}">0</span>`;
    }

    acc.innerHTML = `${innerText} (${bracketsContent}):`;
    acc.classList.add('accordion');
    if(openedAccordions.includes(innerText)) acc.classList.add('expanded');
    acc.onclick = () => {
        if(openedAccordions.includes(innerText)){
            openedAccordions = openedAccordions.filter(acc => acc != innerText);
            acc.classList.remove('expanded');
        }else{
            openedAccordions.push(innerText);
            acc.classList.add('expanded');
        }
    }
    return acc;
}

function displayTestCounts(element, testCounts){
    const completeTestsCount = testCounts.passed + testCounts.failed;
    element.querySelector('span').innerText = `${completeTestsCount}/${testCounts.total} complete`;
    
    for(const status in testCounts){
        if(status === 'total') continue;
        element.querySelector('.label--' + status).innerText = testCounts[status];
    }

}

function createTestItem(title, browser, status, message){
    const testLi = document.createElement('li');

    


    const h4 = document.createElement('h4');
    h4.innerText = `${title} > ${browser}:`;
    h4.classList.add('label');
    h4.classList.add('label--' + status);
    
    testLi.append(h4);
    
    const p = document.createElement('p');
    p.innerText = message || status;
    p.classList.add('text--' + status);
    testLi.append(p);

    return testLi;
}

function cleanText(string){
    return string.replaceAll(/\[[1-9]*m/g, '').replaceAll('\u001b', '');
}