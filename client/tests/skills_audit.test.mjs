import assert from 'node:assert/strict';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import CreativeCleanTemplate from '../src/components/templates/CreativeCleanTemplate.jsx';
import ModernProfessionalTemplate from '../src/components/templates/ModernProfessionalTemplate.jsx';
import { normalizeResumeSections } from '../src/components/templates/utils/normalizeResumeSections.js';

const EXPECTED_SKILLS = [
  'JavaScript', 'Python', 'Java', 'C++', 'HTML5', 'HTML', 'CSS3', 'CSS',
  'React', 'React.js', 'Node.js', 'Express', 'Express.js', 'Flask', 'Spring Boot',
  'MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Redis', 'REST APIs',
  'Docker', 'Kubernetes', 'Git', 'GitHub', 'Linux', 'Tailwind', 'Tailwind CSS',
  'CI/CD', 'LangChain', 'LangGraph', 'Generative AI', 'Agentic AI', 'RAG',
  'LLMs', 'NLP', 'Machine Learning', 'Deep Learning', 'Computer Vision',
  'PyTorch', 'TensorFlow', 'Power BI', 'Tableau', 'Excel', 'Make.com',
  'Automation', 'Jupyter', 'VS Code', 'React Flow', 'Socket.IO'
];

console.log('================================================================');
console.log('CLIENT TEMPLATES 100% SKILLS PRESERVATION & RENDERING AUDIT');
console.log('================================================================');

const mockSections = {
  personalInfo: {
    fullName: 'Dhairy Mishra',
    email: 'dhairy@example.com',
    targetRole: 'AI & Full-Stack Engineer'
  },
  skills: {
    technical: EXPECTED_SKILLS,
    soft: ['Problem Solving', 'Strategic Leadership', 'Team Collaboration'],
    languages: ['English', 'Hindi']
  },
  experience: [
    {
      company: 'FODRIX',
      role: 'Machine Learning Intern',
      startDate: '2026-01',
      endDate: '2026-05',
      bullets: [
        'Engineered a CNN-based deep learning system for automated image selection and quality assessment.',
        'Developed and evaluated image-quality assessment workflows to address real-world computer vision challenges.',
        'Applied Python, deep learning, and model evaluation techniques to improve image-quality assessment workflows.'
      ]
    }
  ],
  education: [
    { institution: 'Tech University', degree: 'B.Tech', field: 'CS', startDate: '2022', endDate: '2026' }
  ]
};

const normalized = normalizeResumeSections(mockSections);

// 1. Creative Clean Template Audit
console.log('\n>>> AUDITING TEMPLATE: CREATIVE CLEAN (Purple Sidebar)');
const ccHtml = ReactDOMServer.renderToStaticMarkup(
  React.createElement(CreativeCleanTemplate, { sections: normalized })
);
const missingInCC = EXPECTED_SKILLS.filter(s => !ccHtml.includes(s));
console.log(`- Total expected: ${EXPECTED_SKILLS.length}`);
console.log(`- Total rendered in HTML: ${EXPECTED_SKILLS.length - missingInCC.length}`);
console.log(`- Missing skills: ${missingInCC.length === 0 ? 'None (0)' : missingInCC.join(', ')}`);
assert.equal(missingInCC.length, 0, 'Creative Clean must display 100% of skills');

// 2. Modern Professional Template Audit
console.log('\n>>> AUDITING TEMPLATE: MODERN PROFESSIONAL (Dark Navy Header)');
const mpHtml = ReactDOMServer.renderToStaticMarkup(
  React.createElement(ModernProfessionalTemplate, { sections: normalized })
);
const missingInMP = EXPECTED_SKILLS.filter(s => !mpHtml.includes(s));
console.log(`- Total expected: ${EXPECTED_SKILLS.length}`);
console.log(`- Total rendered in HTML: ${EXPECTED_SKILLS.length - missingInMP.length}`);
console.log(`- Missing skills: ${missingInMP.length === 0 ? 'None (0)' : missingInMP.join(', ')}`);
assert.equal(missingInMP.length, 0, 'Modern Professional must display 100% of skills');

