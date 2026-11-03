import assert from 'node:assert/strict';
import test from 'node:test';
import Resume from '../models/Resume.model.js';
import { validateResumeId } from './resumeId.middleware.js';
import { createResume, getResumeById } from '../services/resume.service.js';

const createResponse = () => {
  const response = {};
  response.status = (statusCode) => {
    response.statusCode = statusCode;
    return response;
  };
  response.json = (body) => {
    response.body = body;
    return response;
  };
  return response;
};

test('rejects malformed resume IDs before a database query', () => {
  const response = createResponse();
  let nextCalled = false;

  validateResumeId({}, response, () => { nextCalled = true; }, 'invalid123');

  assert.equal(nextCalled, false);
  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, { success: false, message: 'Invalid Resume ID' });
});

test('returns a 404 error when a valid resume ID does not exist', async () => {
  const originalFindOne = Resume.findOne;
  Resume.findOne = () => ({ select: async () => null });

  try {
    await assert.rejects(
      getResumeById('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'),
      (error) => error.statusCode === 404 && error.message === 'Resume not found.'
    );
  } finally {
    Resume.findOne = originalFindOne;
  }
});

test('rejects blank resume title or target role before creating a record', async () => {
  const originalCreate = Resume.create;
  let createCalled = false;
  Resume.create = async () => { createCalled = true; };

  try {
    await assert.rejects(
      createResume('507f1f77bcf86cd799439012', { title: '   ', targetRole: 'Developer' }),
      (error) => error.statusCode === 400 && error.message === 'Resume title and target role are required.'
    );
    await assert.rejects(
      createResume('507f1f77bcf86cd799439012', { title: 'Resume', targetRole: '   ' }),
      (error) => error.statusCode === 400 && error.message === 'Resume title and target role are required.'
    );
    assert.equal(createCalled, false);
  } finally {
    Resume.create = originalCreate;
  }
});
