import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Resume from '../models/Resume.model.js';
import { describeImportAvailability, mapLinkedInProfileToResumeSections, mergeLinkedInSections, normalizeLinkedInProfile } from './linkedin.mapper.js';

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_USERINFO_URL = 'https://api.linkedin.com/v2/userinfo';
const LINKEDIN_SCOPES = ['openid', 'profile', 'email'];

const getConfig = () => ({
  clientId: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  redirectUri: process.env.LINKEDIN_REDIRECT_URI,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
});

export const isConfigured = () => {
  const { clientId, clientSecret, redirectUri } = getConfig();
  return Boolean(clientId && clientSecret && redirectUri);
};

const createError = (message, statusCode = 400, code = 'LINKEDIN_ERROR') => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

export const isValidLinkedInProfileUrl = (value = '') => {
  try {
    const url = new URL(value.startsWith('http') ? value : `https://${value}`);
    const host = url.hostname.toLowerCase();
    return (host === 'linkedin.com' || host === 'www.linkedin.com') && /^\/in\/[^/?#]+\/?$/.test(url.pathname);
  } catch {
    return false;
  }
};

export const validateResumeOwnership = async ({ userId, resumeId }) => {
  const resume = await Resume.findOne({ _id: resumeId, userId }).select('_id templateId');
  if (!resume) {
    throw createError('Resume not found.', 404, 'RESUME_NOT_FOUND');
  }
  return resume;
};

export const generateAuthorizationUrl = ({ userId, resumeId, templateId = '', profileUrl = '' }) => {
  if (!isConfigured()) {
    throw createError('LinkedIn integration is not configured.', 503, 'LINKEDIN_NOT_CONFIGURED');
  }
  if (!isValidLinkedInProfileUrl(profileUrl)) {
    throw createError('Enter a valid LinkedIn profile URL, such as https://www.linkedin.com/in/username.', 400, 'LINKEDIN_INVALID_PROFILE_URL');
  }

  const { clientId, redirectUri } = getConfig();
  const state = jwt.sign(
    {
      userId: String(userId),
      resumeId: String(resumeId),
      templateId: String(templateId || ''),
      profileUrl,
      nonce: crypto.randomBytes(16).toString('hex'),
    },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: LINKEDIN_SCOPES.join(' '),
    state,
  });

  return {
    authorizationUrl: `${LINKEDIN_AUTH_URL}?${params.toString()}`,
    expiresInSeconds: 600,
    scopes: LINKEDIN_SCOPES,
  };
};

export const validateOAuthState = (state) => {
  if (!state) {
    throw createError('Missing LinkedIn OAuth state.', 400, 'LINKEDIN_INVALID_STATE');
  }

  try {
    return jwt.verify(state, process.env.JWT_SECRET);
  } catch {
    throw createError('Invalid or expired LinkedIn OAuth state.', 400, 'LINKEDIN_INVALID_STATE');
  }
};

export const exchangeCodeForAccessToken = async (code) => {
  if (!code) {
    throw createError('Missing LinkedIn authorization code.', 400, 'LINKEDIN_MISSING_CODE');
  }
  if (!isConfigured()) {
    throw createError('LinkedIn integration is not configured.', 503, 'LINKEDIN_NOT_CONFIGURED');
  }

  const { clientId, clientSecret, redirectUri } = getConfig();
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(LINKEDIN_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.access_token) {
    throw createError(data.error_description || 'Unable to authorize with LinkedIn.', response.status || 502, 'LINKEDIN_TOKEN_ERROR');
  }

  return data.access_token;
};

export const fetchProfile = async (accessToken) => {
  const response = await fetch(LINKEDIN_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw createError(data.message || 'Unable to retrieve LinkedIn profile.', response.status || 502, 'LINKEDIN_PROFILE_ERROR');
  }

  return normalizeLinkedInProfile(data);
};

export const buildImportPreview = (profile, options = {}) => {
  const sections = mapLinkedInProfileToResumeSections(profile, options);
  const availability = describeImportAvailability(sections);
  return {
    profile,
    sections,
    availability,
    availableFields: availability.filter((field) => field.available),
    unavailableFields: availability.filter((field) => !field.available),
    partial: availability.some((field) => !field.available),
    limitations: [
      'Basic LinkedIn OpenID Connect scopes do not include detailed experience, education, skills, or certifications.',
    ],
  };
};

export const createImportToken = ({ userId, resumeId, templateId = '', profileUrl = '', profile }) => jwt.sign(
  {
    userId: String(userId),
    resumeId: String(resumeId),
    templateId: String(templateId || ''),
    profileUrl,
    profile,
  },
  process.env.JWT_SECRET,
  { expiresIn: '10m' }
);

export const verifyImportToken = (importToken) => {
  if (!importToken) {
    throw createError('Missing LinkedIn import token.', 400, 'LINKEDIN_IMPORT_TOKEN_REQUIRED');
  }

  try {
    return jwt.verify(importToken, process.env.JWT_SECRET);
  } catch {
    throw createError('Invalid or expired LinkedIn import token.', 400, 'LINKEDIN_IMPORT_TOKEN_INVALID');
  }
};

export const getImportPreview = ({ userId, resumeId, importToken }) => {
  const payload = verifyImportToken(importToken);
  if (String(payload.userId) !== String(userId) || String(payload.resumeId) !== String(resumeId)) {
    throw createError('LinkedIn import token does not match this resume.', 403, 'LINKEDIN_IMPORT_TOKEN_MISMATCH');
  }
  return buildImportPreview(payload.profile, { profileUrl: payload.profileUrl });
};

export const importProfileIntoResume = async ({ userId, resumeId, profile, sections }) => {
  const resume = await Resume.findOne({ _id: resumeId, userId });
  if (!resume) {
    throw createError('Resume not found.', 404, 'RESUME_NOT_FOUND');
  }

  const importedSections = sections || mapLinkedInProfileToResumeSections(profile);
  const originalTemplateId = resume.templateId;
  resume.sections = mergeLinkedInSections(resume.sections?.toObject?.() || resume.sections || {}, importedSections);
  resume.templateId = originalTemplateId;
  resume.linkedin = {
    connected: true,
    linkedinId: profile.linkedinId || '',
    lastImportedAt: new Date(),
  };

  await resume.save();
  return resume;
};

export const confirmImport = async ({ userId, resumeId, importToken, sections }) => {
  const payload = verifyImportToken(importToken);
  if (String(payload.userId) !== String(userId) || String(payload.resumeId) !== String(resumeId)) {
    throw createError('LinkedIn import token does not match this resume.', 403, 'LINKEDIN_IMPORT_TOKEN_MISMATCH');
  }
  return importProfileIntoResume({ userId, resumeId, profile: payload.profile, sections });
};

export const getClientCallbackUrl = ({ resumeId, status = 'success', message = '', importToken = '' }) => {
  const { clientUrl } = getConfig();
  const params = new URLSearchParams({ linkedin: status });
  if (message) params.set('message', message);
  if (importToken) params.set('importToken', importToken);
  return `${clientUrl}/builder/${resumeId}?${params.toString()}`;
};
