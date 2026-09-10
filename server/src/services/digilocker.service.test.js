import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import {
  buildImportPreview,
  confirmImport,
  exchangeCodeForAccessToken,
  generateAuthorizationUrl,
  getImportPreview,
  isConfigured,
  validateResumeOwnership,
  validateOAuthState,
} from './digilocker.service.js';
import Resume from '../models/Resume.model.js';

const originalEnv = { ...process.env };
const originalFetch = global.fetch;
const originalFindOne = Resume.findOne;

test.afterEach(() => {
  process.env = { ...originalEnv };
  global.fetch = originalFetch;
  Resume.findOne = originalFindOne;
});

const configure = () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.DIGILOCKER_CLIENT_ID = 'client-id';
  process.env.DIGILOCKER_CLIENT_SECRET = 'client-secret';
  process.env.DIGILOCKER_REDIRECT_URI = 'http://localhost:5000/api/digilocker/callback';
  process.env.DIGILOCKER_API_BASE_URL = 'https://official.example';
};

test('reports DigiLocker as unconfigured when official API credentials are missing', () => {
  delete process.env.DIGILOCKER_CLIENT_ID;
  delete process.env.DIGILOCKER_CLIENT_SECRET;
  delete process.env.DIGILOCKER_REDIRECT_URI;
  delete process.env.DIGILOCKER_API_BASE_URL;

  assert.equal(isConfigured(), false);
});

test('generates official authorization URL shape and validates signed OAuth state', () => {
  configure();

  const result = generateAuthorizationUrl({
    userId: 'user-1',
    resumeId: 'resume-1',
    templateId: 'modern',
  });
  const url = new URL(result.authorizationUrl);
  const payload = validateOAuthState(url.searchParams.get('state'));

  assert.equal(url.origin + url.pathname, 'https://official.example/oauth2/authorize');
  assert.equal(url.searchParams.get('response_type'), 'code');
  assert.equal(url.searchParams.get('client_id'), 'client-id');
  assert.equal(url.searchParams.get('scope'), 'openid profile documents');
  assert.equal(payload.userId, 'user-1');
  assert.equal(payload.resumeId, 'resume-1');
  assert.equal(payload.templateId, 'modern');
});

test('rejects invalid authorization state', () => {
  process.env.JWT_SECRET = 'test-secret';

  assert.throws(() => validateOAuthState('bad-state'), /Invalid or expired/);
});

test('handles token API errors safely', async () => {
  configure();
  global.fetch = async () => ({
    ok: false,
    status: 401,
    json: async () => ({ error_description: 'invalid client' }),
  });

  await assert.rejects(
    () => exchangeCodeForAccessToken('bad-code'),
    /invalid client/
  );
});

test('builds preview from authorized academic records without fabricating missing fields', () => {
  const preview = buildImportPreview([{
    institution: 'State University',
    degree: 'B.Tech',
    field: '',
    startDate: '',
    endDate: '2024',
    gpa: '',
  }]);

  assert.equal(preview.education.length, 1);
  assert.equal(preview.education[0].field, '');
  assert.equal(preview.partial, true);
  assert.equal(preview.unavailableFields.some((field) => field.key === 'gpa'), true);
});

test('builds preview from a valid import token and rejects user/resume mismatches', () => {
  process.env.JWT_SECRET = 'test-secret';
  const importToken = jwt.sign({
    userId: 'user-1',
    resumeId: 'resume-1',
    academicRecords: [{ institution: 'State University', degree: 'B.Tech' }],
  }, process.env.JWT_SECRET);

  const preview = getImportPreview({ userId: 'user-1', resumeId: 'resume-1', importToken });

  assert.equal(preview.education[0].institution, 'State University');
  assert.throws(
    () => getImportPreview({ userId: 'user-2', resumeId: 'resume-1', importToken }),
    /does not match/
  );
});

test('validates resume ownership before starting authorization', async () => {
  Resume.findOne = () => ({
    select: async () => ({ _id: 'resume-1', templateId: 'modern' }),
  });

  const resume = await validateResumeOwnership({ userId: 'user-1', resumeId: 'resume-1' });

  assert.equal(resume._id, 'resume-1');

  Resume.findOne = () => ({
    select: async () => null,
  });

  await assert.rejects(
    () => validateResumeOwnership({ userId: 'user-1', resumeId: 'missing' }),
    /Resume not found/
  );
});

test('confirmed import saves only authorized selected education and preserves existing records', async () => {
  process.env.JWT_SECRET = 'test-secret';
  const authorized = {
    institution: 'State University',
    degree: 'B.Tech',
    field: 'Computer Science',
    startDate: '2020',
    endDate: '2024',
    gpa: '8.7/10',
  };
  const injected = {
    institution: 'Fake University',
    degree: 'Invented Degree',
    field: '',
    startDate: '',
    endDate: '',
    gpa: '10/10',
  };
  const importToken = jwt.sign({
    userId: 'user-1',
    resumeId: 'resume-1',
    academicRecords: [authorized],
  }, process.env.JWT_SECRET);
  const resume = {
    sections: {
      education: [{
        institution: 'Existing College',
        degree: 'Diploma',
        field: 'Engineering',
        startDate: '2018',
        endDate: '2020',
        gpa: '',
      }],
    },
    saveCalled: false,
    async save() {
      this.saveCalled = true;
      return this;
    },
  };
  Resume.findOne = async () => resume;

  const result = await confirmImport({
    userId: 'user-1',
    resumeId: 'resume-1',
    importToken,
    selectedEducation: [authorized, injected],
  });

  assert.equal(result.sections.education.length, 2);
  assert.equal(result.sections.education[0].institution, 'Existing College');
  assert.equal(result.sections.education[1].institution, 'State University');
  assert.equal(result.sections.education.some((item) => item.institution === 'Fake University'), false);
  assert.equal(result.saveCalled, true);
});
