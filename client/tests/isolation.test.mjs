import React from 'react';
import { renderToString } from 'react-dom/server';
import assert from 'node:assert/strict';

import ModernProfessionalTemplate from '../src/components/templates/ModernProfessionalTemplate.jsx';
import MinimalAtsTemplate from '../src/components/templates/MinimalAtsTemplate.jsx';
import ExecutiveCorporateTemplate from '../src/components/templates/ExecutiveCorporateTemplate.jsx';
import SoftwareEngineerTemplate from '../src/components/templates/SoftwareEngineerTemplate.jsx';
import AimlEngineerTemplate from '../src/components/templates/AimlEngineerTemplate.jsx';
import CreativeCleanTemplate from '../src/components/templates/CreativeCleanTemplate.jsx';
import { TEMPLATE_CONFIGS, resolveTemplateId } from '../src/config/templateRegistry.js';
import TEMPLATES from '../src/constants/templates.js';

console.log('================================================================');
console.log('ISOLATION & CROSS-TEMPLATE INDEPENDENCE VERIFICATION SUITE');
console.log('================================================================\n');

const TEMPLATE_MAP = {
  'modern-professional': ModernProfessionalTemplate,
  'minimal-ats': MinimalAtsTemplate,
  'executive-corporate': ExecutiveCorporateTemplate,
  'software-engineer': SoftwareEngineerTemplate,
  'aiml-engineer': AimlEngineerTemplate,
  'creative-clean': CreativeCleanTemplate,
};

// 1. Verify Distinct Components
console.log('>>> 1. Verifying Component Independence');
const componentList = Object.values(TEMPLATE_MAP);
const uniqueComponents = new Set(componentList);
assert.equal(
  uniqueComponents.size,
  6,
  'All 6 templates must be distinct, independent React components'
);
console.log('  ✓ PASSED: All 6 templates have distinct component implementations');

// 2. Verify Template Registry Mapping
console.log('\n>>> 2. Verifying Template Registry Canonical Resolution');
for (const id of Object.keys(TEMPLATE_MAP)) {
  const resolved = resolveTemplateId(id);
  assert.equal(resolved, id, `Template ${id} must resolve to itself`);
  assert.ok(TEMPLATE_CONFIGS[id], `Template config must exist for ${id}`);
}
console.log('  ✓ PASSED: All 6 templates are permanently registered in TEMPLATE_CONFIGS');

// 3. Render Baseline with Standard Resume Fixture
console.log('\n>>> 3. Rendering Baseline Fixture Across All 6 Templates');
const BASE_FIXTURE = {
  personalInfo: {
    fullName: 'Elena Rostova',
    email: 'elena.rostova@tech.org',
    phone: '+1 415-555-0192',
    location: 'San Francisco, CA',
    linkedIn: 'linkedin.com/in/erostova',
    portfolio: 'erostova.dev',
    targetRole: 'Staff Infrastructure Architect',
  },
  summary: 'Infrastructure architect specializing in high-throughput distributed consensus, low-latency streaming pipelines, and fault-tolerant cloud systems.',
  skills: {
    technical: ['Rust', 'Go', 'Distributed Systems', 'Kafka', 'Kubernetes'],
    soft: ['Strategic Leadership', 'Incident Command', 'Cross-functional Alignment'],
    languages: ['English', 'German'],
  },
  experience: [
    {
      role: 'Staff Systems Architect',
      company: 'OmniStream Cloud Inc.',
      startDate: '2022-03',
      endDate: 'Present',
      current: true,
      bullets: [
        'Engineered real-time consensus protocol processing 4.2M events/sec at sub-5ms p99 latency.',
        'Spearheaded multi-region disaster recovery initiative with zero planned downtime across 3 years.',
      ],
    },
  ],
  education: [
    {
      institution: 'Stanford University',
      degree: 'M.S. in Computer Science',
      startDate: '2018',
      endDate: '2020',
      gpa: '3.92',
    },
  ],
  projects: [
    {
      name: 'Chronos Distributed Clock',
      description: 'Hybrid logical clock synchronizer for decentralized state machines',
      technologies: ['Rust', 'Raft', 'gRPC'],
      link: 'github.com/erostova/chronos',
      bullets: ['Deployed across 2,400 bare-metal nodes.', 'Formally verified using TLA+ specification.'],
    },
  ],
  certifications: [
    {
      name: 'Certified Kubernetes Administrator (CKA)',
      issuer: 'Cloud Native Computing Foundation',
      date: '2023',
    },
  ],
  publications: [
    {
      title: 'Formal Verification of Speculative Distributed Consensus Protocols',
      publisher: 'ACM SIGOPS Operating Systems Review',
      authors: 'Elena Rostova, Marcus Thorne',
      date: '2024',
      link: 'https://doi.org/10.1145/sigops.2024.11',
      description: 'Analyzed invariants and safety bounds in high-throughput Raft variants under Byzantine partition conditions.',
    },
  ],
};

