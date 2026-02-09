import sqlite from "better-sqlite3";
import bsql3ss from "better-sqlite3-session-store";
 
export function createSessionStore(session){
    const SqliteStore = bsql3ss(session);
    const sessionsDb = new sqlite("sessions.db");
    return new SqliteStore({
            client: sessionsDb, 
            expired:{
                clear: true,
                intervalMs: 90000
            }
        });
}
