import assert from 'node:assert/strict';
import test from 'node:test';
import Resume from '../models/Resume.model.js';
import { chat } from './ai.controller.js';

const response = () => ({
  status(statusCode) { this.statusCode = statusCode; return this; },
  json(body) { this.body = body; return this; },
});

test('chat rejects an invalid resume ID before creating history or calling AI', async () => {
  const res = response();
  await chat({ body: { resumeId: 'invalid123', message: 'Help me' }, user: { _id: '507f1f77bcf86cd799439012' } }, res, assert.fail);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { success: false, message: 'Invalid Resume ID' });
});

test('chat returns 404 when the authenticated user does not own the requested resume', async () => {
  const originalFindOne = Resume.findOne;
  Resume.findOne = async () => null;
  const res = response();

  try {
    await chat({ body: { resumeId: '507f1f77bcf86cd799439011', message: 'Help me' }, user: { _id: '507f1f77bcf86cd799439012' } }, res, assert.fail);
    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { success: false, message: 'Resume not found.' });
  } finally {
    Resume.findOne = originalFindOne;
  }
});
