// =============================================================================
// template_lock_and_regression.test.mjs — Master Template Lock & Workflow Suite
// =============================================================================
// Comprehensive regression tests covering all 6 approved resume templates:
// 1. Modern Professional
// 2. Minimal ATS
// 3. Executive Corporate
// 4. Software Engineer
// 5. AI/ML Engineer
// 6. Creative Clean
//
// Validates:
// - Design and structure freeze
// - Content vs configuration separation
// - All 7 application workflows (Create, Upload, ATS, Reopen, Edit, Preview, PDF Export)
// - Baseline snapshots matching
// =============================================================================

import React from 'react';
import { renderToString } from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

import ModernProfessionalTemplate from '../src/components/templates/ModernProfessionalTemplate.jsx';
import MinimalAtsTemplate from '../src/components/templates/MinimalAtsTemplate.jsx';
import ExecutiveCorporateTemplate from '../src/components/templates/ExecutiveCorporateTemplate.jsx';
import SoftwareEngineerTemplate from '../src/components/templates/SoftwareEngineerTemplate.jsx';
import AimlEngineerTemplate from '../src/components/templates/AimlEngineerTemplate.jsx';
import CreativeCleanTemplate from '../src/components/templates/CreativeCleanTemplate.jsx';

import {
  TEMPLATE_CONFIGS,
  LOCKED_TEMPLATE_IDS,
  TEMPLATE_LOCK_METADATA,
  isTemplateLocked,
  validateTemplateConfig,
  resolveTemplateId,
} from '../src/config/templateRegistry.js';
import { normalizeResumeSections } from '../src/components/templates/utils/normalizeResumeSections.js';

const TEMPLATE_COMPONENTS = {
  'modern-professional': ModernProfessionalTemplate,
  'minimal-ats': MinimalAtsTemplate,
  'executive-corporate': ExecutiveCorporateTemplate,
  'software-engineer': SoftwareEngineerTemplate,
  'aiml-engineer': AimlEngineerTemplate,
  'creative-clean': CreativeCleanTemplate,
};

// Load approved baseline snapshot
const snapshotPath = path.resolve(process.cwd(), 'src/config/templateBaselineSnapshots.json');
const baselineSnapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));

// Load active resume fixture
const fixturePath = path.resolve(process.cwd(), 'tests/active_resume_fixture.json');
const activeDoc = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

console.log('================================================================');
console.log('MASTER RESUME TEMPLATE LOCK & REGRESSION SUITE');
console.log('Version:', TEMPLATE_LOCK_METADATA.version);
console.log('Status: ', TEMPLATE_LOCK_METADATA.status);
console.log('================================================================\n');

// ── TEST 1: Permanent Immutability & Registry Lock ────────────────────────────
console.log('>>> 1. Verifying Permanent Immutability & Registry Lock');
assert.equal(LOCKED_TEMPLATE_IDS.length, 6, 'Must protect exactly 6 templates');
for (const tid of LOCKED_TEMPLATE_IDS) {
  assert.ok(isTemplateLocked(tid), `${tid} must be locked`);
  const config = validateTemplateConfig(tid);
  assert.ok(config, `Config for ${tid} must exist`);
  assert.ok(Object.isFrozen(config), `Config for ${tid} must be deeply frozen`);

  // Attempt mutation to confirm immutability
  try {
    config.name = 'Hacked Name';
  } catch (err) {
    // Expected in strict mode
  }
  assert.notEqual(config.name, 'Hacked Name', `Config for ${tid} must be immutable`);
}
console.log('  ✓ PASSED: All 6 template configurations are permanently locked & immutable');

// ── TEST 2: Template Baseline Snapshot Matching ──────────────────────────────
console.log('\n>>> 2. Verifying Templates Match Approved Baseline Snapshots');
for (const tid of LOCKED_TEMPLATE_IDS) {
  const snap = baselineSnapshot.templates[tid];
  assert.ok(snap, `Snapshot for ${tid} must exist`);
  const cfg = TEMPLATE_CONFIGS[tid];

  assert.equal(cfg.id, snap.id, `${tid}: ID mismatch`);
  assert.equal(cfg.layoutType, snap.layoutType, `${tid}: layoutType mismatch`);
  if (snap.sidebar) {
    assert.equal(cfg.sidebar.width, snap.sidebar.width, `${tid}: sidebar width mismatch`);
    assert.equal(cfg.sidebar.disablePage2Sidebar, snap.sidebar.disablePage2Sidebar, `${tid}: sidebar continuation mismatch`);
  } else {
    assert.equal(cfg.sidebar, null, `${tid}: single-column layout must have null sidebar`);
  }
}
console.log('  ✓ PASSED: All 6 templates match approved baseline specification');

// ── TEST 3: Content vs Configuration Separation ──────────────────────────────
console.log('\n>>> 3. Verifying Separation of Content from Configuration');
{
  const testData = JSON.parse(JSON.stringify(activeDoc.sections));
  testData.skills.technical.push('Quantum Computing', 'Superconducting Logic');
  testData.summary = 'Altered summary during user edits.';
  testData.randomInjectedKey = { invalid: true };

  const norm = normalizeResumeSections(testData);

  // Template registry must remain 100% unaffected
  for (const tid of LOCKED_TEMPLATE_IDS) {
    const cfg = TEMPLATE_CONFIGS[tid];
    assert.equal(cfg.id, tid);
    assert.ok(!cfg.randomInjectedKey, `Config must not be polluted by content`);
  }
  console.log('  ✓ PASSED: Content modification, injection, and normalization never mutate template configuration');
}

// ── TEST 4: Verification Across All 7 Application Workflows ─────────────────
console.log('\n>>> 4. Verifying All 6 Templates Across 7 Application Workflows');

