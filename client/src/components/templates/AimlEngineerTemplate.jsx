import React from 'react';
import {
  HiCpuChip,
  HiSparkles,
  HiBriefcase,
  HiAcademicCap,
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
import styles from './AimlEngineerTemplate.module.css';

function AimlEngineerTemplate({
  sections,
  colors,
  isPreview = false,
}) {
  const normalizedSections = normalizeResumeSections(sections || {});

  const personalInfo = withPlaceholder(
    'personalInfo',
    normalizedSections.personalInfo,
    normalizedSections,
    isPreview
  );
  const summary = withPlaceholder(
    'summary',
    normalizedSections.summary,
    normalizedSections,
    isPreview
  );
  const experience = withPlaceholder(
    'experience',
    normalizedSections.experience,
    normalizedSections,
    isPreview
  );
  const education = withPlaceholder(
    'education',
    normalizedSections.education,
    normalizedSections,
    isPreview
  );
  const skills = withPlaceholder(
    'skills',
    normalizedSections.skills,
    normalizedSections,
    isPreview
  );
  const projects = withPlaceholder(
    'projects',
    normalizedSections.projects,
    normalizedSections,
    isPreview
  );
  const certifications = withPlaceholder(
    'certifications',
    normalizedSections.certifications,
    normalizedSections,
    isPreview
  );
  const publications = withPlaceholder(
    'publications',
    normalizedSections.publications,
    normalizedSections,
    isPreview
  );

  const primaryColor = colors?.primary || '#0f766e';
  const accentColor = colors?.accent || '#0d9488';

  const techSkills = (skills.technical || []).filter(
    (s) => s && typeof s === 'string' && s.trim()
  );
  const rawSoft = skills.soft || skills.coreStrengths || skills.softSkills || skills.strengths || sections?.coreStrengths || sections?.strengths || [];
  const softSkills = (rawSoft || []).filter(
    (s) => s && typeof s === 'string' && s.trim()
  );
  const rawLang = (skills.languages && skills.languages.length > 0) ? skills.languages : (sections?.languages || []);
  const languages = (rawLang || []).filter(
    (l) => l && typeof l === 'string' && l.trim()
  );

  const validExperience = (experience || []).filter(
    (e) => e && (e.role || e.company)
  );
  const validProjects = (projects || []).filter(
    (p) => p && (p.name || p.description)
  );
  const validEducation = (education || []).filter(
    (e) => e && (e.degree || e.institution)
  );
  const validCertifications = (certifications || []).filter(
    (c) => c && c.name
  );
  const validPublications = (publications || []).filter(
    (pub) => pub && (pub.title || pub.publisher)
  );

  const typo = getTemplateTypography('aiml-engineer');

  const sectionTitleStyle = {
    fontSize: typo.sectionTitle,
    paddingBottom: '4px',
    marginBottom: '7px',
  };

  // ── Header (Page 1 ONLY) ────────────────────────────────────────────────────
  const header = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '18px',
        background: '#0f172a',
        color: '#ffffff',
        borderBottom: `3px solid ${primaryColor}`,
        padding: '16px 24px 14px',
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          minWidth: 0,
          flex: 1,
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: typo.headerIcon,
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(15, 118, 110, 0.4)',
          }}
        >
          <HiCpuChip />
        </div>

        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontSize: typo.name,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.7px',
              color: '#ffffff',
              margin: 0,
              lineHeight: 1.1,
              overflowWrap: 'anywhere',
            }}
          >
            {personalInfo.fullName || (isPreview ? 'Alex Johnson' : 'Your Name')}
          </h1>

          <div
            style={{
              fontSize: typo.targetRole,
              fontWeight: 650,
              color: '#5eead4',
              marginTop: '3px',
              letterSpacing: '0.4px',
              lineHeight: 1.25,
              overflowWrap: 'anywhere',
            }}
          >
            {personalInfo.targetRole || 'AI / Machine Learning Engineer'}
          </div>
        </div>
      </div>

      <ContactList
        personalInfo={personalInfo}
        align="right"
        accentColor="#5eead4"
        textColor="#cbd5e1"
        style={{ fontSize: typo.contact }}
      />
    </div>
  );

  // ── Logical Atomic Content Blocks ──────────────────────────────────────────
  const blocks = [];

  // 1. ML Stack & Technical Frameworks (Immediately after Header)
  if (techSkills.length > 0) {
    blocks.push({
      id: 'tech-skills',
      type: 'skills',
      render: () => (
        <div>
          <SectionTitle
            title="ML Stack & Technical Frameworks"
            icon={HiCpuChip}
            primaryColor={primaryColor}
            accentColor={accentColor}
            borderColor={primaryColor}
            style={sectionTitleStyle}
          />
          <SkillBadges
            skills={techSkills}
            background="#f0fdfa"
            borderColor="#99f6e4"
            textColor={primaryColor}
            style={{ gap: '5px 6px', fontSize: typo.technicalSkills, padding: '4px 8px' }}
          />
        </div>
      ),
    });
  }

  // 2. Professional Summary
  if (summary && summary.trim()) {
    blocks.push({
      id: 'summary',
      type: 'summary',
      render: () => (
        <SummaryCard
          text={summary}
          borderColor={primaryColor}
          backgroundColor="#f0fdfa"
          textColor="#134e4a"
          style={{ padding: '8px 12px', fontSize: typo.summary, lineHeight: 1.55 }}
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
            primaryColor={primaryColor}
            accentColor={accentColor}
            borderColor={primaryColor}
            style={sectionTitleStyle}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {validEducation.map((edu, idx) => (
              <EducationItem
                key={idx}
                degree={edu.degree}
                field={edu.field}
                institution={edu.institution}
                startDate={edu.startDate}
                endDate={edu.endDate}
                gpa={edu.gpa}
                accentColor={primaryColor}
              />
            ))}
          </div>
        </div>
      ),
    });
  }

  // 3. Experience Items (Engineering Experience)
  if (validExperience.length > 0) {
    validExperience.forEach((exp, idx) => {
      blocks.push({
        id: `exp-${idx}`,
        type: 'experience',
        render: ({ isFirstOfThisSectionOnPage, sectionStartedOnPrevPage }) => (
          <div>
            {(idx === 0 || isFirstOfThisSectionOnPage) && (
              <SectionTitle
                title={idx === 0 || !sectionStartedOnPrevPage ? 'Engineering Experience' : 'Engineering Experience (Continued)'}
                icon={HiBriefcase}
                primaryColor={primaryColor}
                accentColor={accentColor}
                borderColor={primaryColor}
                style={sectionTitleStyle}
              />
            )}
            <ExperienceItem
              role={exp.role}
              company={exp.company}
              startDate={exp.startDate}
              endDate={exp.endDate}
              current={exp.current}
              bullets={exp.bullets}
              accentColor={primaryColor}
              dateBadge={true}
            />
          </div>
        ),
      });
    });
  }

  // 4. Projects (AI / ML Projects & Models)
  if (validProjects.length > 0) {
    validProjects.forEach((proj, idx) => {
      blocks.push({
        id: `project-${idx}`,
        type: 'projects',
        render: ({ isFirstOfThisSectionOnPage, sectionStartedOnPrevPage }) => (
          <div
            style={{
              pageBreakInside: 'avoid',
              breakInside: 'avoid',
            }}
          >
            {(idx === 0 || isFirstOfThisSectionOnPage) && (
              <SectionTitle
                title={idx === 0 || !sectionStartedOnPrevPage ? 'AI / ML Projects & Models' : 'AI / ML Projects & Models (Continued)'}
                icon={HiFolder}
                primaryColor={primaryColor}
                accentColor={accentColor}
                borderColor={primaryColor}
                style={sectionTitleStyle}
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
              accentColor={primaryColor}
              cardBg="#ffffff"
              borderColor="#ccfbf1"
              style={{
                padding: '2px 10px',
                borderRadius: '5px',
                borderLeft: `3px solid ${primaryColor}`,
                pageBreakInside: 'avoid',
                breakInside: 'avoid',
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
      render: () => (
        <div>
          <SectionTitle
            title="Research Papers & Publications"
            icon={HiBookOpen}
            primaryColor={primaryColor}
            accentColor={accentColor}
            borderColor={primaryColor}
            style={sectionTitleStyle}
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
                accentColor={accentColor}
              />
            ))}
          </div>
        </div>
      ),
    });
  }

  // 6. Certifications & Accreditations
  if (validCertifications.length > 0) {
    blocks.push({
      id: 'certifications',
      type: 'certifications',
      render: ({ isFirstOfThisSectionOnPage, sectionStartedOnPrevPage }) => (
        <div>
          <SectionTitle
            title={!sectionStartedOnPrevPage ? 'Certifications & Accreditations' : 'Certifications & Accreditations (Continued)'}
            icon={HiSparkles}
            primaryColor={primaryColor}
            accentColor={accentColor}
            borderColor={primaryColor}
            style={sectionTitleStyle}
          />
          <ul
            style={{
              margin: 0,
              paddingLeft: '16px',
              color: '#334155',
              fontSize: typo.certification,
              lineHeight: 1.5,
            }}
          >
            {validCertifications.map((cert, idx) => (
              <li key={idx} style={{ marginBottom: '4px', overflowWrap: 'anywhere' }}>
                <strong style={{ color: '#0f172a' }}>{cert.name}</strong>
                {cert.issuer && <span style={{ color: '#64748b' }}> — {cert.issuer}</span>}
                {cert.date && <span style={{ color: '#94a3b8' }}> ({cert.date})</span>}
              </li>
            ))}
          </ul>
        </div>
      ),
    });
  }

  // 6. Core Strengths
  if (softSkills.length > 0) {
    blocks.push({
      id: 'core-strengths',
      type: 'strengths',
      render: () => (
        <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          <SectionTitle
            title="Core Strengths"
            icon={HiUserGroup}
            primaryColor={primaryColor}
            accentColor={accentColor}
            borderColor={primaryColor}
            style={sectionTitleStyle}
          />
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '5px 8px',
              fontSize: typo.softSkills,
              color: '#0f766e',
            }}
          >
            {softSkills.map((sk, i) => (
              <span
                key={i}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  padding: '3px 8px',
                  fontWeight: 600,
                  overflowWrap: 'anywhere',
                }}
              >
                {sk}
              </span>
            ))}
          </div>
        </div>
      ),
    });
  }

  // 8. Languages
  if (languages.length > 0) {
    blocks.push({
      id: 'languages',
      type: 'languages',
      render: () => (
        <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          <SectionTitle
            title="Languages"
            icon={HiLanguage}
            primaryColor={primaryColor}
            accentColor={accentColor}
            borderColor={primaryColor}
            style={sectionTitleStyle}
          />
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px 10px',
              fontSize: typo.language,
              color: '#134e4a',
            }}
          >
            {languages.map((language, idx) => (
              <span
                key={idx}
                style={{
                  background: '#f0fdfa',
                  border: '1px solid #99f6e4',
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
      header={header}
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
      className={styles.container}
      fontFamily="'Inter', system-ui, sans-serif"
      mainPadding="12px 22px"
      page2Padding="16px 22px"
      blockGap={7}
    />
  );
}

export default AimlEngineerTemplate;
