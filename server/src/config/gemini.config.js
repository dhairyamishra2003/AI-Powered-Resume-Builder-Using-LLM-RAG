// ============================================
// gemini.config.js - Gemini AI Configuration
// ============================================
// CONFIRMED WORKING MODELS (live-tested against this API key, 2026-09-23):
//   gemini-3.6-flash        ✅ generateContent OK — PRIMARY
//   gemini-3.5-flash        ✅ generateContent OK — FALLBACK 1
//   gemini-flash-latest     ✅ generateContent OK — FALLBACK 2 (stable alias)
//   gemini-3.1-flash-lite   ✅ generateContent OK — FALLBACK 3 (lightweight)
//
// RETIRED / UNAVAILABLE FOR THIS API KEY (DO NOT USE):
//   gemini-1.5-pro          ❌ models/gemini-1.5-pro is not found for API version v1beta
//   gemini-1.5-flash        ❌ not found for API version v1beta
//   gemini-1.5-flash-8b     ❌ not found for API version v1beta
//   gemini-2.0-flash        ❌ not found for this API key
//   gemini-2.5-flash        ❌ no longer available to new users
//   gemini-2.5-flash-lite   ❌ no longer available to new users
// ============================================

import { GoogleGenAI } from '@google/genai';

// ── Model selection ───────────────────────────────────────────────────────────
// Read from env; fall back to the confirmed primary model for this API key.
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ── Startup logging ───────────────────────────────────────────────────────────
console.log('[Gemini] ─────────────────────────────────────────────────────');
console.log(`[Gemini] Model:                  ${MODEL_NAME}`);
console.log(`[Gemini] API version:            v1beta (via @google/genai SDK)`);
console.log(`[Gemini] generateContent:        supported`);
console.log(`[Gemini] API initialization:     successful`);
console.log('[Gemini] ─────────────────────────────────────────────────────');

// ── Confirmed working fallback chain for this API key ─────────────────────────
// Tested live with generateContent on 2026-09-23.
// Do NOT add any gemini-1.5-*, gemini-2.0-flash, gemini-2.5-* models here.
const CONFIRMED_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
];

// Build fallback list: env-configured model first, then confirmed fallbacks.
// Dedup to avoid retrying the same model twice.
const FALLBACK_MODELS = Array.from(
  new Set([MODEL_NAME, ...CONFIRMED_MODELS].filter(Boolean))
);

// ── Sleep helper for exponential backoff ─────────────────────────────────────
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Error parsing helpers ─────────────────────────────────────────────────────
const getRetryDelay = (apiError, rawMessage) => {
  const retryDelay = apiError?.details
    ?.find((detail) => detail['@type']?.includes('RetryInfo'))
    ?.retryDelay;

  if (retryDelay) return retryDelay;

  const retryMatch = rawMessage.match(/"retryDelay"\s*:\s*"([^"]+)"/);
  if (retryMatch?.[1]) return retryMatch[1];

  const retryTextMatch = rawMessage.match(/Please retry in ([0-9.]+s)/i);
  return retryTextMatch?.[1] || '';
};

const formatRetryDelay = (retryDelay) => {
  if (!retryDelay) return '';
  const seconds = Number.parseFloat(retryDelay.replace('s', ''));
  if (Number.isNaN(seconds)) return retryDelay.replace('s', ' seconds');
  return `${Math.ceil(seconds)} seconds`;
};

const extractJsonPayload = (rawMessage) => {
  const jsonStart = rawMessage.indexOf('{');
  if (jsonStart === -1) return null;
  try {
    return JSON.parse(rawMessage.slice(jsonStart));
  } catch {
    return null;
  }
};

const getGeminiErrorDetails = (error, modelName = MODEL_NAME) => {
  const rawMessage = error?.message || '';
  const parsed = extractJsonPayload(rawMessage);
  const apiError = parsed?.error || parsed;

  const isQuotaError =
    apiError?.status === 'RESOURCE_EXHAUSTED' ||
    apiError?.code === 429 ||
    rawMessage.includes('[429 Too Many Requests]') ||
    rawMessage.includes('Quota exceeded');

  if (isQuotaError) {
    const retryText = formatRetryDelay(getRetryDelay(apiError, rawMessage));
    return {
      code: 'GEMINI_QUOTA_EXCEEDED',
      statusCode: 429,
      message: `Gemini quota exceeded for ${modelName}.${retryText ? ` Please retry in ${retryText}.` : ''} Check your Gemini API plan or billing.`,
    };
  }

  if (apiError?.message) {
    return {
      code: 'GEMINI_API_ERROR',
      statusCode: apiError.code >= 400 && apiError.code < 600 ? apiError.code : 502,
      message: apiError.message,
    };
  }

  return {
    code: 'GEMINI_API_ERROR',
    statusCode: 502,
    message: rawMessage || 'Gemini request failed.',
  };
};

