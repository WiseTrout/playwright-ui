import express from 'express';
import { getMenu, getStatusPage, getTestsUpdate, runTests, stopTests } from '../controllers/testing.js';
import { authenticationMiddleware } from '../controllers/auth.js';

const router = express.Router();

if(process.env.USERNAME) router.use('/', authenticationMiddleware);
router.get('/', getMenu);
router.post('/run', runTests);
router.get('/status', getStatusPage);
router.get('/get-update', getTestsUpdate);
router.post('/stop', stopTests);

export default router;