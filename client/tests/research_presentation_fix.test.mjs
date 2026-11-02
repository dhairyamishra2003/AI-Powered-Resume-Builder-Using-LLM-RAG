import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { normalizeResumeSections, normalizePublicationItem, normalizePublications } from '../src/components/templates/utils/normalizeResumeSections.js';
import ModernProfessionalTemplate from '../src/components/templates/ModernProfessionalTemplate.jsx';
import MinimalAtsTemplate from '../src/components/templates/MinimalAtsTemplate.jsx';
import ExecutiveCorporateTemplate from '../src/components/templates/ExecutiveCorporateTemplate.jsx';
import SoftwareEngineerTemplate from '../src/components/templates/SoftwareEngineerTemplate.jsx';
import AimlEngineerTemplate from '../src/components/templates/AimlEngineerTemplate.jsx';
import CreativeCleanTemplate from '../src/components/templates/CreativeCleanTemplate.jsx';

console.log('================================================================');
console.log('RUNNING RESEARCH PRESENTATION DUPLICATION REGRESSION TEST');
console.log('================================================================\n');

// 1. Direct Normalizer Tests
console.log('>>> 1. Direct Normalization of Publication Items');

// Should return null for presentation note string or object
const presString = 'Research Presentation: Presented research work at the International Conference on Technology for Sustainable Development Goals (SDGs).';
assert.equal(normalizePublicationItem(presString), null, 'String presentation item must return null');

const presObj = {
  title: 'Research Presentation: Presented research work at the International Conference on Technology for Sustainable Development Goals (SDGs).',
  description: 'Presented research work at the International Conference on Technology for Sustainable Development Goals (SDGs).',
};
assert.equal(normalizePublicationItem(presObj), null, 'Object presentation item must return null');

// Genuine publication with appended conference text in publisher & description
const genuinePubWithPollution = {
  title: 'Multi-Agent Collaboration Systems Using Agentic AI for Intelligent Task Automation',
  publisher: 'Independent Research / Presented at International Conference on Technology for SDGs',
  authors: 'Dhairya Mishra',
  date: '2026',
  link: 'https://example.com/paper',
  description: 'Studied multi-agent collaboration architectures for intelligent task automation. Research Presentation: Presented research work at the International Conference on Technology for Sustainable Development Goals (SDGs).',
};

const normalizedGen = normalizePublicationItem(genuinePubWithPollution);
assert.ok(normalizedGen, 'Genuine publication must be preserved');
assert.equal(normalizedGen.title, 'Multi-Agent Collaboration Systems Using Agentic AI for Intelligent Task Automation');
assert.equal(normalizedGen.publisher, 'Independent Research', 'Publisher must have conference suffix stripped');
assert.ok(!normalizedGen.description.includes('Presented research work at the International Conference'), 'Description must not contain presentation text');
assert.ok(normalizedGen.description.includes('Studied multi-agent collaboration architectures'), 'Original paper description must be preserved');
console.log('  ✓ PASSED: Direct publication normalization correctly strips presentation noise and preserves genuine papers');

// 2. Full Resume Sections Normalization Test
console.log('\n>>> 2. Full Resume Normalization with Duplicate Presentation Items');
const rawResume = {
  personalInfo: {
    fullName: 'Dhairya Mishra',
    email: 'dhairya@example.com',
    targetRole: 'AI / Machine Learning Engineer',
  },
  skills: {
    technical: ['Python', 'PyTorch', 'TensorFlow', 'LLMs'],
    languages: ['English', 'Hindi'],
  },
  experience: [
    {
      company: 'FODRIX',
      role: 'Machine Learning Intern',
      duration: 'January 2026 – May 2026',
      bullets: [
        'Engineered a CNN-based deep learning system for automated image selection and quality assessment.',
        'Developed and evaluated image-quality assessment workflows to address real-world computer vision challenges.',
        'Applied Python, deep learning, and model evaluation techniques to improve image-quality assessment workflows.',
      ],
    },
  ],
  education: [
    { degree: 'Bachelor of Technology in Computer Science', institution: 'Apex University', year: '2026' },
  ],
  projects: [
    {
      name: 'Agentic Workflow Engine',
      description: 'Distributed workflow engine for orchestrating LLM agents.',
      technologies: ['Python', 'FastAPI', 'Docker'],
      bullets: ['Built scalable execution graph with asynchronous task dispatch.'],
    },
  ],
  publications: [
    {
      title: 'Multi-Agent Collaboration Systems Using Agentic AI for Intelligent Task Automation',
      publisher: 'Independent Research / Presented at International Conference on Technology for SDGs',
      authors: 'Dhairya Mishra',
      date: '2026',
      description: 'Studied multi-agent collaboration architectures, autonomous task decomposition, planning, memory, and proposed scalable LLM-driven orchestration for intelligent task automation.',
    },
    {
      title: 'Research Presentation: Presented research work at the International Conference on Technology for Sustainable Development Goals (SDGs).',
      description: 'Presented research work at the International Conference on Technology for Sustainable Development Goals (SDGs).',
    },
  ],
};

const normalizedSections = normalizeResumeSections(rawResume);
assert.equal(normalizedSections.publications.length, 1, 'Only 1 genuine publication must be present');
assert.equal(normalizedSections.publications[0].title, 'Multi-Agent Collaboration Systems Using Agentic AI for Intelligent Task Automation');
assert.equal(normalizedSections.publications[0].publisher, 'Independent Research');
console.log('  ✓ PASSED: normalizeResumeSections filtered out duplicate presentation item');

// 3. Template Rendering Tests Across All 6 Templates
console.log('\n>>> 3. Verifying Rendering Across All 6 Templates');
const templates = [
  { name: 'Modern Professional', Component: ModernProfessionalTemplate },
  { name: 'Minimal ATS', Component: MinimalAtsTemplate },
  { name: 'Executive Corporate', Component: ExecutiveCorporateTemplate },
  { name: 'Software Engineer', Component: SoftwareEngineerTemplate },
  { name: 'AI/ML Engineer', Component: AimlEngineerTemplate },
  { name: 'Creative Clean', Component: CreativeCleanTemplate },
];

for (const { name, Component } of templates) {
  const html = renderToString(React.createElement(Component, { sections: normalizedSections, isExport: true }));
  
  // Must contain genuine publication
  assert.ok(html.includes('Multi-Agent Collaboration Systems'), `${name} must render genuine paper`);
  
  // Must NOT contain presentation duplicate title or description
  assert.ok(!html.includes('Research Presentation: Presented research work'), `${name} must NOT contain Research Presentation heading`);
  assert.ok(!html.includes('Presented research work at the International Conference on Technology for Sustainable Development Goals'), `${name} must NOT contain presentation description`);
  
  console.log(`  ✓ PASSED: ${name} template cleanly rendered without presentation noise`);
}

console.log('\n================================================================');
console.log('ALL RESEARCH PRESENTATION DUPLICATION TESTS PASSED!');
console.log('================================================================');