// 3. Multi-Category Skills Source Audit
console.log('\n>>> AUDITING MULTI-CATEGORY SKILLS RETENTION');
const categorizedSections = {
  ...mockSections,
  skills: {
    technical: ['JavaScript', 'Python', 'Java', 'C++'],
    programmingLanguages: ['HTML5', 'HTML', 'CSS3', 'CSS'],
    frameworks: ['React', 'React.js', 'Node.js', 'Express', 'Express.js', 'Flask', 'Spring Boot', 'React Flow', 'Socket.IO'],
    databases: ['MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Redis'],
    tools: ['Docker', 'Kubernetes', 'Git', 'GitHub', 'Linux', 'Tailwind', 'Tailwind CSS', 'CI/CD', 'REST APIs', 'Power BI', 'Tableau', 'Excel', 'Make.com', 'Automation', 'Jupyter', 'VS Code'],
    aiml: ['LangChain', 'LangGraph', 'Generative AI', 'Agentic AI', 'RAG', 'LLMs', 'NLP', 'Machine Learning', 'Deep Learning', 'Computer Vision', 'PyTorch', 'TensorFlow'],
    soft: ['Leadership'],
    languages: ['English']
  }
};
const categorizedNorm = normalizeResumeSections(categorizedSections);

const ccCatHtml = ReactDOMServer.renderToStaticMarkup(
  React.createElement(CreativeCleanTemplate, { sections: categorizedNorm })
);
const mpCatHtml = ReactDOMServer.renderToStaticMarkup(
  React.createElement(ModernProfessionalTemplate, { sections: categorizedNorm })
);

const missingCatCC = EXPECTED_SKILLS.filter(s => !ccCatHtml.includes(s));
const missingCatMP = EXPECTED_SKILLS.filter(s => !mpCatHtml.includes(s));
console.log(`- Categorized skills in Creative Clean missing: ${missingCatCC.length === 0 ? 'None (0)' : missingCatCC.join(', ')}`);
console.log(`- Categorized skills in Modern Professional missing: ${missingCatMP.length === 0 ? 'None (0)' : missingCatMP.join(', ')}`);
assert.equal(missingCatCC.length, 0, 'All categorized skills must be present in Creative Clean');
assert.equal(missingCatMP.length, 0, 'All categorized skills must be present in Modern Professional');

// 4. PDF Export Mode Audit
console.log('\n>>> AUDITING PDF EXPORT RENDERING ACROSS BOTH TEMPLATES');
const ccExport = ReactDOMServer.renderToStaticMarkup(
  React.createElement(CreativeCleanTemplate, { sections: normalized, isExportMode: true })
);
const mpExport = ReactDOMServer.renderToStaticMarkup(
  React.createElement(ModernProfessionalTemplate, { sections: normalized, isExportMode: true })
);
const missingExportCC = EXPECTED_SKILLS.filter(s => !ccExport.includes(s));
const missingExportMP = EXPECTED_SKILLS.filter(s => !mpExport.includes(s));
console.log(`- Creative Clean PDF export missing: ${missingExportCC.length === 0 ? 'None (0)' : missingExportCC.join(', ')}`);
console.log(`- Modern Professional PDF export missing: ${missingExportMP.length === 0 ? 'None (0)' : missingExportMP.join(', ')}`);
assert.equal(missingExportCC.length, 0, 'Creative Clean PDF export must have 100% of skills');
assert.equal(missingExportMP.length, 0, 'Modern Professional PDF export must have 100% of skills');

console.log('\n================================================================');
console.log('CLIENT AUDIT COMPLETE: 100% SKILLS VERIFIED IN BOTH TEMPLATES & PDF EXPORT!');
console.log('================================================================\n');

