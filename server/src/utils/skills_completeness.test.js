import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractFallbackSections } from './resumeParser.js';
import { mergeImportedSections } from './resumeImport.js';
import { normalizeSections, normalizeSkills } from './sectionNormalizer.js';

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

test('100% Skills Extraction, Merging, and Canonical Normalization Pipeline Audit', () => {
  const sampleResumeText = `
DHAIRY MISHRA
dhairy@example.com | +1 234 567 8900 | San Francisco, CA

PROFESSIONAL SUMMARY
Full-Stack and AI Engineer experienced in building scalable applications.

TECHNICAL SKILLS
Programming Languages: JavaScript, Python, Java, C++, HTML5, HTML, CSS3, CSS
Frameworks & Libraries: React, React.js, Node.js, Express, Express.js, Flask, Spring Boot, React Flow, Socket.IO
Databases: MongoDB, PostgreSQL, MySQL, SQLite, Redis
Cloud & DevOps: Docker, Kubernetes, Git, GitHub, Linux, Tailwind, Tailwind CSS, CI/CD, REST APIs
AI / ML: LangChain, LangGraph, Generative AI, Agentic AI, RAG, LLMs, NLP, Machine Learning, Deep Learning, Computer Vision, PyTorch, TensorFlow
Tools & Platforms: Power BI, Tableau, Excel, Make.com, Automation, Jupyter, VS Code

WORK EXPERIENCE
Machine Learning Intern | FODRIX
January 2026 – May 2026
- Engineered a CNN-based deep learning system for automated image selection and quality assessment.
- Developed and evaluated image-quality assessment workflows to address real-world computer vision challenges.
- Applied Python, deep learning, and model evaluation techniques to improve image-quality assessment workflows.

EDUCATION
Bachelor of Technology in Computer Science | Tech University
August 2022 – May 2026
`;

  // 1. Extraction from text
  const parsed = extractFallbackSections(sampleResumeText);
  const extractedSkills = parsed.skills.technical;
  const missingExtracted = EXPECTED_SKILLS.filter(
    (s) => !extractedSkills.some((t) => t.toLowerCase() === s.toLowerCase())
  );
  assert.equal(missingExtracted.length, 0, `All skills must be extracted. Missing: ${missingExtracted.join(', ')}`);
  assert.ok(extractedSkills.length >= 50, 'Extracted count must be at least 50');

  // 2. Merging primary AI and fallback
  const merged = mergeImportedSections(
    { skills: { technical: EXPECTED_SKILLS } },
    parsed
  );
  const mergedSkills = merged.skills.technical;
  const missingMerged = EXPECTED_SKILLS.filter(
    (s) => !mergedSkills.some((t) => t.toLowerCase() === s.toLowerCase())
  );
  assert.equal(missingMerged.length, 0, `No skills lost during merge. Missing: ${missingMerged.join(', ')}`);

  // 3. Normalization & Canonical Storage
  const normalized = normalizeSections(merged);
  const storedSkills = normalized.skills.technical;
  const missingStored = EXPECTED_SKILLS.filter(
    (s) => !storedSkills.some((t) => t.toLowerCase() === s.toLowerCase())
  );
  assert.equal(missingStored.length, 0, `No skills lost in canonical storage. Missing: ${missingStored.join(', ')}`);

  // Verify versions and similar labels are NOT dropped
  assert.ok(storedSkills.includes('HTML') && storedSkills.includes('HTML5'), 'Both HTML and HTML5 preserved');
  assert.ok(storedSkills.includes('CSS') && storedSkills.includes('CSS3'), 'Both CSS and CSS3 preserved');
  assert.ok(storedSkills.includes('React') && storedSkills.includes('React.js'), 'Both React and React.js preserved');
  assert.ok(storedSkills.includes('Express') && storedSkills.includes('Express.js'), 'Both Express and Express.js preserved');
  assert.ok(storedSkills.includes('Tailwind') && storedSkills.includes('Tailwind CSS'), 'Both Tailwind and Tailwind CSS preserved');
  assert.ok(storedSkills.includes('REST APIs') || storedSkills.includes('REST API'), 'REST APIs preserved');

  console.log(`\nServer Pipeline Verification: ${storedSkills.length} skills preserved without loss.`);
});

