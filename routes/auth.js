import express from 'express';

const router = express.Router();

router.get('/set-password');
router.post('/set-password');
router.get('/login');
router.post('/login');
router.post('/logout');

export default router;