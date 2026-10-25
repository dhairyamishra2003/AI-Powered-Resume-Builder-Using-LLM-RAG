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
import feedbackRoutes from './feedback.routes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/resumes', resumeRoutes);
router.use('/ai', aiRoutes);
router.use('/versions', versionRoutes);
router.use('/feedback', feedbackRoutes);

export default router;
