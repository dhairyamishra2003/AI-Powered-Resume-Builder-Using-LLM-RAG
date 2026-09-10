import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Resume from '../models/Resume.model.js';
import {
  describeAcademicAvailability,
  mapAcademicRecordsToEducation,
  mergeEducationRecords,
  normalizeDigiLockerAcademicData,
} from './digilocker.mapper.js';

const DEFAULT_AUTH_PATH = '/oauth2/authorize';
const DEFAULT_TOKEN_PATH = '/oauth2/token';
const DEFAULT_ACADEMIC_PATH = '/api/digilocker/academic';
const DIGILOCKER_SCOPES = ['openid', 'profile', 'documents'];

const getConfig = () => ({
  clientId: process.env.DIGILOCKER_CLIENT_ID,
  clientSecret: process.env.DIGILOCKER_CLIENT_SECRET,
  redirectUri: process.env.DIGILOCKER_REDIRECT_URI,
  apiBaseUrl: process.env.DIGILOCKER_API_BASE_URL,
  authUrl: process.env.DIGILOCKER_AUTH_URL,
  tokenUrl: process.env.DIGILOCKER_TOKEN_URL,
  academicUrl: process.env.DIGILOCKER_ACADEMIC_URL,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
});

const buildUrl = (baseUrl, explicitUrl, fallbackPath) => {
  if (explicitUrl) return explicitUrl;
  return `${String(baseUrl || '').replace(/\/$/, '')}${fallbackPath}`;
};

export const isConfigured = () => {
  const { clientId, clientSecret, redirectUri, apiBaseUrl, authUrl, tokenUrl, academicUrl } = getConfig();
  return Boolean(clientId && clientSecret && redirectUri && ((apiBaseUrl && !authUrl && !tokenUrl && !academicUrl) || (authUrl && tokenUrl && academicUrl)));
};

const createError = (message, statusCode = 400, code = 'DIGILOCKER_ERROR') => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

export const validateResumeOwnership = async ({ userId, resumeId }) => {
  const resume = await Resume.findOne({ _id: resumeId, userId }).select('_id templateId');
  if (!resume) {
    throw createError('Resume not found.', 404, 'RESUME_NOT_FOUND');
  }
  return resume;
};

export const generateAuthorizationUrl = ({ userId, resumeId, templateId = '' }) => {
  if (!isConfigured()) {
    throw createError('DigiLocker/APAAR integration is not configured.', 503, 'DIGILOCKER_NOT_CONFIGURED');
  }

  const { clientId, redirectUri, apiBaseUrl, authUrl } = getConfig();
  const state = jwt.sign(
    {
      userId: String(userId),
      resumeId: String(resumeId),
      templateId: String(templateId || ''),
      nonce: crypto.randomBytes(16).toString('hex'),
    },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: DIGILOCKER_SCOPES.join(' '),
    state,
  });

  return {
    authorizationUrl: `${buildUrl(apiBaseUrl, authUrl, DEFAULT_AUTH_PATH)}?${params.toString()}`,
    expiresInSeconds: 600,
    scopes: DIGILOCKER_SCOPES,
  };
};

export const validateOAuthState = (state) => {
  if (!state) {
    throw createError('Missing DigiLocker OAuth state.', 400, 'DIGILOCKER_INVALID_STATE');
  }

  try {
    return jwt.verify(state, process.env.JWT_SECRET);
  } catch {
    throw createError('Invalid or expired DigiLocker OAuth state.', 400, 'DIGILOCKER_INVALID_STATE');
  }
};

export const exchangeCodeForAccessToken = async (code) => {
  if (!code) {
    throw createError('Missing DigiLocker authorization code.', 400, 'DIGILOCKER_MISSING_CODE');
  }
  if (!isConfigured()) {
    throw createError('DigiLocker/APAAR integration is not configured.', 503, 'DIGILOCKER_NOT_CONFIGURED');
  }

  const { clientId, clientSecret, redirectUri, apiBaseUrl, tokenUrl } = getConfig();
  const response = await fetch(buildUrl(apiBaseUrl, tokenUrl, DEFAULT_TOKEN_PATH), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.access_token) {
    throw createError(data.error_description || data.message || 'Unable to authorize with DigiLocker.', response.status || 502, 'DIGILOCKER_TOKEN_ERROR');
  }

  return data.access_token;
};