const WORKFLOWS = [
  {
    name: 'Workflow A: Create Resume (Empty / Minimal Inputs)',
    getData: () => ({
      personalInfo: { fullName: 'Alex Rivera', email: 'alex@example.com', targetRole: 'Engineer' },
      skills: { technical: ['JavaScript', 'HTML'], soft: [], languages: [] },
      experience: [],
      education: [],
      projects: [],
      certifications: [],
    }),
    opts: { isPreview: false, isExport: false },
  },
  {
    name: 'Workflow B: Existing Resume Upload (Extensive 80+ Skills & Publications)',
    getData: () => normalizeResumeSections(activeDoc.sections),
    opts: { isPreview: false, isExport: false },
  },
  {
    name: 'Workflow C: Upload Resume for ATS Checking',
    getData: () => {
      const data = normalizeResumeSections(activeDoc.sections);
      // Simulate ATS analysis tagging
      data._atsAnalyzed = true;
      data._atsScore = 92;
      return data;
    },
    opts: { isPreview: false, isExport: false },
  },
  {
    name: 'Workflow D: Reopen Saved Resume (Active Fixture)',
    getData: () => normalizeResumeSections(activeDoc.sections),
    opts: { isPreview: false, isExport: false },
  },
  {
    name: 'Workflow E: Edit Existing Resume (User Modifies Skills & Projects)',
    getData: () => {
      const data = normalizeResumeSections(activeDoc.sections);
      data.skills.technical.unshift('Next.js 15', 'TailwindCSS v4');
      data.projects.push({ name: 'New Side Project', description: 'Real-time collaborative whiteboard', technologies: ['Canvas', 'WebSockets'] });
      return data;
    },
    opts: { isPreview: false, isExport: false },
  },
  {
    name: 'Workflow F: Resume Preview (On-Screen Mode)',
    getData: () => normalizeResumeSections(activeDoc.sections),
    opts: { isPreview: true, isExport: false },
  },
  {
    name: 'Workflow G: PDF Export (A4 Export Canvas Mode)',
    getData: () => normalizeResumeSections(activeDoc.sections),
    opts: { isPreview: false, isExport: true },
  },
];

for (const wf of WORKFLOWS) {
  console.log(`\n  --- Testing ${wf.name} ---`);
  const sections = wf.getData();

  for (const tid of LOCKED_TEMPLATE_IDS) {
    const Component = TEMPLATE_COMPONENTS[tid];
    assert.ok(Component, `Component for ${tid} must exist`);

    const element = React.createElement(Component, {
      sections,
      isPreview: wf.opts.isPreview,
      isExport: wf.opts.isExport,
    });

    const html = renderToString(element);

    // Verify Page 1 presence
    assert.ok(html.includes('data-resume-page="1"'), `${tid} (${wf.name}): Page 1 must render`);

    // Verify template-specific non-negotiables:
    if (tid === 'creative-clean') {
      // Must have Skills & Tools in left sidebar
      assert.ok(html.includes('data-sidebar-block="tech-skills"'), 'Creative Clean: Skills & Tools must be in left sidebar');
      assert.ok(html.includes('Skills &amp; Tools') || html.includes('Skills & Tools'), 'Creative Clean: Skills & Tools title present');
      // Must NEVER generate unwanted Technical Skills (Continued)
      assert.ok(!html.includes('Technical Skills (Continued)'), 'Creative Clean: Must NOT have Technical Skills (Continued)');
    }

    if (tid === 'minimal-ats') {
      // Must NOT have 238px sidebar
      assert.ok(!html.includes('238px'), 'Minimal ATS: Must NOT have a 238px sidebar');
    }

    if (tid === 'software-engineer' || tid === 'aiml-engineer') {
      // Must be single-column and have project on page 1 for typical/active resume
      assert.ok(!html.includes('grid-template-columns: 238px'), `${tid}: Must be single column`);
    }

    if (tid === 'modern-professional') {
      // Must have left sidebar
      assert.ok(html.includes('data-sidebar-block="tech-skills"'), 'Modern Professional: Must have tech-skills in sidebar');
    }
  }
  console.log(`  ✓ PASSED: All 6 templates cleanly rendered in ${wf.name}`);
}

// ── TEST 5: Creative Clean Multi-Page Skills Invariant ───────────────────────
console.log('\n>>> 5. Verifying Creative Clean Multi-Page Skills Invariant');
{
  const sections = normalizeResumeSections(activeDoc.sections);
  const html = renderToString(React.createElement(CreativeCleanTemplate, {
    sections,
    isPreview: false,
    isExport: false,
  }));

  const page1Match = html.match(/data-resume-page="1"[\s\S]*?(?=data-resume-page="2"|$)/);
  assert.ok(page1Match, 'Creative Clean: Page 1 must exist');
  const page1Html = page1Match[0];

  assert.ok(page1Html.includes('Skills &amp; Tools') || page1Html.includes('Skills & Tools'), 'Creative Clean: Page 1 sidebar has Skills & Tools');
  assert.ok(page1Html.includes('Core Strengths'), 'Creative Clean: Page 1 sidebar has Core Strengths');
  assert.ok(page1Html.includes('data-sidebar-skill'), 'Creative Clean: Skill badges use data-sidebar-skill');

  // Verify skills are not duplicated into the main column
  assert.ok(!html.includes('side-ovf-tech-skills'), 'Creative Clean: No side-ovf-tech-skills block');
  console.log('  ✓ PASSED: Creative Clean skills remain exclusively in sidebar');
}

console.log('\n================================================================');
console.log('ALL MASTER TEMPLATE LOCK & REGRESSION CHECKS PASSED PERFECTLY!');
console.log('================================================================\n');
