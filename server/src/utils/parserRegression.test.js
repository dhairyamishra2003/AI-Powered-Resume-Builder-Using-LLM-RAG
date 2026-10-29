import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeImportedSections, validateImportedSections, verifyImportCompleteness } from './resumeImport.js';
import { defragmentProjects, normalizeProjects, normalizeSections } from './sectionNormalizer.js';
import { extractTextFromPdf, parseResumeLocally } from './resumeParser.js';

test('project defragmentation merges orphaned tech stack and bullet fragments into parent project', () => {
  const fragmentedProjects = [
    {
      name: 'AgentFlow AI Platform',
      description: 'Distributed multi-agent orchestration platform',
      technologies: ['Node.js'],
      bullets: ['Architected core dispatch loop'],
    },
    {
      name: 'Technologies: React, Node.js, Express, MongoDB, Redis, Docker',
      description: '',
      technologies: [],
      bullets: [],
    },
    {
      name: '• Designed fault-tolerant agent coordination protocols reducing timeout rates by 35%',
      description: '',
      technologies: [],
      bullets: [],
    },
  ];

  const defragmented = defragmentProjects(fragmentedProjects);
  assert.equal(defragmented.length, 1, 'Should defragment 3 fragmented items into 1 canonical project card');
  assert.equal(defragmented[0].name, 'AgentFlow AI Platform');
  assert.ok(defragmented[0].technologies.includes('React'));
  assert.ok(defragmented[0].technologies.includes('MongoDB'));
  assert.ok(defragmented[0].technologies.includes('Redis'));
  assert.equal(defragmented[0].bullets.length, 2);
  assert.ok(defragmented[0].bullets[1].includes('fault-tolerant agent coordination'));
});

