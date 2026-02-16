import express from 'express';
import { getSettingsPage, updateSettings } from '../controllers/settings.js';
import { authenticationMiddleware } from '../controllers/auth.js';

const router = express.Router();

if(process.env.USERNAME) router.use('/', authenticationMiddleware);
router.get('/', getSettingsPage);
router.post('/update', updateSettings);

export default router;