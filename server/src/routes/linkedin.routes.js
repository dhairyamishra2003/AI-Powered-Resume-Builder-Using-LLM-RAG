import { Router } from 'express';
import { confirmImport, getAuthUrl, getProfileStatus, handleCallback } from '../controllers/linkedin.controller.js';
import authenticate from '../middleware/auth.middleware.js';

const router = Router();

router.get('/auth', authenticate, getAuthUrl);
router.get('/callback', handleCallback);
router.get('/profile', authenticate, getProfileStatus);
router.post('/import', authenticate, confirmImport);

export default router;
