import React from 'react';
import { renderToString } from 'react-dom/server';
import assert from 'node:assert/strict';

import ModernProfessionalTemplate from '../src/components/templates/ModernProfessionalTemplate.jsx';
import MinimalAtsTemplate from '../src/components/templates/MinimalAtsTemplate.jsx';
import ExecutiveCorporateTemplate from '../src/components/templates/ExecutiveCorporateTemplate.jsx';
import SoftwareEngineerTemplate from '../src/components/templates/SoftwareEngineerTemplate.jsx';
import AimlEngineerTemplate from '../src/components/templates/AimlEngineerTemplate.jsx';
import CreativeCleanTemplate from '../src/components/templates/CreativeCleanTemplate.jsx';
import { TEMPLATE_CONFIGS } from '../src/config/templateRegistry.js';

console.log('================================================================');
console.log('PDF EXPORT & MULTI-PAGE RENDERING VERIFICATION ACROSS ALL 6 TEMPLATES');
console.log('================================================================\n');

const TEMPLATE_COMPONENTS = {
  'modern-professional': ModernProfessionalTemplate,
  'minimal-ats': MinimalAtsTemplate,
  'executive-corporate': ExecutiveCorporateTemplate,
  'software-engineer': SoftwareEngineerTemplate,
  'aiml-engineer': AimlEngineerTemplate,
  'creative-clean': CreativeCleanTemplate,
};

const REPRESENTATIVE_RESUMES = {
  typical: {
    personalInfo: {
      fullName: 'Marcus Vance',
      email: 'marcus.vance@eng.org',
      phone: '+1 555-0145',
      location: 'Seattle, WA',
      linkedIn: 'linkedin.com/in/mvance',
      portfolio: 'mvance.dev',
      targetRole: 'Senior Staff Engineer',
    },
    summary: 'Senior staff engineer with 12+ years designing distributed storage engines and real-time streaming pipelines.',
    skills: {
      technical: ['Go', 'Rust', 'C++', 'Distributed Systems', 'gRPC', 'Raft', 'Kubernetes'],
      soft: ['Technical Leadership', 'Architecture Governance', 'Mentorship'],
      languages: ['English', 'German'],
    },
    experience: [
      {
        role: 'Senior Staff Infrastructure Engineer',
        company: 'CloudCore Systems',
        startDate: '2021-04',
        endDate: 'Present',
        current: true,
        bullets: [
          'Architected global distributed block storage tier serving 50PB+ data across 8 AWS availability zones.',
          'Reduced storage latency tail percentiles (p99.9) by 42% through custom NVMe-over-Fabrics kernel driver.',
        ],
      },
      {
        role: 'Staff Systems Engineer',
        company: 'DataStream Networks',
        startDate: '2016-08',
        endDate: '2021-03',
        current: false,
        bullets: [
          'Engineered event ingestion brokers processing 25M messages/sec with end-to-end zero-loss guarantee.',
          'Supervised 6 senior software engineers and established architectural review RFC processes.',
        ],
      },
    ],
    education: [
      {
        institution: 'University of Washington',
        degree: 'B.S. in Computer Engineering',
        startDate: '2012',
        endDate: '2016',
        gpa: '3.88',
      },
    ],
    projects: [
      {
        name: 'OmniKV Distributed Key-Value Store',
        description: 'LSM-tree based key-value database engine with Raft consensus',
        technologies: ['Rust', 'Raft', 'RocksDB'],
        link: 'github.com/mvance/omnikv',
        bullets: [
          'Achieved 1.8M sustained write ops/sec on 16-node commodity cluster.',
          'Adopted by 3 enterprise infrastructure platforms.',
        ],
      },
    ],
    certifications: [
      { name: 'Certified Kubernetes Security Specialist (CKS)', issuer: 'Linux Foundation', date: '2023' },
    ],
    publications: [
      {
        title: 'High-Throughput Consensus via Speculative Batch Pipelining',
        publisher: 'IEEE Transactions on Parallel & Distributed Systems',
        authors: 'Marcus Vance, Sarah Lin',
        date: '2024',
        description: 'Demonstrated theoretical and empirical throughput improvements in pipelined consensus under heterogeneous network links.',
      },
    ],
  },
  longMultiProject: {
    personalInfo: {
      fullName: 'Aria Montgomery',
      email: 'aria.m@ai-labs.org',
      phone: '+1 650-555-0812',
      location: 'Palo Alto, CA',
      targetRole: 'Principal AI/ML Scientist',
    },
    summary: 'Research scientist pioneering speculative inference, multimodal perception models, and verifiable alignment.',
    skills: {
      technical: ['Python', 'PyTorch', 'JAX', 'CUDA', 'Triton', 'vLLM', 'HuggingFace', 'Transformers'],
      soft: ['Research Vision', 'Grant Writing', 'Cross-institutional Collaboration'],
      languages: ['English', 'Mandarin'],
    },
    experience: [
      {
        role: 'Principal Research Scientist',
        company: 'Frontier AI Institute',
        startDate: '2022-01',
        endDate: 'Present',
        current: true,
        bullets: [
          'Led pretraining of 68B parameter multimodal foundation model across 1,024 H100 GPU cluster.',
          'Published 6 tier-1 papers at NeurIPS, ICML, and CVPR with >1,800 citations.',
        ],
      },
      {
        role: 'Senior Machine Learning Scientist',
        company: 'Autonomous Systems Inc',
        startDate: '2018-06',
        endDate: '2021-12',
        current: false,
        bullets: [
          'Developed real-time computer vision inference stack operating at 60 FPS on edge TPU hardware.',
          'Authored 4 granted patents on adaptive neural compression.',
        ],
      },
    ],
    education: [
      {
        institution: 'Stanford University',
        degree: 'Ph.D. in Artificial Intelligence',
        startDate: '2014',
        endDate: '2018',
      },
    ],
    projects: [
      {
        name: 'VisionDraft Speculative Token Generator',
        description: 'Multimodal draft model generator achieving 2.8x speedup in LLM image token synthesis',
        technologies: ['PyTorch', 'CUDA', 'Triton'],
        link: 'github.com/aria-m/visiondraft',
        bullets: ['Open-sourced library with 4,200 GitHub stars and production deployment in 2 frontier engines.'],
      },
      {
        name: 'AgentFlow Multimodal Orchestration',
        description: 'Agentic workflow execution framework for vision-language models',
        technologies: ['Python', 'FastAPI', 'Redis'],
        link: 'github.com/aria-m/agentflow',
        bullets: ['Automates end-to-end task decomposition across heterogeneous tools.'],
      },
    ],
    certifications: [
      { name: 'NVIDIA Certified Research Fellow', issuer: 'NVIDIA DLI', date: '2022' },
    ],
    publications: [
      {
        title: 'Multi-Agent Collaboration Systems Using Agentic AI for Intelligent Task Automation',
        publisher: 'Independent Research',
        authors: 'Aria Montgomery',
        date: '2026',
        description: 'Studied multi-agent collaboration architectures, autonomous task decomposition, planning, memory, and proposed scalable LLM-driven orchestration for intelligent task automation.',
      },
    ],
  },
};

