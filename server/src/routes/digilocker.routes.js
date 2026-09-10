import { Router } from 'express';
import { confirmImport, getAuthUrl, getStatusOrPreview, handleCallback } from '../controllers/digilocker.controller.js';
import authenticate from '../middleware/auth.middleware.js';

const router = Router();

router.get('/auth', authenticate, getAuthUrl);
router.get('/callback', handleCallback);
router.get('/academic', authenticate, getStatusOrPreview);
router.post('/import', authenticate, confirmImport);

export default router;