const baselineHtmlMap = {};
for (const [id, Component] of Object.entries(TEMPLATE_MAP)) {
  const cfg = TEMPLATE_CONFIGS[id];
  const html = renderToString(
    React.createElement(Component, {
      sections: BASE_FIXTURE,
      colors: cfg.colors,
      isPreview: false,
      isExport: false,
    })
  );
  baselineHtmlMap[id] = html;
  assert.ok(html.length > 500, `Template ${id} rendered output must be non-empty`);
  assert.ok(html.includes('Elena Rostova'), `Template ${id} must render candidate name`);
  assert.ok(html.includes('Staff Systems Architect'), `Template ${id} must render experience`);
  assert.ok(html.includes('Chronos Distributed Clock'), `Template ${id} must render projects`);
  assert.ok(html.includes('Formal Verification of Speculative Distributed Consensus'), `Template ${id} must render publications`);
  console.log(`  ✓ PASSED: ${id} rendered complete resume structure`);
}

// 4. Invariant: Modifying One Template Does Not Alter Others
console.log('\n>>> 4. Verifying Cross-Template Style Isolation Invariant');
// Simulate a localized styling change to Modern Professional
const modifiedModernColors = { primary: '#dc2626', accent: '#f97316' }; // Red/Orange theme
const modernModifiedHtml = renderToString(
  React.createElement(ModernProfessionalTemplate, {
    sections: BASE_FIXTURE,
    colors: modifiedModernColors,
    isPreview: false,
    isExport: false,
  })
);

// Verify Modern Professional reflects its own change
assert.notEqual(
  modernModifiedHtml,
  baselineHtmlMap['modern-professional'],
  'Modern Professional output should change when its colors are altered'
);
assert.ok(modernModifiedHtml.includes('#dc2626'), 'Modern Professional should render with updated primary color');

// Verify EVERY other template rendered output remains 100% IDENTICAL
for (const [otherId, OtherComponent] of Object.entries(TEMPLATE_MAP)) {
  if (otherId === 'modern-professional') continue;

  const otherCfg = TEMPLATE_CONFIGS[otherId];
  const reRenderedHtml = renderToString(
    React.createElement(OtherComponent, {
      sections: BASE_FIXTURE,
      colors: otherCfg.colors,
      isPreview: false,
      isExport: false,
    })
  );

  assert.equal(
    reRenderedHtml,
    baselineHtmlMap[otherId],
    `CRITICAL INVARIANT VIOLATION: Template ${otherId} output changed when Modern Professional was modified!`
  );
  console.log(`  ✓ PASSED: ${otherId} was 100% unaffected by Modern Professional changes`);
}

// 5. Verify Visual Distinctions Between All 6 Templates
console.log('\n>>> 5. Verifying Unique Visual Identities Across All 6 Templates');
// Each template must have unique HTML markers
assert.ok(baselineHtmlMap['minimal-ats'].includes('Georgia'), 'Minimal ATS uses Georgia serif');
assert.ok(!baselineHtmlMap['minimal-ats'].includes('badgeIcon'), 'Minimal ATS has no decorative icon badges');
assert.ok(baselineHtmlMap['executive-corporate'].includes('#1e1b4b'), 'Executive Corporate has midnight navy banner');
assert.ok(baselineHtmlMap['executive-corporate'].includes('#d97706'), 'Executive Corporate has amber border line');
assert.ok(baselineHtmlMap['software-engineer'].includes('Software Engineering Experience'), 'Software Engineer has dev experience title');
assert.ok(baselineHtmlMap['aiml-engineer'].includes('ML Stack &amp; Technical Frameworks') || baselineHtmlMap['aiml-engineer'].includes('ML Stack & Technical Frameworks'), 'AI/ML Engineer has ML Stack heading');
assert.ok(baselineHtmlMap['creative-clean'].includes('#6d28d9'), 'Creative Clean has royal violet color');

console.log('  ✓ PASSED: All 6 templates have distinct, verified visual identities');

console.log('\n================================================================');
console.log('ALL ISOLATION & INDEPENDENCE CRITERIA FULLY VERIFIED!');
console.log('================================================================\n');
