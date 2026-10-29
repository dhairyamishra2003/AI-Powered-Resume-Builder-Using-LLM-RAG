import test from 'node:test';
import assert from 'node:assert/strict';
import { importDocument, mergeImportedSections, validateImportedSections } from './resumeImport.js';

test('merges complementary AI and fallback data without losing later resume sections', () => {
  const ai = {
    personalInfo: { fullName: 'Asha Patel', email: 'asha@example.com' },
    skills: { technical: ['React'] },
    projects: [{ name: 'Portfolio', bullets: ['Built accessible pages'] }],
  };
  const fallback = {
    personalInfo: { fullName: 'Candidate', phone: '+91 98765 43210', linkedIn: 'https://linkedin.com/in/asha' },
    skills: { technical: ['React', 'Node.js'], frameworks: ['Express'] },
    projects: [{ name: 'Portfolio', technologies: ['React'], bullets: ['Deployed the site'] }],
    certifications: [{ name: 'AWS Certified Cloud Practitioner', issuer: 'AWS' }],
    publications: [{ title: 'Reliable imports' }],
  };

  const sections = validateImportedSections(mergeImportedSections(ai, fallback));
  assert.equal(sections.personalInfo.fullName, 'Asha Patel');
  assert.equal(sections.personalInfo.phone, '+91 98765 43210');
  assert.deepEqual(sections.skills.technical, ['React', 'Node.js']);
  assert.deepEqual(sections.skills.frameworks, ['Express']);
  assert.equal(sections.projects.length, 1);
  assert.deepEqual(sections.projects[0].bullets, ['Built accessible pages', 'Deployed the site']);
  assert.equal(sections.certifications[0].name, 'AWS Certified Cloud Practitioner');
  assert.equal(sections.publications[0].title, 'Reliable imports');
});

test('retains text after the former model-input cutoff for deterministic recovery', async () => {
  const tail = 'CERTIFICATIONS\nAWS Certified Cloud Practitioner';
  const imported = await importDocument({
    originalname: 'long-resume.txt',
    buffer: Buffer.from(`${'x'.repeat(30000)}\n${tail}`),
  });
  assert.ok(imported.text.endsWith(tail));
});
