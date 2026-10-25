import React from 'react';
import { renderToString } from 'react-dom/server';
import assert from 'node:assert/strict';

import ModernProfessionalTemplate from '../src/components/templates/ModernProfessionalTemplate.jsx';
import MinimalAtsTemplate from '../src/components/templates/MinimalAtsTemplate.jsx';
import ExecutiveCorporateTemplate from '../src/components/templates/ExecutiveCorporateTemplate.jsx';
import SoftwareEngineerTemplate from '../src/components/templates/SoftwareEngineerTemplate.jsx';
import AimlEngineerTemplate from '../src/components/templates/AimlEngineerTemplate.jsx';
import CreativeCleanTemplate from '../src/components/templates/CreativeCleanTemplate.jsx';

const TEMPLATES_MAP = {
  'modern-professional': ModernProfessionalTemplate,
  'minimal-ats': MinimalAtsTemplate,
  'executive-corporate': ExecutiveCorporateTemplate,
  'software-engineer': SoftwareEngineerTemplate,
  'aiml-engineer': AimlEngineerTemplate,
  'creative-clean': CreativeCleanTemplate,
};

// ── Test Datasets ────────────────────────────────────────────────────────────

// 1. Short / Minimal Data
const SHORT_DATA = {
  personalInfo: {
    fullName: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone: '+1 555-0100',
    location: 'Austin, TX',
    linkedIn: 'linkedin.com/in/janedoe',
    portfolio: 'janedoe.me',
    targetRole: 'Software Developer',
  },
  summary: 'Enthusiastic software developer dedicated to building reliable web services.',
  skills: {
    technical: ['JavaScript', 'React', 'Node.js'],
    soft: ['Collaboration', 'Problem Solving'],
    languages: ['English'],
  },
  experience: [
    {
      role: 'Junior Developer',
      company: 'Tech Solutions Inc',
      startDate: '2023-01',
      endDate: '2024-06',
      current: false,
      bullets: [
        'Built full-stack components using React and Express.',
        'Wrote automated unit tests achieving 85% coverage.',
      ],
    },
  ],
  education: [
    {
      institution: 'University of Texas',
      degree: 'B.S.',
      field: 'Computer Science',
      startDate: '2019-09',
      endDate: '2023-05',
      gpa: '3.75',
    },
  ],
  projects: [
    {
      name: 'Task Flow Manager',
      description: 'A lightweight productivity tool for remote teams',
      technologies: ['React', 'Firebase'],
      link: 'github.com/janedoe/taskflow',
      bullets: ['Deployed to 500+ active users with 99.9% uptime.'],
    },
  ],
  certifications: [
    {
      name: 'AWS Certified Cloud Practitioner',
      issuer: 'Amazon Web Services',
      date: '2023',
    },
  ],
};

