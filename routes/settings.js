import express from 'express';
import { getSettingsPage, updateSettings } from '../controllers/settings.js';

const router = express.Router();

router.get('/', getSettingsPage);
router.post('/update', updateSettings);

export default router;