export const fetchAcademicRecords = async (accessToken) => {
  const { apiBaseUrl, academicUrl } = getConfig();
  const response = await fetch(buildUrl(apiBaseUrl, academicUrl, DEFAULT_ACADEMIC_PATH), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw createError(data.message || 'Unable to retrieve consented academic documents from DigiLocker.', response.status || 502, 'DIGILOCKER_ACADEMIC_ERROR');
  }

  return normalizeDigiLockerAcademicData(data);
};

export const buildImportPreview = (academicRecords = []) => {
  const education = mapAcademicRecordsToEducation(academicRecords);
  const availability = describeAcademicAvailability(education);
  return {
    education,
    availability,
    availableFields: availability.filter((field) => field.available),
    unavailableFields: availability.filter((field) => !field.available),
    partial: availability.some((field) => !field.available),
    limitations: [
      'Only academic data returned by the authorized DigiLocker/APAAR API response is mapped.',
      'APAAR ID alone is not used as a direct record lookup key.',
    ],
  };
};

export const createImportToken = ({ userId, resumeId, templateId = '', academicRecords }) => jwt.sign(
  {
    userId: String(userId),
    resumeId: String(resumeId),
    templateId: String(templateId || ''),
    academicRecords,
  },
  process.env.JWT_SECRET,
  { expiresIn: '10m' }
);

export const verifyImportToken = (importToken) => {
  if (!importToken) {
    throw createError('Missing DigiLocker import token.', 400, 'DIGILOCKER_IMPORT_TOKEN_REQUIRED');
  }

  try {
    return jwt.verify(importToken, process.env.JWT_SECRET);
  } catch {
    throw createError('Invalid or expired DigiLocker import token.', 400, 'DIGILOCKER_IMPORT_TOKEN_INVALID');
  }
};

export const getImportPreview = ({ userId, resumeId, importToken }) => {
  const payload = verifyImportToken(importToken);
  if (String(payload.userId) !== String(userId) || String(payload.resumeId) !== String(resumeId)) {
    throw createError('DigiLocker import token does not match this resume.', 403, 'DIGILOCKER_IMPORT_TOKEN_MISMATCH');
  }
  return buildImportPreview(payload.academicRecords || []);
};

export const confirmImport = async ({ userId, resumeId, importToken, selectedEducation }) => {
  const payload = verifyImportToken(importToken);
  if (String(payload.userId) !== String(userId) || String(payload.resumeId) !== String(resumeId)) {
    throw createError('DigiLocker import token does not match this resume.', 403, 'DIGILOCKER_IMPORT_TOKEN_MISMATCH');
  }

  const resume = await Resume.findOne({ _id: resumeId, userId });
  if (!resume) {
    throw createError('Resume not found.', 404, 'RESUME_NOT_FOUND');
  }

  const authorizedEducation = mapAcademicRecordsToEducation(payload.academicRecords || []);
  const selected = Array.isArray(selectedEducation) ? selectedEducation : authorizedEducation;
  const allowed = selected.filter((item) => authorizedEducation.some((authorized) => (
    authorized.institution === item.institution
    && authorized.degree === item.degree
    && authorized.field === item.field
    && authorized.startDate === item.startDate
    && authorized.endDate === item.endDate
    && authorized.gpa === item.gpa
  )));

  resume.sections.education = mergeEducationRecords(resume.sections?.education || [], allowed);
  await resume.save();
  return resume;
};

export const getClientCallbackUrl = ({ resumeId, status = 'success', message = '', importToken = '' }) => {
  const { clientUrl } = getConfig();
  const params = new URLSearchParams({ digilocker: status });
  if (message) params.set('message', message);
  if (importToken) params.set('importToken', importToken);
  return `${clientUrl}/builder/${resumeId}?${params.toString()}`;
};