// 2. Typical Data
const TYPICAL_DATA = {
  personalInfo: {
    fullName: 'Michael Chen',
    email: 'm.chen@example.org',
    phone: '+1 415-555-2671',
    location: 'San Francisco, CA',
    linkedIn: 'linkedin.com/in/michaelchen',
    portfolio: 'mchen-portfolio.dev',
    targetRole: 'Staff Infrastructure Engineer',
  },
  summary: 'Staff engineer with 8+ years specializing in distributed systems, cloud migrations, and high-throughput streaming architectures.',
  skills: {
    technical: ['Go', 'Rust', 'Kubernetes', 'Terraform', 'Kafka', 'PostgreSQL', 'AWS', 'gRPC'],
    soft: ['System Design', 'Technical Mentorship', 'Incident Management', 'Cross-Team Alignment'],
    languages: ['English (Fluent)', 'Mandarin (Native)'],
  },
  experience: [
    {
      role: 'Senior Staff Engineer',
      company: 'CloudScale Dynamics',
      startDate: '2021-03',
      endDate: '',
      current: true,
      bullets: [
        'Architected multi-region Kubernetes clusters handling 50k requests per second.',
        'Reduced AWS infrastructure expenditure by $320k annually through automated spot instance orchestration.',
        'Championed site reliability engineering practices, cutting MTTR from 45 minutes to 7 minutes.',
      ],
    },
    {
      role: 'Systems Engineer',
      company: 'DataStream Labs',
      startDate: '2017-06',
      endDate: '2021-02',
      current: false,
      bullets: [
        'Developed streaming telemetry collectors in Go processing 10TB of metrics daily.',
        'Built automated CI/CD deployment pipelines using GitHub Actions and Helm charts.',
      ],
    },
  ],
  education: [
    {
      institution: 'Carnegie Mellon University',
      degree: 'M.S.',
      field: 'Software Engineering',
      startDate: '2015-09',
      endDate: '2017-05',
      gpa: '3.92',
    },
    {
      institution: 'Purdue University',
      degree: 'B.S.',
      field: 'Computer Engineering',
      startDate: '2011-09',
      endDate: '2015-05',
      gpa: '3.85',
    },
  ],
  projects: [
    {
      name: 'KubeMesh Orchestrator',
      description: 'Open-source service mesh automation for hybrid Kubernetes topologies',
      technologies: ['Go', 'eBPF', 'Kubernetes API'],
      link: 'github.com/mchen/kubemesh',
      bullets: ['Surpassed 2,400 GitHub stars and adopted by 12 enterprise organizations.'],
    },
    {
      name: 'EventPulse Pipeline',
      description: 'Distributed event ingestion layer with exactly-once delivery guarantees',
      technologies: ['Rust', 'Kafka', 'ClickHouse'],
      link: 'github.com/mchen/eventpulse',
      bullets: ['Achieved sub-5ms p99 ingestion latency under 20k events/sec load.'],
    },
  ],
  certifications: [
    {
      name: 'Certified Kubernetes Administrator (CKA)',
      issuer: 'Linux Foundation / CNCF',
      date: '2022',
    },
    {
      name: 'AWS Certified Solutions Architect – Professional',
      issuer: 'Amazon Web Services',
      date: '2023',
    },
  ],
};

