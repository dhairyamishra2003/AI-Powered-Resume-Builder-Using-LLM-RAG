import React from 'react';
import { renderToString } from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

import CreativeCleanTemplate from '../src/components/templates/CreativeCleanTemplate.jsx';
import { normalizeResumeSections } from '../src/components/templates/utils/normalizeResumeSections.js';

console.log('================================================================');
console.log('VERIFYING ACTIVE RESUME DATA & CREATIVE CLEAN RENDERING');
console.log('================================================================\n');

// 1. Read the active resume fixture saved directly from MongoDB
const fixturePath = path.resolve(process.cwd(), 'tests/active_resume_fixture.json');
const rawDoc = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

console.log('>>> 1. Loaded Active Resume Document');
console.log('  Title:', rawDoc.title);
console.log('  Template ID:', rawDoc.templateId);
console.log('  Projects in DB:', rawDoc.sections.projects.map((p) => p.name));
console.log('  Publications in DB:', rawDoc.sections.publications.map((p) => p.title));

assert.equal(rawDoc.sections.publications.length, 1, 'Active resume must have 1 publication');
assert.equal(rawDoc.sections.publications[0].title, 'Multi-Agent Collaboration Systems Using Agentic AI for Intelligent Task Automation');
assert.equal(rawDoc.sections.publications[0].publisher, 'Independent Research');
assert.ok(rawDoc.sections.publications[0].description.includes('Studied multi-agent collaboration architectures'));
console.log('  ✓ PASSED: Active resume in DB has research paper saved under sections.publications');

// 2. Normalization check (simulates loadResume in Builder)
console.log('\n>>> 2. Verifying Sections Normalization via loadResume');
const normalizedSections = normalizeResumeSections(rawDoc.sections);
assert.ok(normalizedSections.projects.some((p) => p.name.includes('Snap & Study')), 'Projects must contain Snap & Study');
assert.ok(!normalizedSections.projects.some((p) => p.name.includes('Multi-Agent Collaboration Systems')), 'Projects must not duplicate Research Paper');
assert.equal(normalizedSections.publications.length, 1, 'Publications must contain 1 entry');
assert.equal(normalizedSections.publications[0].title, 'Multi-Agent Collaboration Systems Using Agentic AI for Intelligent Task Automation');
assert.equal(normalizedSections.publications[0].publisher, 'Independent Research');
assert.ok(normalizedSections.publications[0].description.includes('Studied multi-agent collaboration architectures'));
console.log('  ✓ PASSED: Normalized sections retain Research Paper in publications without duplicate in projects');

// 3. Render On-Screen Preview
console.log('\n>>> 3. Rendering Creative Clean On-Screen Preview (isPreview=false, isExport=false)');
const previewHtml = renderToString(React.createElement(CreativeCleanTemplate, {
  sections: normalizedSections,
  colors: { primary: '#6d28d9', accent: '#ec4899' },
  isPreview: false,
  isExport: false,
}));

const snapIdx = previewHtml.indexOf('Snap &amp; Study');
const pubTitleIdx = previewHtml.indexOf('Multi-Agent Collaboration Systems');
const pubPublisherIdx = previewHtml.indexOf('Independent Research');
const pubDescIdx = previewHtml.indexOf('Studied multi-agent collaboration architectures');
const certIdx = previewHtml.indexOf('Certifications');

console.log('  Snap & Study Index:', snapIdx);
console.log('  Research Paper Title Index:', pubTitleIdx);
console.log('  Research Paper Publisher Index:', pubPublisherIdx);
console.log('  Research Paper Description Index:', pubDescIdx);
console.log('  Certifications Section Index:', certIdx);

assert.ok(snapIdx !== -1, 'Preview must render Snap & Study project');
assert.ok(pubTitleIdx !== -1, 'Preview must render Research Paper title');
assert.ok(pubPublisherIdx !== -1, 'Preview must render publisher "Independent Research"');
assert.ok(pubDescIdx !== -1, 'Preview must render research description');
assert.ok(certIdx !== -1, 'Preview must render Certifications');

assert.ok(snapIdx < pubTitleIdx, `Preview: Snap & Study (${snapIdx}) must appear BEFORE Research Paper (${pubTitleIdx})`);
assert.ok(pubTitleIdx < certIdx, `Preview: Research Paper (${pubTitleIdx}) must appear BEFORE Certifications (${certIdx})`);
console.log('  ✓ PASSED: Preview correctly renders: Snap & Study → Research Papers & Publications → Certifications');

// 4. Render Downloaded PDF Canvas (isExport=true)
console.log('\n>>> 4. Rendering Creative Clean PDF Export Container (isPreview=false, isExport=true)');
const exportHtml = renderToString(React.createElement(CreativeCleanTemplate, {
  sections: normalizedSections,
  colors: { primary: '#6d28d9', accent: '#ec4899' },
  isPreview: false,
  isExport: true,
}));

const expSnapIdx = exportHtml.indexOf('Snap &amp; Study');
const expPubIdx = exportHtml.indexOf('Multi-Agent Collaboration Systems');
const expCertIdx = exportHtml.indexOf('Certifications');

assert.ok(expSnapIdx !== -1, 'PDF Canvas must render Snap & Study project');
assert.ok(expPubIdx !== -1, 'PDF Canvas must render Research Paper title');
assert.ok(expCertIdx !== -1, 'PDF Canvas must render Certifications');
assert.ok(expSnapIdx < expPubIdx, 'PDF Canvas: Snap & Study must appear BEFORE Research Paper');
assert.ok(expPubIdx < expCertIdx, 'PDF Canvas: Research Paper must appear BEFORE Certifications');
console.log('  ✓ PASSED: PDF Canvas correctly renders: Snap & Study → Research Papers & Publications → Certifications');

console.log('\n================================================================');
console.log('ALL VERIFICATION CHECKS FOR ACTIVE RESUME & PDF PASSED!');
console.log('================================================================\n');
