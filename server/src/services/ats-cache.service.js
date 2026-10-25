import crypto from 'node:crypto';

const CACHE_VERSION = 'ats-v1';
const MAX_ENTRIES = 100;
const TTL_MS = 10 * 60 * 1000;
const cache = new Map();

export const makeAtsCacheKey = ({ sections, jobDescription, targetRole }) => crypto
  .createHash('sha256')
  .update(JSON.stringify({ CACHE_VERSION, sections, jobDescription, targetRole }))
  .digest('hex');

export const getCachedAtsScore = (key) => {
  const entry = cache.get(key);
  if (!entry || entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};

export const cacheAtsScore = (key, value) => {
  if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value);
  cache.set(key, { value, expiresAt: Date.now() + TTL_MS });
};
