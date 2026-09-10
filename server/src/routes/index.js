// ============================================
// routes/index.js - Central Route Registry
// ============================================
// This file combines all route modules into one.
// All routes are prefixed with /api in app.js:
//   app.use('/api', routes);
//
// So the final URLs are:
//   /api/auth/...
//   /api/resumes/...
//   /api/ai/...
//   /api/versions/...
// Reference: Router, app.use() - reference-backend.md
// ============================================

import { Router } from 'express';
import authRoutes from './auth.routes.js';
import resumeRoutes from './resume.routes.js';
import aiRoutes from './ai.routes.js';
import versionRoutes from './version.routes.js';
import linkedinRoutes from './linkedin.routes.js';
import digilockerRoutes from './digilocker.routes.js';
import feedbackRoutes from './feedback.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/resumes', resumeRoutes);
router.use('/ai', aiRoutes);
router.use('/versions', versionRoutes);
router.use('/linkedin', linkedinRoutes);
router.use('/digilocker', digilockerRoutes);
router.use('/feedback', feedbackRoutes);

export default router;