// 3. Long / Comprehensive Data
const LONG_DATA = {
  personalInfo: {
    fullName: 'Dr. Elizabeth Montgomery',
    email: 'elizabeth.montgomery@research.ai',
    phone: '+1 212-555-8941',
    location: 'New York, NY',
    linkedIn: 'linkedin.com/in/elizabethmontgomery',
    portfolio: 'emontgomery-ai-labs.org',
    targetRole: 'VP of Artificial Intelligence & Machine Learning',
  },
  summary: 'Visionary AI research executive and machine learning leader with 14+ years pioneering deep learning, transformer model architectures, and production-scale generative AI applications. Author of 18 peer-reviewed IEEE/NeurIPS publications with over 4,500 citations.',
  skills: {
    technical: [
      'PyTorch', 'TensorFlow', 'JAX', 'Distributed Training', 'vLLM', 'Triton', 'CUDA',
      'Hugging Face', 'LangChain', 'LangGraph', 'Milvus', 'Pinecone', 'Docker', 'Kubernetes',
      'MLflow', 'Kubeflow', 'Ray', 'Python', 'C++', 'FastAPI'
    ],
    soft: [
      'Executive Leadership', 'AI Ethics & Governance', 'R&D Portfolio Management',
      'Strategic Roadmapping', 'Patent Development', 'Cross-Functional Team Scaling'
    ],
    languages: ['English (Native)', 'French (Professional)', 'German (Conversational)'],
  },
  experience: [
    {
      role: 'VP of AI Research & Engineering',
      company: 'OmniIntelligence Corp',
      startDate: '2022-01',
      endDate: '',
      current: true,
      bullets: [
        'Lead an international division of 65 researchers, research scientists, and ML infrastructure engineers.',
        'Directed the foundational fine-tuning and safety alignment of 70B parameter open-weights enterprise LLM.',
        'Secured 4 US patents in reinforcement learning from human feedback (RLHF) and speculative decoding.',
        'Decreased LLM serving latency by 4.2x utilizing custom FlashAttention-2 Triton kernels.',
      ],
    },
    {
      role: 'Director of Machine Learning',
      company: 'Synthetix Neural Systems',
      startDate: '2018-04',
      endDate: '2021-12',
      current: false,
      bullets: [
        'Constructed multi-modal computer vision and speech recognition pipeline generating $48M in ARR.',
        'Scaled distributed GPU clusters from 64 to 1,024 NVIDIA A100 GPUs with 99.4% cluster utilization.',
        'Formulated automated data annotation engine reducing labeling overhead by 72% across 50M assets.',
      ],
    },
    {
      role: 'Principal Research Scientist',
      company: 'DeepHorizon Technologies',
      startDate: '2014-08',
      endDate: '2018-03',
      current: false,
      bullets: [
        'Researched transformer-based representation learning for tabular and time-series anomaly detection.',
        'Collaborated with university research labs, authoring 8 top-tier publications in CVPR and ICML.',
      ],
    },
  ],
  education: [
    {
      institution: 'Massachusetts Institute of Technology (MIT)',
      degree: 'Ph.D.',
      field: 'Computer Science & Artificial Intelligence',
      startDate: '2010-09',
      endDate: '2014-06',
      gpa: '4.00',
    },
    {
      institution: 'Stanford University',
      degree: 'M.S.',
      field: 'Computer Science',
      startDate: '2008-09',
      endDate: '2010-06',
      gpa: '3.98',
    },
    {
      institution: 'Harvard University',
      degree: 'A.B.',
      field: 'Applied Mathematics',
      startDate: '2004-09',
      endDate: '2008-05',
      gpa: '3.95',
    },
  ],
  projects: [
    {
      name: 'OmniSpec Speculative Decoding Engine',
      description: 'Distributed low-latency LLM inference framework leveraging draft-verification speculative execution',
      technologies: ['C++', 'CUDA', 'PyTorch', 'Triton'],
      link: 'github.com/omni-ai/omnispec',
      bullets: [
        'Powers real-time conversational inference for over 10M daily active client queries.',
        'Featured at NVIDIA GTC keynote as a leading accelerator for open-source foundation models.',
      ],
    },
    {
      name: 'NeuroAlign RLHF Optimization Suite',
      description: 'Algorithmic alignment system integrating DPO, PPO, and KTO preference optimization',
      technologies: ['Ray', 'Deepspeed', 'JAX'],
      link: 'github.com/omni-ai/neuroalign',
      bullets: ['Reduced safety violations by 94% on standard red-teaming benchmark suites.'],
    },
    {
      name: 'VectorMesh Distributed Embeddings Engine',
      description: 'Hierarchical vector retrieval framework optimized for billions of dense embeddings',
      technologies: ['Rust', 'FAISS', 'gRPC'],
      link: 'github.com/omni-ai/vectormesh',
      bullets: ['Achieved sub-10ms recall at 99.2% precision across 500M vectors.'],
    },
  ],
  certifications: [
    {
      name: 'NVIDIA Certified AI Research Specialist',
      issuer: 'NVIDIA Deep Learning Institute',
      date: '2023',
    },
    {
      name: 'Stanford Executive Leadership in Technology',
      issuer: 'Stanford Graduate School of Business',
      date: '2021',
    },
    {
      name: 'Google Cloud Certified Fellow – Machine Learning',
      issuer: 'Google Cloud Platform',
      date: '2020',
    },
  ],
};

