// ============================================
// app.js - Express Application Setup
// ============================================
// Configures the Express app with CORS, body parsing,
// API routes, and error handling.
// ============================================

import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

const app = express(); // Express app instance (Express.js: Application Setup)

// --- Middleware ---
const rawOrigins = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = rawOrigins
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

// Production frontend origins allowed by default
const defaultProdOrigins = [
  'https://ai-powered-resume-builder-using-llm.vercel.app',
];

const defaultDevOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

// Matches any Vercel deployment preview or production domain for this application
const vercelProjectRegex = /^https:\/\/ai-powered-resume-builder-using-llm(-[a-z0-9-]+)?\.vercel\.app$/i;

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const normalized = origin.trim().replace(/\/$/, '');
  return (
    allowedOrigins.includes(normalized) ||
    defaultProdOrigins.includes(normalized) ||
    defaultDevOrigins.includes(normalized) ||
    vercelProjectRegex.test(normalized) ||
    (process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized))
  );
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server or tests)
      if (!origin) return callback(null, true);
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Set-Cookie'],
  })
);
app.use(express.json({ limit: '10mb' })); // JSON body parser (Express.js: Middleware)

// Lightweight development-only request timing. It is intentionally disabled
// in production to avoid noisy logs and extra response headers.
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const startedAt = performance.now();
    res.on('finish', () => console.info(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} ${(performance.now() - startedAt).toFixed(1)} ms`));
    next();
  });
}

// --- Routes ---
app.use('/api', routes); // Route mounting (Express.js: Route Organization)

// --- Error Handling ---
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
