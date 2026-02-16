import { readHashedPassword, writeHashedPassword } from "../models/auth.js";
import bcrypt from 'bcryptjs';
import fs from 'fs';

export async function getSignup(req, res){
    if(req.session.isLoggedIn) {
        res.redirect('/tests');
        return;
    }
    if(await readHashedPassword()){
        res.redirect('/login');
        return;
    }
    res.render('set-password');
}

export async function postSignup(req, res){
    const newPassword = req.body.password;
    const hashedPassword = await bcrypt.hash(newPassword, process.env.SALT_ROUNDS || 10);
    await writeHashedPassword(hashedPassword);
    res.redirect('/login');
}

export function getLogin(_, res){
    res.render('login');
}

export async function postLogin(req, res){
    const { username,  password } = req.body;

    if(!username || !password) return res.render('wrong-credentials');

    const hashedPassword = await readHashedPassword();
    

    if(username != process.env.USERNAME || !(await bcrypt.compare(password, hashedPassword))){
        return res.render('wrong-credentials');
    }
    req.session.isLoggedIn = true;
    res.redirect('/');
}
export function logout(req, res){
    req.session.destroy();
    res.redirect('/login');
}


export function authenticationMiddleware(req, res, next){
    if(!req.session.isLoggedIn){ 
        return res.redirect('/login');
    }else{
        next();
    }
}

export async function passwordExistanceMiddleware(req, res, next){      
    if(req.session.isLoggedIn || req.path === '/set-password'){
        next();
    }else{
        const hashedPassword = await readHashedPassword();
        hashedPassword ? next() : res.redirect('/set-password');            
    }
}