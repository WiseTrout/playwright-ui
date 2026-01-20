import Database from 'better-sqlite3';

const TABLE_NAME = 'testLogs';

const db = initDB();

function initDB(){
    const db = new Database('test-logs.db');
    db.pragma('journal_mode = WAL');
    db.pragma('busy_timeout = 5000');
    return db;
}

export function clearLogs(){
    const tableCreationSql = `CREATE TABLE IF NOT EXISTS testLogs (
            suite TEXT,
            testGroup TEXT,
            title TEXT,
            browser TEXT,
            status TEXT);`;

    const tableClearSql = `DELETE FROM ${TABLE_NAME};`;

    db.exec(tableCreationSql);
    db.exec(tableClearSql);
}

export function logTests(tests){

    const writeLogsSql = `INSERT INTO ${TABLE_NAME} VALUES (?, ?, ?, ?, ?);`;
    const statement = db.prepare(writeLogsSql);

    for(const test of tests){
        statement.run([test.suiteName, test.groupName, test.title, test.browser, test.status || 'pending']);
    }
    
}

export function updateTestStatus({suiteName, groupName, title, browser, status}){

    const sql = `UPDATE ${TABLE_NAME}
    SET status = ?
    WHERE suite = ? AND testGroup = ? AND title = ? AND browser = ?;
    `;

    const update = db.prepare(sql);

    update.run(status, suiteName, groupName, title, browser);

}

export function readLogs(){

    const logs = db.prepare(`SELECT * FROM ${TABLE_NAME}`).all();

    return reformatTestLogs(logs);

}

export function checkIfAllTestsArePending(){
    const logs = db.prepare(`SELECT * FROM ${TABLE_NAME}`).all();

    return !logs.find(log => log.status != 'pending');
}

function reformatTestLogs(logs){
    const data = {};

    for(const log of logs){

        if(data[log.suite]){

            if(data[log.suite][log.testGroup]){

                if(data[log.suite][log.testGroup][log.title]){
                    data[log.suite][log.testGroup][log.title][log.browser] = log.status;
                }else{
                    data[log.suite][log.testGroup][log.title] = {
                        [log.browser]: log.status
                    }
                }

            }else{
                data[log.suite][log.testGroup] = {
                    [log.title]: { [log.browser]: log.status }
                }
            }

        }
        else{
            data[log.suite] = {
                [log.testGroup]: {
                    [log.title]: {
                        [log.browser]: log.status
                    }
                }
            }
        }

    }
    return data;
}
