// ============================================
// feedback.routes.js - Feedback Routes
// ============================================

import { Router } from 'express';
import { createFeedback } from '../controllers/feedback.controller.js';
import { optionalAuthenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', optionalAuthenticate, createFeedback);

export default router;
