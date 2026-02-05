import express from 'express';
import { getMenu, getTestsUpdate, runTests, stopTests } from '../controllers/testing';

const router = express.Router();

router.get('/', getMenu);
router.post('/run-tests', runTests);
router.get('/get-tests-update', getTestsUpdate);
router.post('/stop-tests', stopTests);

export default router;