// 4. Edge Cases: Long unbroken URLs, wrapped badges, missing optional fields
const EDGE_CASE_DATA = {
  personalInfo: {
    fullName: 'Alexander Bartholomew-Montgomery-Schumacher III',
    email: 'alexander.verylongemailaddress.corporate.internal@enterprise-solutions-domain.co.uk',
    phone: '+44 (0) 20 7946 0999 ext. 4821',
    location: 'City of Westminster, Greater London, United Kingdom',
    linkedIn: 'https://www.linkedin.com/in/alexander-bartholomew-montgomery-schumacher-distinguished-fellow-2026',
    portfolio: 'https://very-long-custom-subdomain-portfolio-showcase.alexander-schumacher-engineering.internal.net',
    targetRole: 'Distinguished Principal Systems & Infrastructure Architect / Technology Fellow',
  },
  summary: 'Extremely thorough engineering architect with special focus on continuous integration, cross-platform distributed micro-architectures, fault-tolerant consensus systems, and resilient enterprise software stacks.',
  skills: {
    technical: [
      'Kubernetes-Cluster-Administration-And-Hardening',
      'Multi-Cloud-Infrastructure-As-Code-Terraform-Automation',
      'Enterprise-Grade-PostgreSQL-High-Availability-Replication',
      'Advanced-Distributed-Event-Streaming-Apache-Kafka-KafkaConnect',
    ],
    soft: [
      'Strategic-Enterprise-Level-Executive-Stakeholder-Communication',
      'Transformational-Culture-Change-And-Mentorship',
    ],
    languages: ['English (Bilingual / Native)', 'German (Native / C2 Level)'],
  },
  experience: [
    {
      role: 'Principal Systems Architect for Ultra-High-Scale Distributed Compute',
      company: 'Global Financial Infrastructure Holdings International Ltd.',
      startDate: '2020-01',
      endDate: '',
      current: true,
      bullets: [
        'Designed and implemented ultra-low-latency real-time algorithmic trading order matching pipeline handling millions of financial transactions per millisecond.',
        'https://financial-engineering-whitepaper.global-financial-infrastructure.com/case-study/low-latency-trading-infrastructure-modernization-2025',
      ],
    },
  ],
  education: [
    {
      institution: 'The London School of Economics and Political Science (LSE) & Imperial College London Joint Graduate Division',
      degree: 'Master of Science with Distinction',
      field: 'Computational Mathematics, Quantitative Risk Management and Financial Systems Engineering',
      startDate: '2016-10',
      endDate: '2018-07',
      gpa: 'First Class Honours (Distinction)',
    },
  ],
  projects: [
    {
      name: 'UltraScale-Financial-Engine-Framework-v2.0-Production-Ready',
      description: 'Distributed consensus state machine engine implementing Raft protocol with zero-copy ring buffers',
      technologies: ['C++23', 'Linux-Kernel-Bypass-DPDK', 'OpenSSL-3.0'],
      link: 'https://github.com/global-financial-infrastructure-holdings/ultrascale-financial-engine-production',
      bullets: [
        'Documented and audited by independent regulatory security compliance standards with zero critical CVE disclosures.',
      ],
    },
  ],
  certifications: [
    {
      name: 'Financial Risk Manager (FRM) Certified by Global Association of Risk Professionals (GARP)',
      issuer: 'Global Association of Risk Professionals (GARP)',
      date: '2021',
    },
  ],
};

const NO_SUMMARY_DATA = {
  ...SHORT_DATA,
  summary: '',
};

// ── Test Runner ──────────────────────────────────────────────────────────────

const datasets = [
  { name: 'Short Resume', data: SHORT_DATA },
  { name: 'No Summary Resume', data: NO_SUMMARY_DATA },
  { name: 'Typical Resume', data: TYPICAL_DATA },
  { name: 'Long Resume', data: LONG_DATA },
  { name: 'Edge Case Resume', data: EDGE_CASE_DATA },
];

console.log('================================================================');
console.log('RUNNING COMPREHENSIVE 6-TEMPLATE AUTOMATED TESTS');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;

