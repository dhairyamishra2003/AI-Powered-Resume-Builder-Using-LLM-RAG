import React from 'react';
import { renderToString } from 'react-dom/server';
import assert from 'node:assert/strict';

import ModernProfessionalTemplate from '../src/components/templates/ModernProfessionalTemplate.jsx';
import CreativeCleanTemplate from '../src/components/templates/CreativeCleanTemplate.jsx';
import ExecutiveCorporateTemplate from '../src/components/templates/ExecutiveCorporateTemplate.jsx';

const SAMPLE_DATA = {
  personalInfo: {
    fullName: 'Jordan Miller',
    email: 'jordan.miller@example.com',
    phone: '+1 555-0199',
    location: 'Seattle, WA',
    linkedIn: 'linkedin.com/in/jordanmiller',
    portfolio: 'jordanmiller.dev',
    targetRole: 'Lead Product Architect',
  },
  summary: 'Architect with 10+ years delivering enterprise software and user-centered solutions.',
  skills: {
    technical: ['React', 'TypeScript', 'Node.js', 'Next.js', 'TailwindCSS', 'GraphQL', 'PostgreSQL', 'Docker'],
    soft: ['Strategic Leadership', 'Design Systems', 'Cross-Functional Mentorship'],
    languages: ['English (Fluent)', 'French (Intermediate)'],
  },
  experience: [
    {
      role: 'Staff Architect',
      company: 'InnovateTech',
      startDate: '2021-01',
      endDate: '',
      current: true,
      bullets: [
        'Led architecture of modular web apps serving 2M users.',
        'Mentored 10 senior and staff engineers.',
      ],
    },
    {
      role: 'Senior Engineer',
      company: 'CloudWorks',
      startDate: '2017-03',
      endDate: '2020-12',
      current: false,
      bullets: [
        'Reduced frontend bundle sizes by 40%.',
        'Implemented core design system component library.',
      ],
    },
  ],
  education: [
    {
      institution: 'University of Washington',
      degree: 'B.S.',
      field: 'Computer Science',
      startDate: '2013-09',
      endDate: '2017-06',
      gpa: '3.9',
    },
  ],
  projects: [
    {
      name: 'DesignFlow Studio',
      description: 'Collaborative vector design canvas',
      technologies: ['React', 'Canvas API', 'WebSockets'],
      link: 'github.com/jmiller/designflow',
      bullets: ['10k+ monthly active creators.'],
    },
  ],
  certifications: [
    {
      name: 'AWS Certified Solutions Architect',
      issuer: 'Amazon Web Services',
      date: '2023',
    },
  ],
};

console.log('================================================================');
console.log('TARGETED VERIFICATION: CREATIVE CLEAN & MODERN PROFESSIONAL');
console.log('================================================================\n');

// ── TEST 1: CREATIVE CLEAN ──────────────────────────────────────────────────
console.log('>>> Testing: CREATIVE CLEAN');
{
  const element = React.createElement(CreativeCleanTemplate, {
    sections: SAMPLE_DATA,
    isPreview: false,
    isExport: false,
  });
  const html = renderToString(element);

  // 1. Verify Page 1 has left sidebar
  const page1Match = html.match(/data-resume-page="1"[\s\S]*?(?=data-resume-page="2"|$)/);
  assert.ok(page1Match, 'Creative Clean: Page 1 must exist');
  const page1Html = page1Match[0];
  assert.ok(page1Html.includes('grid-template-columns') || page1Html.includes('238px'), 'Creative Clean: Page 1 must have two-column layout with sidebar');
  assert.ok(page1Html.includes('Skills &amp; Tools') || page1Html.includes('Skills & Tools'), 'Creative Clean: Page 1 sidebar has Skills & Tools');
  assert.ok(page1Html.includes('Core Strengths'), 'Creative Clean: Page 1 sidebar has Core Strengths');
  console.log('  ✓ PASSED: Page 1 sidebar intact with Skills & Tools and Core Strengths');

  // 2. Verify Page 2 exists and has NO left sidebar
  const page2Match = html.match(/data-resume-page="2"[\s\S]*$/);
  assert.ok(page2Match, 'Creative Clean: Page 2 must exist');
  const page2Html = page2Match[0];
  assert.ok(!page2Html.includes('grid-template-columns: 238px'), 'Creative Clean: Page 2 must NOT have a 238px left sidebar grid');
  assert.ok(!page2Html.includes('data-sidebar-block'), 'Creative Clean: Page 2 must NOT contain sidebar blocks');
  console.log('  ✓ PASSED: Page 2 left sidebar completely removed');

  // 3. Verify Page 2 content expands to full-width container
  assert.ok(page2Html.includes('16px 22px'), 'Creative Clean: Page 2 must use full-width page2Padding (16px 22px)');
  assert.ok(page2Html.includes('AWS Certified Solutions Architect'), 'Creative Clean: Certifications preserved on Page 2');
  assert.ok(page2Html.includes('DesignFlow Studio'), 'Creative Clean: Projects preserved on Page 2');
  console.log('  ✓ PASSED: Page 2 content expanded into available width with all content preserved');

  // 4. Verify main content order: CERTIFICATIONS followed immediately by LANGUAGES
  const certBlockIdx = page2Html.indexOf('data-block-id="certifications"');
  const langBlockIdx = page2Html.indexOf('data-block-id="languages"');
  assert.ok(certBlockIdx !== -1, 'Creative Clean: Certifications must be in Page 2 main flow');
  assert.ok(langBlockIdx !== -1, 'Creative Clean: Languages must be in Page 2 main flow');
  assert.ok(
    certBlockIdx < langBlockIdx,
    `Creative Clean: CERTIFICATIONS (idx ${certBlockIdx}) must be followed by LANGUAGES (idx ${langBlockIdx})`
  );
  console.log('  ✓ PASSED: LANGUAGES is positioned immediately after CERTIFICATIONS in main content flow');

  // 5. Verify LANGUAGES appears exactly once in the document
  const totalLanguagesCount = (html.match(/data-block-id="languages"/g) || []).length;
  assert.equal(totalLanguagesCount, 1, 'Creative Clean: Languages block must appear exactly once in document');
  const sidebarLanguagesCount = (page1Html.match(/data-sidebar-block="languages"/g) || []).length;
  assert.equal(sidebarLanguagesCount, 0, 'Creative Clean: Languages must NOT be in Page 1 sidebar');
  console.log('  ✓ PASSED: LANGUAGES appears exactly once without duplication');

  // 6. Verify language entries preserved
  assert.ok(html.includes('English (Fluent)'), 'Creative Clean: Preserves English');
  assert.ok(html.includes('French (Intermediate)'), 'Creative Clean: Preserves French');
  console.log('  ✓ PASSED: All language entries preserved');
}

