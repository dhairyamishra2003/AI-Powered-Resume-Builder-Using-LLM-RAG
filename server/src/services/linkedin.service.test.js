import assert from 'node:assert/strict';
import test from 'node:test';
import {
  generateAuthorizationUrl,
  getImportPreview,
  isConfigured,
  isValidLinkedInProfileUrl,
  validateOAuthState,
} from './linkedin.service.js';

const originalEnv = { ...process.env };

test.afterEach(() => {
  process.env = { ...originalEnv };
});

test('reports LinkedIn as unconfigured when required env vars are missing', () => {
  delete process.env.LINKEDIN_CLIENT_ID;
  delete process.env.LINKEDIN_CLIENT_SECRET;
  delete process.env.LINKEDIN_REDIRECT_URI;

  assert.equal(isConfigured(), false);
});

test('generates authorization URL and validates signed OAuth state', () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.LINKEDIN_CLIENT_ID = 'client-id';
  process.env.LINKEDIN_CLIENT_SECRET = 'client-secret';
  process.env.LINKEDIN_REDIRECT_URI = 'http://localhost:5000/api/linkedin/callback';

  const result = generateAuthorizationUrl({
    userId: 'user-1',
    resumeId: 'resume-1',
    templateId: 'modern',
    profileUrl: 'https://www.linkedin.com/in/user-one',
  });
  const url = new URL(result.authorizationUrl);
  const payload = validateOAuthState(url.searchParams.get('state'));

  assert.equal(url.origin + url.pathname, 'https://www.linkedin.com/oauth/v2/authorization');
  assert.equal(url.searchParams.get('scope'), 'openid profile email');
  assert.equal(payload.userId, 'user-1');
  assert.equal(payload.resumeId, 'resume-1');
  assert.equal(payload.templateId, 'modern');
  assert.equal(payload.profileUrl, 'https://www.linkedin.com/in/user-one');
});

test('validates LinkedIn profile URLs', () => {
  assert.equal(isValidLinkedInProfileUrl('https://www.linkedin.com/in/user-name'), true);
  assert.equal(isValidLinkedInProfileUrl('www.linkedin.com/in/user_name/'), true);
  assert.equal(isValidLinkedInProfileUrl('https://www.linkedin.com/company/openai'), false);
  assert.equal(isValidLinkedInProfileUrl('https://example.com/in/user-name'), false);
});

test('rejects invalid LinkedIn profile URL before OAuth', () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.LINKEDIN_CLIENT_ID = 'client-id';
  process.env.LINKEDIN_CLIENT_SECRET = 'client-secret';
  process.env.LINKEDIN_REDIRECT_URI = 'http://localhost:5000/api/linkedin/callback';

  assert.throws(
    () => generateAuthorizationUrl({ userId: 'user-1', resumeId: 'resume-1', profileUrl: 'https://linkedin.com/company/openai' }),
    /valid LinkedIn profile URL/
  );
});

test('rejects invalid OAuth state', () => {
  process.env.JWT_SECRET = 'test-secret';

  assert.throws(() => validateOAuthState('bad-state'), /Invalid or expired/);
});

test('builds preview from a valid import token and rejects mismatches', async () => {
  process.env.JWT_SECRET = 'test-secret';
  const token = generateAuthorizationUrl;
  assert.equal(typeof token, 'function');

  const jwt = await import('jsonwebtoken');
  const importToken = jwt.default.sign({
    userId: 'user-1',
    resumeId: 'resume-1',
    templateId: 'modern',
    profileUrl: 'https://www.linkedin.com/in/lin-ked',
    profile: { fullName: 'Lin Ked', email: 'lin@example.com' },
  }, process.env.JWT_SECRET);

  const preview = getImportPreview({ userId: 'user-1', resumeId: 'resume-1', importToken });
  assert.equal(preview.sections.personalInfo.fullName, 'Lin Ked');
  assert.equal(preview.sections.personalInfo.email, 'lin@example.com');
  assert.equal(preview.sections.personalInfo.linkedIn, 'https://www.linkedin.com/in/lin-ked');
  assert.equal(preview.partial, true);

  assert.throws(
    () => getImportPreview({ userId: 'user-2', resumeId: 'resume-1', importToken }),
    /does not match/
  );
});
