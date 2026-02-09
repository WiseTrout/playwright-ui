import session from "express-session";
import { createSessionStore } from "../models/session.js";

export const sessionMiddleware = session(
    {
        store: createSessionStore(session),
        resave: false,
        saveUninitialized: false,
        secret: process.env.SESSION_SECRET || randomstring(10),
        cookie: {
            maxAge: +process.env.SESSION_COOKIE_MAX_AGE || 900000
        }
    }
);

function randomstring(length) {
    let result           = '';
    const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_- ';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