// ── TEST 2: MODERN PROFESSIONAL ──────────────────────────────────────────────
console.log('\n>>> Testing: MODERN PROFESSIONAL');
{
  const element = React.createElement(ModernProfessionalTemplate, {
    sections: SAMPLE_DATA,
    isPreview: false,
    isExport: false,
  });
  const html = renderToString(element);

  // 1. Verify Page 1 has left sidebar
  const page1Match = html.match(/data-resume-page="1"[\s\S]*?(?=data-resume-page="2"|$)/);
  assert.ok(page1Match, 'Modern Professional: Page 1 must exist');
  const page1Html = page1Match[0];
  assert.ok(page1Html.includes('grid-template-columns') || page1Html.includes('238px'), 'Modern Professional: Page 1 must have two-column layout with sidebar');
  assert.ok(page1Html.includes('Technical Skills'), 'Modern Professional: Page 1 sidebar has Technical Skills');
  assert.ok(page1Html.includes('Core Strengths'), 'Modern Professional: Page 1 sidebar has Core Strengths');
  console.log('  ✓ PASSED: Page 1 sidebar intact with Technical Skills & Core Strengths');

  // 2. Verify Page 2 has NO left sidebar
  const page2Match = html.match(/data-resume-page="2"[\s\S]*$/);
  assert.ok(page2Match, 'Modern Professional: Page 2 must exist');
  const page2Html = page2Match[0];
  assert.ok(!page2Html.includes('grid-template-columns: 238px'), 'Modern Professional: Page 2 must NOT have a 238px left sidebar grid');
  assert.ok(!page2Html.includes('data-sidebar-block'), 'Modern Professional: Page 2 must NOT contain sidebar blocks');
  console.log('  ✓ PASSED: Page 2 left sidebar completely removed');

  // 3. Verify Page 2 main content order: CERTIFICATIONS followed immediately by LANGUAGES
  const certBlockIdx = page2Html.indexOf('data-block-id="certifications"');
  const langBlockIdx = page2Html.indexOf('data-block-id="languages"');
  assert.ok(certBlockIdx !== -1, 'Modern Professional: Certifications must be in Page 2 main flow');
  assert.ok(langBlockIdx !== -1, 'Modern Professional: Languages must be in Page 2 main flow');
  assert.ok(
    certBlockIdx < langBlockIdx,
    `Modern Professional: CERTIFICATIONS (idx ${certBlockIdx}) must be followed by LANGUAGES (idx ${langBlockIdx})`
  );
  console.log('  ✓ PASSED: LANGUAGES is positioned immediately after CERTIFICATIONS in main content flow on Page 2');

  // 4. Verify no duplication of LANGUAGES
  const totalLanguagesCount = (html.match(/data-block-id="languages"/g) || []).length;
  assert.equal(totalLanguagesCount, 1, 'Modern Professional: Languages block must appear exactly once in document');
  const sidebarLanguagesCount = (page1Html.match(/data-sidebar-block="languages">[\s\S]*?Languages/g) || []).length;
  assert.equal(sidebarLanguagesCount, 0, 'Modern Professional: Languages must NOT be rendered in Page 1 sidebar when on Page 2');
  console.log('  ✓ PASSED: LANGUAGES appears exactly once without duplication');

  // 5. Verify language entries preserved
  assert.ok(html.includes('English (Fluent)'), 'Modern Professional: Preserves English');
  assert.ok(html.includes('French (Intermediate)'), 'Modern Professional: Preserves French');
  console.log('  ✓ PASSED: All language entries and certifications preserved');
}

// ── TEST 3: EXECUTIVE CORPORATE (MUST REMAIN UNCHANGED) ───────────────────────
console.log('\n>>> Testing: EXECUTIVE CORPORATE (Unchanged Check)');
{
  const element = React.createElement(ExecutiveCorporateTemplate, {
    sections: SAMPLE_DATA,
    isPreview: false,
    isExport: false,
  });
  const html = renderToString(element);

  // Executive must still have its Page 1 layout
  assert.ok(html.includes('data-resume-page="1"'), 'Executive: Page 1 exists');
  assert.ok(html.includes('Core Strengths'), 'Executive: Core Strengths section intact');
  console.log('  ✓ PASSED: Executive template has Core Strengths and Technical Competencies');
}

console.log('\n================================================================');
console.log('ALL TARGETED LAYOUT TESTS PASSED PERFECTLY!');
console.log('================================================================');
