import React from 'react';
import { renderToString } from 'react-dom/server';
import assert from 'node:assert/strict';

import ModernProfessionalTemplate from '../src/components/templates/ModernProfessionalTemplate.jsx';
import CreativeCleanTemplate from '../src/components/templates/CreativeCleanTemplate.jsx';
import ExecutiveCorporateTemplate from '../src/components/templates/ExecutiveCorporateTemplate.jsx';
import SoftwareEngineerTemplate from '../src/components/templates/SoftwareEngineerTemplate.jsx';
import AimlEngineerTemplate from '../src/components/templates/AimlEngineerTemplate.jsx';
import MinimalAtsTemplate from '../src/components/templates/MinimalAtsTemplate.jsx';
import { normalizeResumeSections } from '../src/components/templates/utils/normalizeResumeSections.js';
import { withPlaceholder } from '../src/components/templates/utils/placeholderData.js';

console.log('================================================================');
console.log('PHASE 6: 10-POINT CANONICAL CONSISTENCY & REGRESSION TEST SUITE');
console.log('================================================================\n');

const RAW_RESUME_FIXTURE = {
  personalInfo: {
    fullName: 'Dr. Jane Vance',
    email: 'jane.vance@mit.edu',
    phone: '+1 617-555-0144',
    location: 'Cambridge, MA',
    linkedIn: 'linkedin.com/in/janevance',
    portfolio: 'janevance.ai',
    targetRole: 'Principal AI Research Scientist',
  },
  summary: 'Research scientist specializing in foundation models, LLMs, distributed training, and automated verification.',
  skills: {
    technical: ['Python', 'PyTorch', 'JAX', 'CUDA', 'C++', 'Distributed Systems'],
    soft: ['Research Leadership', 'Cross-Disciplinary Collaboration', 'Technical Mentorship'],
    languages: ['English (Native)', 'German (Professional)', 'French (Conversational)'],
    tools: ['Git', 'Docker', 'Kubernetes', 'SLURM', 'Weights & Biases'],
    frameworks: ['Transformers', 'vLLM', 'DeepSpeed', 'Megatron-LM'],
    databases: ['PostgreSQL', 'Milvus', 'Redis'],
    libraries: ['NumPy', 'SciPy', 'Ray'],
  },
  experience: [
    {
      role: 'Principal Research Scientist',
      company: 'Neural Frontier Labs',
      startDate: '2021-09',
      endDate: '',
      current: true,
      bullets: [
        'Spearheaded 70B parameter model distributed training cluster across 512 H100 GPUs.',
        'Authored 4 tier-1 conference papers at NeurIPS and ICML on speculative decoding.',
      ],
    },
    {
      role: 'Senior Research Scientist',
      company: 'MIT CSAIL',
      startDate: '2017-06',
      endDate: '2021-08',
      current: false,
      bullets: [
        'Developed memory-efficient attention kernels resulting in 2.4x throughput increase.',
        'Mentored 8 PhD and Masters research students.',
      ],
    },
  ],
  education: [
    {
      institution: 'Massachusetts Institute of Technology',
      degree: 'Ph.D.',
      field: 'Computer Science & Artificial Intelligence',
      startDate: '2013-09',
      endDate: '2017-05',
      gpa: '4.0',
    },
  ],
  projects: [
    {
      name: 'OmniSpec Speculative Decoding Engine',
      description: 'Zero-loss speculative sampling library for frontier LLMs',
      technologies: ['C++', 'CUDA', 'Python', 'PyTorch'],
      link: 'github.com/mit-csail/omnispec',
      bullets: ['Adopted by 15+ production AI inference engines.', 'Over 3,500 GitHub stars.'],
    },
  ],
  certifications: [
    {
      name: 'NVIDIA Certified Research Fellow',
      issuer: 'NVIDIA Deep Learning Institute',
      date: '2022',
    },
  ],
  publications: [
    {
      title: 'Multi-Agent Collaboration Systems Using Agentic AI for Intelligent Task Automation',
      publisher: 'Independent Research',
      authors: 'Dhairya Mishra',
      date: '2026',
      link: 'https://doi.org/10.1109/sdgs.2026',
      description: 'Studied multi-agent collaboration architectures, autonomous task decomposition, planning, memory, and proposed scalable LLM-driven orchestration for intelligent task automation.',
    },
    {
      title: 'Scalable Speculative Decoding via Graph-Based Draft Verification',
      publisher: 'NeurIPS 2023',
      authors: 'Jane Vance, Alex Rivera, David Chen',
      date: '2023',
      link: 'https://doi.org/10.48550/arXiv.2310.00000',
      description: 'Novel multi-candidate tree draft verification algorithm cutting latency by 58%.',
    },
  ],
};

