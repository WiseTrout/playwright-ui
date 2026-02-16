import express from 'express';
import { getLogin, getSignup, logout, postLogin, postSignup } from '../controllers/auth.js';

const router = express.Router();

router.get('/set-password', getSignup);
router.post('/set-password', postSignup);
router.get('/login', getLogin);
router.post('/login', postLogin);
router.post('/logout', logout);

export default router;