test('soft skills in certifications are separated and routed to skills.soft', () => {
  const rawSections = {
    personalInfo: { fullName: 'Alex Rivera' },
    skills: {
      technical: ['Python', 'PyTorch'],
      soft: ['Team Leadership'],
    },
    certifications: [
      { name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services' },
      { name: 'Problem Solving' }, // Mistakenly parsed into certifications without issuer
      { name: 'Critical Thinking' },
    ],
  };

  const normalized = normalizeSections(rawSections);
  assert.equal(normalized.certifications.length, 1, 'Legitimate certification preserved');
  assert.equal(normalized.certifications[0].name, 'AWS Certified Solutions Architect');
  assert.ok(normalized.skills.soft.includes('Team Leadership'));
  assert.ok(normalized.skills.soft.includes('Problem Solving'), 'Problem Solving moved to skills.soft');
  assert.ok(normalized.skills.soft.includes('Critical Thinking'), 'Critical Thinking moved to skills.soft');
});

test('AI and fallback merge deduplicates project title variations and bullet points', () => {
  const ai = {
    projects: [
      {
        name: 'Snap & Study — AI Vision Study Assistant',
        technologies: ['React', 'Python'],
        bullets: ['Implemented end-to-end OCR pipeline for study note synthesis.'],
      },
    ],
  };
  const fallback = {
    projects: [
      {
        name: 'Snap & Study',
        technologies: ['Python', 'OpenCV'],
        bullets: [
          'Implemented end-to-end OCR pipeline for study note synthesis', // minor punctuation difference
          'Engineered real-time flashcard generation algorithms.',
        ],
      },
    ],
  };

  const merged = mergeImportedSections(ai, fallback);
  assert.equal(merged.projects.length, 1, 'Should match and merge project variations into 1 project');
  assert.equal(merged.projects[0].bullets.length, 2, 'Should deduplicate punctuation-normalized bullets');
  assert.ok(merged.projects[0].technologies.includes('React'));
  assert.ok(merged.projects[0].technologies.includes('OpenCV'));
});

test('extractTextFromPdf rejects empty, non-buffer, and malformed inputs with clear errors', async () => {
  await assert.rejects(
    async () => {
      await extractTextFromPdf(null);
    },
    { message: /PDF file buffer is empty or missing/ }
  );

  await assert.rejects(
    async () => {
      await extractTextFromPdf(Buffer.alloc(0));
    },
    { message: /PDF file buffer is empty or missing/ }
  );

  await assert.rejects(
    async () => {
      await extractTextFromPdf(Buffer.from('NOT A PDF FILE AT ALL'));
    },
    { message: /Invalid PDF structure/ }
  );
});

test('multi-role titles (>60 chars) are preserved in targetRole', () => {
  const resumeText = `
DHAIRYA MISHRA
AI Engineer | Generative AI Engineer | AI Full-Stack Engineer
Email: dhairyam698@gmail.com | Phone: 6264516970
EDUCATION
B.Tech in Artificial Intelligence
AKS University
`;
  const parsed = parseResumeLocally(resumeText);
  assert.equal(parsed.personalInfo.fullName, 'DHAIRYA MISHRA');
  assert.equal(parsed.personalInfo.targetRole, 'AI Engineer | Generative AI Engineer | AI Full-Stack Engineer');
  assert.equal(parsed.personalInfo.email, 'dhairyam698@gmail.com');
  assert.equal(parsed.personalInfo.phone, '6264516970');
});

test('coursework containing "Kubernetes" does not false-match as B.E. degree', () => {
  const resumeText = `
DHAIRYA MISHRA
Software Engineer
EDUCATION
Bachelor of Technology (B.Tech) - Artificial Intelligence & Data Science
AKS University, Satna, Madhya Pradesh
2023 - 2027
Coursework: Python, Full-Stack, Machine Learning, Docker, Kubernetes
`;
  const parsed = parseResumeLocally(resumeText);
  assert.equal(parsed.education.length, 1);
  assert.ok(parsed.education[0].degree.includes('Bachelor of Technology'));
  // Verify Kubernetes didn't create a second B.E. education entry
  const hasBeFromKubernetes = parsed.education.some((e) => e.degree === 'B.E.' || e.degree.includes('Kubernetes'));
  assert.equal(hasBeFromKubernetes, false, 'Kubernetes should not match as B.E. degree');
});

test('experience with role and company on preceding line and dates on line N+1', () => {
  const resumeText = `
EXPERIENCE
FODRIX
Machine Learning Intern
Jan 2026 – May 2026
• Engineered a CNN-based deep learning system for automated image selection.
• Developed and evaluated image-quality assessment workflows.
`;
  const parsed = parseResumeLocally(resumeText);
  assert.equal(parsed.experience.length, 1);
  assert.equal(parsed.experience[0].role, 'Machine Learning Intern');
  assert.equal(parsed.experience[0].company, 'FODRIX');
  assert.equal(parsed.experience[0].startDate, '2026-01');
  assert.equal(parsed.experience[0].endDate, '2026-05');
  assert.equal(parsed.experience[0].bullets.length, 2);
});

test('projects parser captures project title, technologies, link, and multiline bullets', () => {
  const resumeText = `
PROJECTS
AI Recruitment Organization – Multi-Agent Recruitment Platform
Technologies: LangChain, LangGraph, FastAPI, Redis, Docker, PostgreSQL
GitHub: https://github.com/dhairyamishra2003/AGENTICHIREAI
• Architected a multi-agent AI system with 7+ specialized autonomous agents.
• Implemented an asynchronous orchestrator handling candidate analysis.
`;
  const parsed = parseResumeLocally(resumeText);
  assert.equal(parsed.projects.length, 1);
  assert.equal(parsed.projects[0].name, 'AI Recruitment Organization – Multi-Agent Recruitment Platform');
  assert.equal(parsed.projects[0].link, 'https://github.com/dhairyamishra2003/AGENTICHIREAI');
  assert.ok(parsed.projects[0].technologies.includes('LangChain'));
  assert.ok(parsed.projects[0].technologies.includes('FastAPI'));
  assert.equal(parsed.projects[0].bullets.length, 2);
});

test('research and publications section correctly parsed', () => {
  const resumeText = `
RESEARCH
Multi-Agent Collaboration Systems Using Agentic AI for Intelligent Task Automation
Independent Research
Studied multi-agent collaboration architectures for intelligent task automation, autonomous task decomposition, and agent communication.
`;
  const parsed = parseResumeLocally(resumeText);
  assert.equal(parsed.publications.length, 1);
  assert.ok(parsed.publications[0].title.includes('Multi-Agent Collaboration Systems'));
  assert.equal(parsed.publications[0].publisher, 'Independent Research');
  assert.ok(parsed.publications[0].description.includes('Studied multi-agent collaboration architectures'));
});

test('dynamic languages parsed from LANGUAGES section', () => {
  const resumeText = `
LANGUAGES
English (Professional), Hindi (Native)
`;
  const parsed = parseResumeLocally(resumeText);
  assert.ok(parsed.skills.languages.includes('English'));
  assert.ok(parsed.skills.languages.includes('Hindi'));
});

test('verifyImportCompleteness detects missing sections in AI response and recovers them from fallback', () => {
  const rawSourceText = `
JOHN DOE
Software Engineer
john@example.com | (555) 123-4567
EXPERIENCE
Google - Senior Software Engineer
2020 - Present
• Built cloud-scale infrastructure.
PROJECTS
AlphaApp - Distributed task queue
Technologies: Go, Redis
• Scaled to 1M ops/sec.
PUBLICATIONS
Scalable Consensus in Heterogeneous Networks
ACM Queue
`;
  // Simulate an incomplete AI response that dropped projects and publications
  const incompleteAiResponse = {
    personalInfo: { fullName: 'John Doe', email: 'john@example.com' },
    experience: [{ company: 'Google', role: 'Senior Software Engineer' }],
    projects: [],
    publications: [],
  };

  const fallback = parseResumeLocally(rawSourceText);
  const result = verifyImportCompleteness(rawSourceText, incompleteAiResponse, fallback);

  // Assert recovery
  assert.ok(result.sections.projects.length > 0, 'Projects should be recovered from fallback');
  assert.ok(result.sections.publications.length > 0, 'Publications should be recovered from fallback');
  assert.ok(result.recovered.includes('projects'));
  assert.ok(result.recovered.includes('publications'));
});

test('long resumes exceeding 30,000 characters preserve all sections via fallback', () => {
  const padding = 'Detailed engineering work item with complex performance measurements and optimizations.\n'.repeat(350);
  const longResume = `
JANE DOE
Principal Architect
jane.doe@example.com
EXPERIENCE
${padding}
PROJECTS
Massive Scale Database Engine
Technologies: Rust, C++, Raft
• Built zero-copy distributed storage engine.
PUBLICATIONS
High-Throughput Distributed Raft Implementations
IEEE Transactions
`;
  assert.ok(longResume.length > 30000, 'Resume exceeds 30,000 characters');
  const fallback = parseResumeLocally(longResume);
  assert.equal(fallback.personalInfo.fullName, 'JANE DOE');
  assert.ok(fallback.projects.length > 0, 'Projects parsed despite long text');
  assert.ok(fallback.publications.length > 0, 'Publications parsed despite long text');
});