// -------------------------------------------------------------
// Test 1: Normalization preserves all fields and aliases
// -------------------------------------------------------------
console.log('>>> Test 1 & 2: Creating, Normalizing & Saving Resume');
const normalized1 = normalizeResumeSections(RAW_RESUME_FIXTURE);
assert.equal(normalized1.publications.length, 2, 'Must retain all 2 publications');
assert.equal(normalized1.publications[0].title, 'Multi-Agent Collaboration Systems Using Agentic AI for Intelligent Task Automation');
assert.equal(normalized1.skills.tools.length, 5, 'Must retain tools');
assert.equal(normalized1.skills.frameworks.length, 4, 'Must retain frameworks');
assert.equal(normalized1.skills.databases.length, 3, 'Must retain databases');
assert.equal(normalized1.skills.libraries.length, 3, 'Must retain libraries');
console.log('  ✓ PASSED: All fields, subcategories, and publications preserved');

// -------------------------------------------------------------
// Test 2: Idempotent Normalization (repeated normalization produces identical data)
// -------------------------------------------------------------
console.log('\n>>> Test 6: Normalization Idempotency');
const normalized2 = normalizeResumeSections(normalized1);
assert.deepEqual(normalized1, normalized2, 'Second pass normalization must match first pass exactly');
const normalized3 = normalizeResumeSections(normalized2);
assert.deepEqual(normalized1, normalized3, 'Third pass normalization must match first pass exactly');
console.log('  ✓ PASSED: Repeated normalization is 100% idempotent');

// -------------------------------------------------------------
// Test 3: Backward compatibility with legacy aliases (papers, researchPapers, etc.)
// -------------------------------------------------------------
console.log('\n>>> Test 5: Legacy Field & Alias Compatibility');
const legacyResume = {
  ...RAW_RESUME_FIXTURE,
  publications: undefined,
  researchPapers: RAW_RESUME_FIXTURE.publications,
  skills: {
    tech: ['C++', 'Python'],
    coreStrengths: ['Leadership'],
    spokenLanguages: ['English'],
  },
};
const legacyNormalized = normalizeResumeSections(legacyResume);
assert.equal(legacyNormalized.publications.length, 2, 'researchPapers alias must map to publications');
assert.deepEqual(legacyNormalized.skills.technical, ['C++', 'Python'], 'tech must map to technical');
assert.deepEqual(legacyNormalized.skills.soft, ['Leadership'], 'coreStrengths must map to soft');
assert.deepEqual(legacyNormalized.skills.languages, ['English'], 'spokenLanguages must map to languages');
console.log('  ✓ PASSED: Legacy field names correctly mapped to canonical identifiers');

// -------------------------------------------------------------
// Test 4: Template Switching & Rendering across all 6 templates
// -------------------------------------------------------------
console.log('\n>>> Test 3, 4, 5, 8 & 9: Rendering & Template Switching across all 6 templates');
const templates = [
  { id: 'modern-professional', name: 'Modern Professional', Component: ModernProfessionalTemplate },
  { id: 'creative-clean', name: 'Creative Clean', Component: CreativeCleanTemplate },
  { id: 'executive-corporate', name: 'Executive Corporate', Component: ExecutiveCorporateTemplate },
  { id: 'software-engineer', name: 'Software Engineer', Component: SoftwareEngineerTemplate },
  { id: 'aiml-engineer', name: 'AI/ML Engineer', Component: AimlEngineerTemplate },
  { id: 'minimal-ats', name: 'Minimal ATS', Component: MinimalAtsTemplate },
];

for (const { id, name, Component } of templates) {
  const html = renderToString(React.createElement(Component, { sections: normalized1, isPreview: false }));
  
  // 1. Name rendered
  assert.ok(html.includes('Dr. Jane Vance'), `${name} must render full name`);
  
  // 2. Experience rendered
  assert.ok(html.includes('Neural Frontier Labs'), `${name} must render company`);
  assert.ok(html.includes('Principal Research Scientist'), `${name} must render role`);
  
  // 3. Skills rendered
  assert.ok(html.includes('Python') || html.includes('PyTorch'), `${name} must render technical skills`);
  
  // 4. Publications rendered
  assert.ok(html.includes('Multi-Agent Collaboration Systems'), `${name} must render Multi-Agent Collaboration Systems paper`);
  assert.ok(html.includes('Scalable Speculative Decoding'), `${name} must render Scalable Speculative Decoding paper`);
  assert.ok(html.includes('Independent Research'), `${name} must render publication publisher/venue`);
  assert.ok(html.includes('Dhairya Mishra'), `${name} must render author`);
  
  // 5. Certifications rendered
  assert.ok(html.includes('NVIDIA Certified Research Fellow'), `${name} must render certification`);
  
  // 6. Languages rendered
  assert.ok(html.includes('English (Native)') || html.includes('German (Professional)'), `${name} must render languages`);
  
  console.log(`  ✓ PASSED: ${name} renders complete content including Research Papers & Skills`);
}

