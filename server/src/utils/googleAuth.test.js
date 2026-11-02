import 'dotenv/config';
import assert from 'node:assert/strict';
import test from 'node:test';
import { verifyGoogleToken } from '../config/google.config.js';

test('verifyGoogleToken rejects missing credential with status 400', async () => {
  await assert.rejects(
    async () => {
      await verifyGoogleToken('');
    },
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.equal(err.code, 'MISSING_CREDENTIAL');
      return true;
    }
  );
});

test('verifyGoogleToken rejects invalid token with status 401', async () => {
  await assert.rejects(
    async () => {
      await verifyGoogleToken('invalid-jwt-token-string');
    },
    (err) => {
      assert.equal(err.statusCode, 401);
      assert.equal(err.code, 'INVALID_GOOGLE_TOKEN');
      return true;
    }
  );
});