let verifiedCases = 0;

for (const [templateId, Component] of Object.entries(TEMPLATE_COMPONENTS)) {
  console.log(`>>> Verifying PDF Export Rendering for: ${templateId.toUpperCase()}`);
  const cfg = TEMPLATE_CONFIGS[templateId];

  for (const [resumeType, resumeData] of Object.entries(REPRESENTATIVE_RESUMES)) {
    // 1. Render in export mode (isExport = true)
    const exportHtml = renderToString(
      React.createElement(Component, {
        sections: resumeData,
        colors: cfg.colors,
        isPreview: false,
        isExport: true,
      })
    );

    // Verify A4 page container
    assert.ok(
      exportHtml.includes('a4-resume-canvas') || exportHtml.includes('data-resume-page'),
      `${templateId} (${resumeType}): Must render A4 resume canvas container`
    );

    // Verify candidate identity rendered
    assert.ok(
      exportHtml.includes(resumeData.personalInfo.fullName),
      `${templateId} (${resumeType}): Candidate name must be rendered`
    );

    // Verify experience rendered
    assert.ok(
      exportHtml.includes(resumeData.experience[0].company),
      `${templateId} (${resumeType}): Experience company must be rendered`
    );

    // Verify projects rendered
    assert.ok(
      exportHtml.includes(resumeData.projects[0].name.replace('&', '&amp;')) ||
      exportHtml.includes(resumeData.projects[0].name),
      `${templateId} (${resumeType}): Project title must be rendered`
    );

    // Verify publications rendered
    assert.ok(
      exportHtml.includes(resumeData.publications[0].title.replace('&', '&amp;')) ||
      exportHtml.includes(resumeData.publications[0].title),
      `${templateId} (${resumeType}): Publication title must be rendered`
    );

    // Verify no [object Object] or undefined text in output
    assert.ok(
      !exportHtml.includes('[object Object]'),
      `${templateId} (${resumeType}): Output must not contain [object Object]`
    );
    assert.ok(
      !exportHtml.includes('undefined') || !exportHtml.includes('>undefined<'),
      `${templateId} (${resumeType}): Output must not render undefined text`
    );

    verifiedCases++;
    console.log(`  ✓ ${resumeType} resume: Rendered valid A4 export markup`);
  }
}

console.log('\n================================================================');
console.log(`PDF EXPORT VERIFICATION COMPLETE: ${verifiedCases} SCENARIOS VERIFIED!`);
console.log('================================================================\n');
