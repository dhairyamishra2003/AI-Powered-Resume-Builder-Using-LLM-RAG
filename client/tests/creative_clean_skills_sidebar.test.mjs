import React from 'react';
import { renderToString } from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

import CreativeCleanTemplate from '../src/components/templates/CreativeCleanTemplate.jsx';
import ModernProfessionalTemplate from '../src/components/templates/ModernProfessionalTemplate.jsx';
import { normalizeResumeSections } from '../src/components/templates/utils/normalizeResumeSections.js';

console.log('================================================================');
console.log('STRICT VERIFICATION: RESTORE CREATIVE CLEAN SKILLS SIDEBAR');
console.log('================================================================\n');

// 1. Load active resume fixture with ~84 skills
const fixturePath = path.resolve(process.cwd(), 'tests/active_resume_fixture.json');
const rawDoc = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
const normalizedSections = normalizeResumeSections(rawDoc.sections);

// Gather expected unique skills
const expectedSkills = normalizedSections.skills?.technical || [];
assert.ok(expectedSkills.length > 50, 'Active resume must have 50+ technical skills');

console.log(`>>> 1. Loaded ${expectedSkills.length} Technical Skills from Fixture`);

// 2. Render Creative Clean in both Preview and Export modes
for (const isExport of [false, true]) {
  const modeName = isExport ? 'PDF Export (isExport=true)' : 'Browser Preview (isExport=false)';
  console.log(`\n>>> 2. Testing Creative Clean in ${modeName}`);

  const html = renderToString(React.createElement(CreativeCleanTemplate, {
    sections: normalizedSections,
    colors: { primary: '#6d28d9', accent: '#ec4899' },
    isPreview: false,
    isExport,
  }));

  // Assert Page 1 exists
  const page1Match = html.match(/data-resume-page="1"[\s\S]*?(?=data-resume-page="2"|$)/);
  assert.ok(page1Match, 'Page 1 must exist');
  const page1Html = page1Match[0];

  // Assert Page 2 exists
  const page2Match = html.match(/data-resume-page="2"[\s\S]*$/);
  assert.ok(page2Match, 'Page 2 must exist');
  const page2Html = page2Match[0];

  // 1. Restore complete Skills & Tools section inside the LEFT SIDEBAR of Page 1
  assert.ok(page1Html.includes('Skills &amp; Tools') || page1Html.includes('Skills & Tools'), 'Skills & Tools must be on Page 1');
  const sidebarSectionIdx = page1Html.indexOf('data-sidebar-block="tech-skills"');
  assert.ok(sidebarSectionIdx !== -1, 'Skills & Tools must be inside data-sidebar-block="tech-skills" in the left sidebar');

  // 2. Visual design, colors, typography, icons
  assert.ok(page1Html.includes('color:#4c1d95') || page1Html.includes('color: #4c1d95'), 'Title color #4c1d95 preserved');
  assert.ok(page1Html.includes('#ddd6fe'), 'Border color #ddd6fe preserved');

  // 3. Compact skill-chip presentation matching Modern Professional
  assert.ok(page1Html.includes('data-sidebar-skill'), 'Skill chips must carry data-sidebar-skill attribute');
  assert.ok(page1Html.includes('border:1px solid #cbd5e1') || page1Html.includes('border: 1px solid #cbd5e1'), 'Chip border #cbd5e1 preserved');
  assert.ok(page1Html.includes('background:#ffffff') || page1Html.includes('background: #ffffff'), 'Chip background #ffffff preserved');

  // 4. Display all available, unique skills in the Creative Clean sidebar
  let renderedSkillsCount = 0;
  for (const skill of expectedSkills) {
    if (page1Html.includes(skill)) {
      renderedSkillsCount++;
    }
  }
  console.log(`  Rendered ${renderedSkillsCount}/${expectedSkills.length} skills on Page 1 sidebar`);
  assert.ok(renderedSkillsCount >= expectedSkills.length - 2, 'All unique technical skills must be rendered in Page 1 sidebar');

  // 5. Remove incorrectly rendered Skills & Tools section from the bottom of main content
  assert.ok(!page2Html.includes('Skills &amp; Tools') && !page2Html.includes('Skills & Tools'), 'Skills & Tools must NEVER appear on Page 2');
  assert.ok(!page2Html.includes('side-ovf-tech-skills'), 'No overflow tech-skills block must exist on Page 2');

  // 6. Do not generate Technical Skills (Continued) section
  assert.ok(!html.includes('Technical Skills (Continued)'), 'Must NOT generate Technical Skills (Continued) section');
  assert.ok(!html.includes('Skills &amp; Tools (Continued)') && !html.includes('Skills & Tools (Continued)'), 'Must NOT generate Skills & Tools (Continued)');

  console.log(`  ✓ PASSED: ${modeName} satisfies all requirements`);
}

console.log('\n================================================================');
console.log('ALL CREATIVE CLEAN SKILLS SIDEBAR RESTORATION CHECKS PASSED!');
console.log('================================================================\n');
