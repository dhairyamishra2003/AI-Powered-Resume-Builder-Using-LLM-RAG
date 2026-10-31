import React from 'react';
import {
  HiPaintBrush,
  HiBriefcase,
  HiAcademicCap,
  HiSparkles,
  HiFolder,
  HiLanguage,
  HiUserGroup,
  HiBookOpen,
} from 'react-icons/hi2';

import {
  TwoPageResumeCanvas,
  PageRunningHeader,
  SectionTitle,
  SkillBadges,
  ExperienceItem,
  ProjectCard,
  EducationItem,
  SummaryCard,
  ContactList,
  PublicationItem,
} from './engine/LayoutEngine.jsx';

import { getTemplateTypography } from '../../config/resumeTypography.js';
import { normalizeResumeSections } from './utils/normalizeResumeSections.js';
import { withPlaceholder } from './utils/placeholderData.js';
import styles from './CreativeCleanTemplate.module.css';

function CreativeCleanTemplate({
  sections,
  colors,
  isPreview = false,
}) {
  const normalizedSections = normalizeResumeSections(sections || {});

  const personalInfo = withPlaceholder('personalInfo', normalizedSections.personalInfo, normalizedSections, isPreview);
  const summary = withPlaceholder('summary', normalizedSections.summary, normalizedSections, isPreview);
  const experience = withPlaceholder('experience', normalizedSections.experience, normalizedSections, isPreview);
  const education = withPlaceholder('education', normalizedSections.education, normalizedSections, isPreview);
  const skills = withPlaceholder('skills', normalizedSections.skills, normalizedSections, isPreview);
  const projects = withPlaceholder('projects', normalizedSections.projects, normalizedSections, isPreview);
  const certifications = withPlaceholder('certifications', normalizedSections.certifications, normalizedSections, isPreview);
  const publications = withPlaceholder('publications', normalizedSections.publications, normalizedSections, isPreview);

  const primaryColor = colors?.primary || '#6d28d9';
  const accentColor = colors?.accent || '#ec4899';

  // Comprehensive extraction of all existing technical/domain skills, tools, frameworks, and languages
  const rawSkillSources = [
    skills.programmingLanguages,
    skills.programming,
    sections?.skills?.programmingLanguages,
    sections?.skills?.programming,
    sections?.programmingLanguages,
    skills.technical,
    sections?.skills?.technical,
    sections?.skills?.tech,
    sections?.skills?.hard,
    sections?.technicalSkills,
    skills.frameworks,
    sections?.skills?.frameworks,
    sections?.frameworks,
    skills.libraries,
    sections?.skills?.libraries,
    sections?.libraries,
    skills.databases,
    sections?.skills?.databases,
    sections?.databases,
    skills.tools,
    skills.developerTools,
    sections?.skills?.tools,
    sections?.skills?.developerTools,
    sections?.tools,
    skills.technologies,
    skills.techStack,
    sections?.skills?.technologies,
    sections?.skills?.techStack,
    sections?.technologies,
    skills.aiml,
    skills.ai,
    skills.ml,
    skills.machineLearning,
    sections?.skills?.aiml,
    sections?.skills?.ai,
    sections?.skills?.ml,
    skills.cloud,
    skills.platforms,
    skills.devops,
    sections?.skills?.cloud,
    sections?.skills?.platforms,
    sections?.skills?.devops,
  ];

  const excludedCategoryKeys = new Set([
    'soft',
    'softskills',
    'corestrengths',
    'strengths',
    'interpersonal',
    'languages',
    'spokenlanguages',
  ]);

  const extractCustomCategorySkills = (container) => {
    if (!container || typeof container !== 'object' || Array.isArray(container)) return [];
    const items = [];
    for (const [key, val] of Object.entries(container)) {
      const normalizedKey = key.toLowerCase().replace(/[^a-z]/g, '');
      if (excludedCategoryKeys.has(normalizedKey)) continue;
      if (Array.isArray(val)) {
        items.push(...val);
      } else if (typeof val === 'string' && val.trim()) {
        items.push(val.trim());
      }
    }
    return items;
  };

  const allRawSkillCandidates = [
    ...rawSkillSources.flat(Infinity).filter(Boolean),
    ...extractCustomCategorySkills(skills),
    ...extractCustomCategorySkills(sections?.skills),
  ];

  const seenSkillSet = new Set();
  const techSkills = [];
  for (const rawItem of allRawSkillCandidates) {
    if (!rawItem) continue;
    const splitItems = typeof rawItem === 'string' && rawItem.includes(',')
      ? rawItem.split(',').map((s) => s.trim()).filter(Boolean)
      : [typeof rawItem === 'string' ? rawItem.trim() : String(rawItem || '').trim()];
    for (const item of splitItems) {
      if (!item) continue;
      const lower = item.toLowerCase();
      if (!seenSkillSet.has(lower)) {
        seenSkillSet.add(lower);
        techSkills.push(item);
      }
    }
  }

  const rawSoft = skills.soft || skills.coreStrengths || skills.softSkills || skills.strengths || sections?.coreStrengths || sections?.strengths || [];
  const softSkills = (rawSoft || []).filter((s) => s && typeof s === 'string' && s.trim());
  const rawLang = skills.languages || sections?.languages || [];
  const languages = (rawLang || []).filter((l) => l && typeof l === 'string' && l.trim());
  const validEducation = (education || []).filter((e) => e && (e.degree || e.institution));
  const validExperience = (experience || []).filter((e) => e && (e.role || e.company));
  const validProjects = (projects || []).filter((p) => p && (p.name || p.description));
  const validCertifications = (certifications || []).filter((c) => c && c.name);
  const validPublications = (publications || []).filter((pub) => pub && (pub.title || pub.publisher));

  const typo = getTemplateTypography('creative-clean');
  const sectionStyle = {
    fontSize: typo.sectionTitle,
    marginBottom: '6px',
    paddingBottom: '3px',
  };

  // ── Header (Page 1 ONLY) ────────────────────────────────────────────────────
  const header = (
    <div
      style={{
        position: 'relative',
        padding: '13px 20px 11px',
        background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 58%, #fdf2f8 100%)',
        borderBottom: `3.5px solid ${primaryColor}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '18px',
        flexShrink: 0,
        overflow: 'hidden',
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '90px',
          height: '90px',
          borderRadius: '50%',
          background: '#f5d0fe',
          opacity: 0.35,
          right: '-28px',
          top: '-42px',
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: typo.headerIcon,
            flexShrink: 0,
            transform: 'rotate(-3deg)',
            boxShadow: '0 3px 8px rgba(109, 40, 217, 0.22)',
          }}
        >
          <HiPaintBrush />
        </div>
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontSize: typo.name,
              fontWeight: 800,
              color: '#4c1d95',
              letterSpacing: '0.55px',
              margin: 0,
              lineHeight: 1.15,
              overflowWrap: 'anywhere',
            }}
          >
            {personalInfo.fullName || (isPreview ? 'Alex Johnson' : 'Your Name')}
          </h1>
          <div
            style={{
              fontSize: typo.targetRole,
              fontWeight: 700,
              color: accentColor,
              letterSpacing: '0.65px',
              textTransform: 'uppercase',
              marginTop: '3px',
              lineHeight: 1.2,
              overflowWrap: 'anywhere',
            }}
          >
            {personalInfo.targetRole || 'Creative Designer & Product Lead'}
          </div>
        </div>
      </div>
      <ContactList
        personalInfo={personalInfo}
        align="right"
        accentColor={primaryColor}
        textColor="#4c1d95"
        style={{ fontSize: typo.contact }}
      />
    </div>
  );

  // ── Sidebar Sections (Page 1 with Smart Overflow Support) ───────────────────
  const sidebarSections = [];

  // Skills & Tools
  if (techSkills.length > 0) {
    sidebarSections.push({
      id: 'tech-skills',
      type: 'skills',
      render: () => (
        <div>
          <SectionTitle
            title="Skills & Tools"
            icon={HiPaintBrush}
            primaryColor="#4c1d95"
            accentColor={accentColor}
            borderColor="#ddd6fe"
            style={sectionStyle}
          />
          <SkillBadges
            skills={techSkills}
            size="small"
            textColor="#581c87"
            borderColor="#c4b5fd"
            style={{ gap: '6px 5px' }}
            itemDataAttribute="data-sidebar-skill"
          />
        </div>
      ),
    });
  }

  // Core Strengths
  if (softSkills.length > 0) {
    sidebarSections.push({
      id: 'core-strengths',
      type: 'strengths',
      items: softSkills,
      render: ({ isOverflow, isSidebar = true }) => (
        <div>
          <SectionTitle
            title={isOverflow ? 'Core Strengths (Continued)' : 'Core Strengths'}
            icon={HiUserGroup}
            primaryColor="#4c1d95"
            accentColor={accentColor}
            borderColor="#ddd6fe"
            style={sectionStyle}
          />
          <div
            style={
              isSidebar
                ? undefined
                : {
                    display: 'grid',
                    gridTemplateColumns: softSkills.length > 3 ? 'repeat(2, minmax(0, 1fr))' : '1fr',
                    gap: '4px 16px',
                  }
            }
          >
            <ul
              style={{
                margin: 0,
                paddingLeft: '15px',
                fontSize: typo.softSkills,
                color: '#4c1d95',
                lineHeight: 1.35,
              }}
            >
              {softSkills.map((skill, idx) => (
                <li key={idx} style={{ marginBottom: '3px', overflowWrap: 'anywhere' }}>
                  {skill}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ),
    });
  }


  // ── Logical Atomic Content Blocks ──────────────────────────────────────────
  const blocks = [];

  // 1. Summary
  if (summary && summary.trim()) {
    blocks.push({
      id: 'summary',
      type: 'summary',
      render: () => (
        <SummaryCard
          text={summary}
          borderColor={accentColor}
          backgroundColor="#faf5ff"
          textColor="#4c1d95"
          style={{ padding: '7px 11px', fontSize: typo.summary, lineHeight: 1.45 }}
        />
      ),
    });
  }

  // 2. Education (Immediately after Summary)
  if (validEducation.length > 0) {
    blocks.push({
      id: 'education',
      type: 'education',
      render: ({ isFirstOfThisSectionOnPage, sectionStartedOnPrevPage }) => (
        <div>
          <SectionTitle
            title={!sectionStartedOnPrevPage ? 'Education' : 'Education (Continued)'}
            icon={HiAcademicCap}
            primaryColor="#4c1d95"
            accentColor={accentColor}
            borderColor="#ddd6fe"
            style={sectionStyle}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {validEducation.map((edu, idx) => (
              <div
                key={idx}
                style={{
                  padding: '6px 8px',
                  background: '#ffffff',
                  border: '1px solid #ede9fe',
                  borderRadius: '5px',
                }}
              >
                <EducationItem
                  degree={edu.degree}
                  field={edu.field}
                  institution={edu.institution}
                  startDate={edu.startDate}
                  endDate={edu.endDate}
                  gpa={edu.gpa}
                  accentColor={primaryColor}
                />
              </div>
            ))}
          </div>
        </div>
      ),
    });
  }

  // 3. Experience Items
  if (validExperience.length > 0) {
    validExperience.forEach((exp, idx) => {
      blocks.push({
        id: `exp-${idx}`,
        type: 'experience',
        render: ({ isFirstOfThisSectionOnPage, sectionStartedOnPrevPage }) => (
          <div>
            {(idx === 0 || isFirstOfThisSectionOnPage) && (
              <SectionTitle
                title={idx === 0 || !sectionStartedOnPrevPage ? 'Professional Experience' : 'Professional Experience (Continued)'}
                icon={HiBriefcase}
                primaryColor="#4c1d95"
                accentColor={accentColor}
                borderColor="#ddd6fe"
                style={sectionStyle}
              />
            )}
            <ExperienceItem
              role={exp.role}
              company={exp.company}
              startDate={exp.startDate}
              endDate={exp.endDate}
              current={exp.current}
              bullets={exp.bullets}
              accentColor={accentColor}
              dateBadge={true}
            />
          </div>
        ),
      });
    });
  }

  // 4. Featured Projects
  if (validProjects.length > 0) {
    validProjects.forEach((proj, idx) => {
      blocks.push({
        id: `project-${idx}`,
        type: 'projects',
        render: ({ isFirstOfThisSectionOnPage, sectionStartedOnPrevPage }) => (
          <div>
            {(idx === 0 || isFirstOfThisSectionOnPage) && (
              <SectionTitle
                title={idx === 0 || !sectionStartedOnPrevPage ? 'Featured Projects' : 'Featured Projects (Continued)'}
                icon={HiFolder}
                primaryColor="#4c1d95"
                accentColor={accentColor}
                borderColor="#ddd6fe"
                style={sectionStyle}
              />
            )}
            <ProjectCard
              name={proj.name}
              description={proj.description}
              technologies={proj.technologies}
              link={proj.link}
              startDate={proj.startDate}
              endDate={proj.endDate}
              date={proj.date}
              bullets={proj.bullets}
              accentColor={accentColor}
              cardBg="#ffffff"
              borderColor="#e9d5ff"
              style={{
                padding: '7px 10px',
                borderRadius: '5px',
                borderLeft: `3px solid ${primaryColor}`,
              }}
            />
          </div>
        ),
      });
    });
  }

  // 5. Research Papers & Publications (Immediately after Projects and before Certifications)
  if (validPublications.length > 0) {
    blocks.push({
      id: 'publications',
      type: 'publications',
      render: ({ isFirstOfThisSectionOnPage, sectionStartedOnPrevPage }) => (
        <div>
          <SectionTitle
            title={!sectionStartedOnPrevPage ? 'Research Papers & Publications' : 'Research Papers & Publications (Continued)'}
            icon={HiBookOpen}
            primaryColor="#4c1d95"
            accentColor={accentColor}
            borderColor="#ddd6fe"
            style={sectionStyle}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {validPublications.map((pub, idx) => (
              <PublicationItem
                key={idx}
                title={pub.title}
                publisher={pub.publisher}
                authors={pub.authors}
                date={pub.date}
                link={pub.link}
                description={pub.description}
                accentColor={primaryColor}
              />
            ))}
          </div>
        </div>
      ),
    });
  }

  // 6. Certifications
  if (validCertifications.length > 0) {
    blocks.push({
      id: 'certifications',
      type: 'certifications',
      render: ({ isFirstOfThisSectionOnPage, sectionStartedOnPrevPage }) => (
        <div>
          <SectionTitle
            title={!sectionStartedOnPrevPage ? 'Certifications' : 'Certifications (Continued)'}
            icon={HiSparkles}
            primaryColor="#4c1d95"
            accentColor={accentColor}
            borderColor="#ddd6fe"
            style={sectionStyle}
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: validCertifications.length > 3 ? 'repeat(2, minmax(0, 1fr))' : '1fr',
              gap: '6px 12px',
              fontSize: typo.certification,
              color: '#4c1d95',
              lineHeight: 1.35,
            }}
          >
            {validCertifications.map((cert, idx) => (
              <div key={idx} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                <span style={{ fontWeight: 700, color: '#4c1d95' }}>{cert.name}</span>
                {cert.issuer && <span style={{ color: '#7c3aed' }}> — {cert.issuer}</span>}
                {cert.date && <span style={{ color: '#a855f7' }}> ({cert.date})</span>}
              </div>
            ))}
          </div>
        </div>
      ),
    });
  }

  // 7. Languages (immediately after Certifications/Publications in main content flow)
  if (languages.length > 0) {
    blocks.push({
      id: 'languages',
      type: 'languages',
      render: ({ isFirstOfThisSectionOnPage, sectionStartedOnPrevPage }) => (
        <div>
          <SectionTitle
            title={!sectionStartedOnPrevPage ? 'Languages' : 'Languages (Continued)'}
            icon={HiLanguage}
            primaryColor="#4c1d95"
            accentColor={accentColor}
            borderColor="#ddd6fe"
            style={sectionStyle}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: typo.language, color: '#4c1d95' }}>
            {languages.map((language, idx) => (
              <span
                key={idx}
                style={{
                  background: '#faf5ff',
                  border: '1px solid #d8b4fe',
                  borderRadius: '3px',
                  padding: '3px 8px',
                  fontWeight: 500,
                  overflowWrap: 'anywhere',
                }}
              >
                {language}
              </span>
            ))}
          </div>
        </div>
      ),
    });
  }

  return (
    <TwoPageResumeCanvas
      className={styles.container}
      header={header}
      sidebarSections={sidebarSections}
      page2Header={
        <PageRunningHeader
          fullName={personalInfo.fullName}
          targetRole={personalInfo.targetRole}
          primaryColor={primaryColor}
          pageNum={2}
          fontFamily="'Inter', system-ui, sans-serif"
        />
      }
      blocks={blocks}
      fontFamily="'Inter', system-ui, sans-serif"
      sidebarWidth="238px"
      lockSidebarWidth={true}
      sidebarBackground="#faf5ff"
      sidebarBorder="1px solid #e9d5ff"
      sidebarPadding="12px 10px"
      mainPadding="12px 14px"
      page2Padding="16px 22px"
      twoColumnGap={10}
      blockGap={8}
      disablePage2Sidebar={true}
    />
  );
}

export default CreativeCleanTemplate;
