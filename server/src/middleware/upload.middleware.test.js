import test from 'node:test';
import assert from 'node:assert/strict';
import { hasPdfSignature } from './upload.middleware.js';

test('recognizes a PDF header at the beginning of an upload', () => {
  assert.equal(hasPdfSignature(Buffer.from('%PDF-1.7\nexample')), true);
});

test('recognizes a PDF header within the permitted leading bytes', () => {
  assert.equal(hasPdfSignature(Buffer.concat([Buffer.alloc(16), Buffer.from('%PDF-1.4')])), true);
});

test('rejects non-PDF and empty upload data', () => {
  assert.equal(hasPdfSignature(Buffer.from('plain text')), false);
  assert.equal(hasPdfSignature(Buffer.alloc(0)), false);
  assert.equal(hasPdfSignature(null), false);
});