for (const [templateId, Component] of Object.entries(TEMPLATES_MAP)) {
  console.log(`>>> Testing Template: ${templateId.toUpperCase()}`);

  for (const { name: dataName, data } of datasets) {
    totalTests++;
    const testLabel = `[${templateId}] with [${dataName}]`;

    try {
      const element = React.createElement(Component, {
        sections: data,
        isPreview: false,
        isExport: false,
      });

      const html = renderToString(element);

      // 1. Verify Page 1 exists
      assert.ok(
        html.includes('data-resume-page="1"'),
        `${testLabel}: Missing Page 1 (data-resume-page="1")`
      );

      // 2. Verify Page 2 exists (Mandatory 2-page A4 document)
      assert.ok(
        html.includes('data-resume-page="2"'),
        `${testLabel}: Missing Page 2 (data-resume-page="2")`
      );

      // 3. Verify PageRunningHeader on Page 2
      assert.ok(
        /Page\s*(?:<!--\s*-->)?\s*2/i.test(html),
        `${testLabel}: Missing 'Page 2' continuation indicator`
      );

      const containsText = (text) => {
        if (!text) return true;
        const str = String(text);
        const escaped = str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        return html.includes(str) || html.includes(escaped);
      };

      // 4. Verify Content Preservation (Critical Requirement 4)
      // Check personalInfo
      assert.ok(containsText(data.personalInfo.fullName), `${testLabel}: Missing fullName '${data.personalInfo.fullName}'`);
      assert.ok(containsText(data.personalInfo.email), `${testLabel}: Missing email '${data.personalInfo.email}'`);
      assert.ok(containsText(data.personalInfo.phone), `${testLabel}: Missing phone '${data.personalInfo.phone}'`);

      // Check summary (if present)
      if (data.summary && data.summary.trim()) {
        const summarySnippet = data.summary.slice(0, 30);
        assert.ok(containsText(summarySnippet), `${testLabel}: Missing summary snippet '${summarySnippet}'`);
      }

      // Check technical skills
      for (const skill of data.skills.technical.slice(0, 4)) {
        assert.ok(containsText(skill), `${testLabel}: Missing technical skill '${skill}'`);
      }

      // Check soft skills
      for (const skill of data.skills.soft.slice(0, 2)) {
        assert.ok(containsText(skill), `${testLabel}: Missing soft skill '${skill}'`);
      }

      // Check languages
      for (const lang of data.skills.languages.slice(0, 1)) {
        const langSnippet = lang.split(' ')[0];
        assert.ok(containsText(langSnippet), `${testLabel}: Missing language snippet '${langSnippet}'`);
      }

      // Check experience
      for (const exp of data.experience) {
        assert.ok(containsText(exp.role), `${testLabel}: Missing experience role '${exp.role}'`);
        assert.ok(containsText(exp.company), `${testLabel}: Missing experience company '${exp.company}'`);
        for (const bullet of exp.bullets.slice(0, 2)) {
          const bulletSnippet = bullet.slice(0, 25);
          assert.ok(containsText(bulletSnippet), `${testLabel}: Missing bullet snippet '${bulletSnippet}'`);
        }
      }

      // Check education
      for (const edu of data.education) {
        assert.ok(containsText(edu.degree), `${testLabel}: Missing education degree '${edu.degree}'`);
        assert.ok(containsText(edu.institution), `${testLabel}: Missing education institution '${edu.institution}'`);
      }

      // Check projects
      for (const proj of data.projects) {
        assert.ok(containsText(proj.name), `${testLabel}: Missing project name '${proj.name}'`);
      }

      // Check certifications
      for (const cert of data.certifications) {
        assert.ok(containsText(cert.name), `${testLabel}: Missing certification name '${cert.name}'`);
      }

      // 5. Verify Section Ordering: Summary -> Education -> Experience -> Projects -> Certifications
      const blockMatches = [...html.matchAll(/data-page-block="([^"]+)"/g)].map((m) => m[1]);
      const eduIndex = blockMatches.indexOf('education');
      assert.ok(eduIndex !== -1, `${testLabel}: Missing education block`);
      assert.equal(
        blockMatches.filter((id) => id === 'education').length,
        1,
        `${testLabel}: Education block rendered multiple times`
      );

      const summaryIndex = blockMatches.indexOf('summary');
      if (templateId === 'software-engineer' || templateId === 'minimal-ats') {
        const skillsBlockId = templateId === 'software-engineer' ? 'tech-skills' : 'skills';
        const skillsIndex = blockMatches.indexOf(skillsBlockId);
        if (summaryIndex !== -1 && skillsIndex !== -1) {
          assert.equal(
            skillsIndex,
            summaryIndex + 1,
            `${testLabel}: Skills must immediately follow Summary in ${templateId}`
          );
          assert.equal(
            eduIndex,
            skillsIndex + 1,
            `${testLabel}: Education must immediately follow Skills in ${templateId}`
          );
        } else if (summaryIndex !== -1) {
          assert.equal(eduIndex, summaryIndex + 1);
        } else if (skillsIndex !== -1) {
          assert.equal(eduIndex, skillsIndex + 1);
        } else {
          assert.equal(eduIndex, 0);
        }
      } else if (summaryIndex !== -1) {
        assert.equal(
          eduIndex,
          summaryIndex + 1,
          `${testLabel}: Education must immediately follow Summary (got summary at ${summaryIndex}, education at ${eduIndex})`
        );
      } else if (templateId === 'aiml-engineer') {
        const skillsIndex = blockMatches.indexOf('tech-skills');
        const expectedEduIndex = skillsIndex !== -1 ? skillsIndex + 1 : 0;
        assert.equal(
          eduIndex,
          expectedEduIndex,
          `${testLabel}: In AIML Engineer without summary, Education must follow ML Stack (expected ${expectedEduIndex}, got ${eduIndex})`
        );
      } else {
        assert.equal(
          eduIndex,
          0,
          `${testLabel}: Education must be first main block when summary is missing (got education at ${eduIndex})`
        );
      }

      const firstExpIndex = blockMatches.findIndex((id) => id.startsWith('exp-') || id === 'experience-0');
      if (firstExpIndex !== -1) {
        assert.ok(
          eduIndex < firstExpIndex,
          `${testLabel}: Education (index ${eduIndex}) must precede Experience (index ${firstExpIndex})`
        );
      }

      // 6. Verify Education is not in sidebar
      const sidebarMatches = [...html.matchAll(/data-sidebar-section="([^"]+)"/g)].map((m) => m[1]);
      assert.ok(
        !sidebarMatches.includes('education'),
        `${testLabel}: Education must not be in the sidebar`
      );

      // 7. Verify export mode ordering matches preview mode
      const exportElement = React.createElement(Component, {
        sections: data,
        isPreview: false,
        isExport: true,
      });
      const exportHtml = renderToString(exportElement);
      const exportBlockMatches = [...exportHtml.matchAll(/data-page-block="([^"]+)"/g)].map((m) => m[1]);
      assert.deepEqual(
        exportBlockMatches,
        blockMatches,
        `${testLabel}: Export mode block ordering must match preview mode block ordering`
      );

      // 8. Verify A4 dimensions are set (794px width, 1123px height)
      assert.ok(html.includes('794px'), `${testLabel}: Missing A4 794px width styling`);
      assert.ok(html.includes('1123px'), `${testLabel}: Missing A4 1123px height styling`);

      passedTests++;
      console.log(`  ✓ PASSED: ${dataName} (Order: Summary -> Education -> Experience verified)`);
    } catch (err) {
      console.error(`  ✗ FAILED: ${testLabel}`);
      console.error(`    Error: ${err.message}`);
      process.exitCode = 1;
    }
  }
  console.log('');
}

console.log('================================================================');
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
console.log('================================================================\n');

if (passedTests === totalTests) {
  console.log('ALL 6 RESUME TEMPLATES PASSED 2-PAGE & CONTENT-PRESERVATION CHECKS!');
} else {
  console.error('SOME TESTS FAILED! Please check the output above.');
}