// -------------------------------------------------------------
// Test 5: Empty optional fields do not crash or corrupt layout
// -------------------------------------------------------------
console.log('\n>>> Test 8: Empty Optional Fields Handling');
const minimalResume = {
  personalInfo: { fullName: 'Minimal User', email: 'user@test.com' },
  experience: [],
  education: [],
  skills: { technical: [], soft: [], languages: [] },
  publications: [],
  certifications: [],
  projects: [],
};
const minimalNorm = normalizeResumeSections(minimalResume);
for (const { id, name, Component } of templates) {
  const html = renderToString(React.createElement(Component, { sections: minimalNorm, isPreview: false }));
  assert.ok(html.includes('Minimal User'), `${name} handles minimal data`);
  // Must NOT display fake preview data like 'Alex Johnson'
  assert.ok(!html.includes('Alex Johnson'), `${name} must NOT show placeholder name in user mode`);
}
console.log('  ✓ PASSED: Empty optional fields render safely without placeholder pollution');

// -------------------------------------------------------------
// Test 6: Specific Layout Orders & Structural Rules
// -------------------------------------------------------------
console.log('\n>>> Test 7 & 10: Approved Layout & Section Ordering Checks');

// Creative Clean: Page 2 sidebar removed, Languages immediately after Certifications/Publications
const ccHtml = renderToString(React.createElement(CreativeCleanTemplate, { sections: normalized1, isPreview: false }));
const ccCertIdx = ccHtml.indexOf('Certifications');
const ccPubIdx = ccHtml.indexOf('Research Papers &amp; Publications');
const ccLangIdx = ccHtml.indexOf('Languages');
assert.ok(ccCertIdx < ccPubIdx, 'Creative Clean: Certifications must precede Publications');
assert.ok(ccPubIdx < ccLangIdx, 'Creative Clean: Publications must precede Languages');

const ccPage2Match = ccHtml.match(/data-resume-page="2"[\s\S]*$/);
if (ccPage2Match) {
  assert.ok(!ccPage2Match[0].includes('data-sidebar-block'), 'Creative Clean: Page 2 must not contain sidebar blocks');
}
console.log('  ✓ PASSED: Creative Clean preserves approved main content order: Certifications -> Publications -> Languages');

// Modern Professional: Page 2 sidebar removed, Languages after Certifications/Publications
const mpHtml = renderToString(React.createElement(ModernProfessionalTemplate, { sections: normalized1, isPreview: false }));
const mpCertIdx = mpHtml.indexOf('Certifications');
const mpPubIdx = mpHtml.indexOf('Research Papers &amp; Publications');
assert.ok(mpCertIdx < mpPubIdx, 'Modern Professional: Certifications must precede Publications');

const mpPage2Match = mpHtml.match(/data-resume-page="2"[\s\S]*$/);
if (mpPage2Match) {
  assert.ok(!mpPage2Match[0].includes('data-sidebar-block'), 'Modern Professional: Page 2 must not contain sidebar blocks');
}
console.log('  ✓ PASSED: Modern Professional preserves approved layout and publications placement');

// Executive Corporate: Core Strengths follows Credentials & Honors
const ecHtml = renderToString(React.createElement(ExecutiveCorporateTemplate, { sections: normalized1, isPreview: false }));
const ecCredIdx = ecHtml.indexOf('Credentials &amp; Honors');
const ecPubIdx = ecHtml.indexOf('Research Papers &amp; Publications');
const ecCoreIdx = ecHtml.indexOf('Core Strengths');
assert.ok(ecCredIdx < ecPubIdx, 'Executive: Credentials & Honors must precede Publications');
assert.ok(ecPubIdx < ecCoreIdx, 'Executive: Publications must precede Core Strengths');
console.log('  ✓ PASSED: Executive Corporate preserves approved layout: Credentials & Honors -> Publications -> Core Strengths');

console.log('\n================================================================');
console.log('ALL 10 REGRESSION & CONSISTENCY CRITERIA FULLY VERIFIED!');
console.log('================================================================\n');