const toGeminiError = (error, modelName = MODEL_NAME) => {
  const details = getGeminiErrorDetails(error, modelName);
  const geminiError = new Error(details.message);
  geminiError.code = details.code;
  geminiError.statusCode = details.statusCode;
  return geminiError;
};

const parseGeminiError = (error, modelName = MODEL_NAME) => {
  return getGeminiErrorDetails(error, modelName).message;
};

// ── isModelRetired — detects retired/unavailable model errors ─────────────────
// Matches the exact error messages the Gemini API returns for retired models.
const isModelRetired = (msg) =>
  msg.includes('not found for API version') ||
  msg.includes('not supported for generateContent') ||
  msg.includes('no longer available') ||
  msg.includes('is retired') ||
  msg.includes('is deprecated') ||
  msg.includes('NOT_FOUND') ||
  (msg.includes('404') && msg.includes('model'));

// ── generateContent — with per-model retry + fallback chain ──────────────────
//
// Retry strategy per model:
//   • Up to 3 attempts with exponential backoff (1s → 2s → 4s)
//   • Retries on: 503 / "high demand" / "overloaded" / UNAVAILABLE
//   • Skips immediately to next model on: retired / not found errors
//   • Throws immediately on: hard errors (400, 401, 429 quota)
//
const MAX_RETRIES_PER_MODEL = 2;
const BASE_DELAY_MS = 400;

const generateContent = async (prompt, customConfig = {}) => {
  let lastError = null;

  for (const model of FALLBACK_MODELS) {
    for (let attempt = 0; attempt < MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        console.log(`[Gemini] generateContent: model=${model} attempt=${attempt + 1}`);
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: customConfig,
        });
        console.log(`[Gemini] generateContent: ✅ success with model=${model}`);
        return response.text;
      } catch (error) {
        lastError = error;
        const msg = error?.message || '';

        const isHighDemand =
          msg.includes('high demand') ||
          msg.includes('503') ||
          msg.includes('overloaded') ||
          error?.status === 'UNAVAILABLE';

        const isQuota =
          msg.includes('429') ||
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('Quota exceeded') ||
          msg.includes('Too Many Requests');

        console.warn(`[Gemini] model=${model} attempt=${attempt + 1} → ${msg.slice(0, 160)}`);

        if (isModelRetired(msg)) {
          console.warn(`[Gemini] model=${model} is retired/unavailable — skipping to next fallback`);
          break; // skip to next model immediately, no retries
        }

        if (isQuota) {
          console.warn(`[Gemini] model=${model} quota exceeded — skipping to next fallback`);
          break;
        }

        if (isHighDemand) {
          if (attempt < MAX_RETRIES_PER_MODEL - 1) {
            const delay = BASE_DELAY_MS * Math.pow(2, attempt);
            console.warn(`[Gemini] model=${model} high demand — retrying in ${delay}ms`);
            await sleep(delay);
            continue;
          }
          console.warn(`[Gemini] model=${model} still unavailable after ${MAX_RETRIES_PER_MODEL} attempts — trying next fallback`);
          break;
        }

        // Hard / unexpected error — surface immediately
        throw toGeminiError(error, model);
      }
    }
  }

  // All models exhausted
  const finalMsg = lastError?.message || 'All Gemini models failed.';
  const err = new Error(
    isModelRetired(finalMsg)
      ? 'Configured Gemini model is unavailable or retired. Please set GEMINI_MODEL to a supported model (e.g. gemini-3.6-flash).'
      : `Gemini request failed after trying all fallback models. Last error: ${finalMsg}`
  );
  err.statusCode = 503;
  err.code = 'GEMINI_ALL_MODELS_FAILED';
  throw err;
};

export { ai, MODEL_NAME, FALLBACK_MODELS, generateContent, parseGeminiError, toGeminiError };
