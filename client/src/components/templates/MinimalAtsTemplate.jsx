import React from 'react';

import {
  TwoPageResumeCanvas,
  PageRunningHeader,
  SectionTitle,
  ExperienceItem,
  ProjectCard,
  EducationItem,
  SummaryCard,
  PublicationItem,
} from './engine/LayoutEngine.jsx';

import { normalizeResumeSections } from './utils/normalizeResumeSections.js';
import { withPlaceholder } from './utils/placeholderData.js';
import { getTemplateTypography } from '../../config/resumeTypography.js';
import styles from './MinimalAtsTemplate.module.css';

function MinimalAtsTemplate({
  sections,
  colors,
  isPreview = false,
}) {
  const normalizedSections = normalizeResumeSections(sections || {});

  const personalInfo   = withPlaceholder('personalInfo',   normalizedSections.personalInfo,   normalizedSections, isPreview);
  const summary        = withPlaceholder('summary',        normalizedSections.summary,        normalizedSections, isPreview);
  const experience     = withPlaceholder('experience',     normalizedSections.experience,     normalizedSections, isPreview);
  const education      = withPlaceholder('education',      normalizedSections.education,      normalizedSections, isPreview);
  const skills         = withPlaceholder('skills',         normalizedSections.skills,         normalizedSections, isPreview);
  const projects       = withPlaceholder('projects',       normalizedSections.projects,       normalizedSections, isPreview);
  const certifications = withPlaceholder('certifications', normalizedSections.certifications, normalizedSections, isPreview);
  const publications   = withPlaceholder('publications',   normalizedSections.publications,   normalizedSections, isPreview);

  const primary = colors?.primary || '#0f172a';
  const secondary = colors?.accent || '#334155';
  const muted = '#64748b';
  const typo = getTemplateTypography('minimal-ats');

  const techSkills          = (skills.technical || []).filter((s) => s && typeof s === 'string' && s.trim());
  const rawSoft             = skills.soft || skills.coreStrengths || skills.softSkills || skills.strengths || [];
  const softSkills          = (rawSoft          || []).filter((s) => s && typeof s === 'string' && s.trim());
  const languages           = (skills.languages || []).filter((l) => l && typeof l === 'string' && l.trim());
  const validExperience     = (experience    || []).filter((e) => e && (e.role   || e.company));
  const validProjects       = (projects      || []).filter((p) => p && (p.name   || p.description));
  const validEducation      = (education     || []).filter((e) => e && (e.degree || e.institution));
  const validCertifications = (certifications|| []).filter((c) => c && c.name);
  const validPublications   = (publications  || []).filter((pub) => pub && (pub.title || pub.publisher));

  const sectionStyle = {
    fontSize: typo.sectionTitle,
    marginBottom: '6px',
    paddingBottom: '3px',
    fontFamily: "Georgia, 'Times New Roman', serif",
  };

  const contactParts = [
    personalInfo.phone,
    personalInfo.email,
    personalInfo.location,
    personalInfo.linkedIn ? personalInfo.linkedIn.replace(/^https?:\/\/(www\.)?/i, '') : '',
    personalInfo.portfolio ? personalInfo.portfolio.replace(/^https?:\/\/(www\.)?/i, '') : '',
  ].filter(Boolean);

  // ── Header (Page 1 ONLY) ────────────────────────────────────────────────────
  const header = (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: '20px',
        padding: '20px 26px 12px',
        borderBottom: `2.5px solid ${primary}`,
        boxSizing: 'border-box',
        width: '100%',
        background: '#ffffff',
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <h1
          style={{
            margin: 0,
            fontSize: typo.name,
            lineHeight: 1.1,
            fontWeight: 800,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            color: primary,
            overflowWrap: 'anywhere',
          }}
        >
          {personalInfo.fullName || (isPreview ? 'Alex Johnson' : 'Your Name')}
        </h1>

        {(personalInfo.targetRole || isPreview) && (
          <div
            style={{
              marginTop: '4px',
              fontSize: typo.targetRole,
              fontStyle: 'italic',
              lineHeight: 1.25,
              fontWeight: 600,
              color: secondary,
              overflowWrap: 'anywhere',
            }}
          >
            {personalInfo.targetRole || 'Executive Professional'}
          </div>
        )}
      </div>

      {contactParts.length > 0 && (
        <div
          style={{
            textAlign: 'right',
            color: muted,
            fontSize: typo.contact,
            lineHeight: 1.45,
            overflowWrap: 'anywhere',
          }}
        >
          {contactParts.map((item, idx) => (
            <div key={idx} style={{ overflowWrap: 'anywhere' }}>{item}</div>
          ))}
        </div>
      )}
    </header>
  );

  // ── Logical Atomic Content Blocks ──────────────────────────────────────────
  const blocks = [];

  // 1. Summary
  if (summary && summary.trim()) {
    blocks.push({
      id: 'summary',
      type: 'summary',
      render: () => (
        <div>
          <SectionTitle
            title="Professional Summary"
            primaryColor={primary}
            accentColor={primary}
            borderColor={primary}
            style={sectionStyle}
          />
          <p
            style={{
              margin: 0,
              fontSize: typo.summary,
              color: secondary,
              lineHeight: 1.5,
              textAlign: 'justify',
              overflowWrap: 'anywhere',
            }}
          >
            {summary}
          </p>
        </div>
      ),
    });
  }

  // 2. Skills / Technical Skills (Immediately after Summary, before Education)
  if (techSkills.length > 0) {
    blocks.push({
      id: 'skills',
      type: 'skills',
      render: () => (
        <div>
          <SectionTitle
            title="Technical Skills"
            primaryColor={primary}
            accentColor={primary}
            borderColor={primary}
            style={sectionStyle}
          />
          <div style={{ fontSize: typo.technicalSkills, color: secondary, lineHeight: 1.55, overflowWrap: 'anywhere' }}>
            {techSkills.join(' • ')}
          </div>
        </div>
      ),
    });
  } else if (softSkills.length > 0) {
    blocks.push({
      id: 'skills',
      type: 'skills',
      render: () => (
        <div>
          <SectionTitle
            title="Core Strengths"
            primaryColor={primary}
            accentColor={primary}
            borderColor={primary}
            style={sectionStyle}
          />
          <div style={{ fontSize: typo.softSkills || typo.technicalSkills, color: secondary, lineHeight: 1.55, overflowWrap: 'anywhere' }}>
            {softSkills.join(' • ')}
          </div>
        </div>
      ),
    });
  }

  // 3. Education (Following Skills)
  if (validEducation.length > 0) {
    blocks.push({
      id: 'education',
      type: 'education',
      render: ({ isFirstOfThisSectionOnPage, sectionStartedOnPrevPage }) => (
        <div>
          <SectionTitle
            title={!sectionStartedOnPrevPage ? 'Education' : 'Education (Continued)'}
            primaryColor={primary}
            accentColor={primary}
            borderColor={primary}
            style={sectionStyle}
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
                accentColor={primary}
              />
            ))}
          </div>
        </div>
      ),
    });
  }

  // 4. Experience Items
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
                primaryColor={primary}
                accentColor={primary}
                borderColor={primary}
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
              accentColor={primary}
              dateBadge={false}
            />
          </div>
        ),
      });
    });
  }

  // 5. Projects (1st project pinned to Page 1, remaining on Page 2)
  if (validProjects.length > 0) {
    validProjects.forEach((proj, idx) => {
      blocks.push({
        id: `project-${idx}`,
        type: 'projects',
        render: ({ isFirstOfThisSectionOnPage, sectionStartedOnPrevPage }) => (
          <div>
            {(idx === 0 || isFirstOfThisSectionOnPage) && (
              <SectionTitle
                title={idx === 0 || !sectionStartedOnPrevPage ? 'Key Projects' : 'Key Projects (Continued)'}
                primaryColor={primary}
                accentColor={primary}
                borderColor={primary}
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
              accentColor={primary}
              cardBg="#ffffff"
              borderColor="#e2e8f0"
              style={{
                padding: '6px 0',
                border: 'none',
                borderBottom: '1px solid #f1f5f9',
              }}
            />
          </div>
        ),
      });
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
            primaryColor={primary}
            accentColor={primary}
            borderColor={primary}
            style={sectionStyle}
          />
          <ul
            style={{
              margin: 0,
              paddingLeft: '16px',
              color: secondary,
              fontSize: typo.certification,
              lineHeight: 1.45,
            }}
          >
            {validCertifications.map((cert, idx) => (
              <li key={idx} style={{ marginBottom: '3px', overflowWrap: 'anywhere' }}>
                <strong>{cert.name}</strong>
                {cert.issuer && ` — ${cert.issuer}`}
                {cert.date && ` (${cert.date})`}
              </li>
            ))}
          </ul>
        </div>
      ),
    });
  }

  // Research Papers & Publications
  if (validPublications.length > 0) {
    blocks.push({
      id: 'publications',
      type: 'publications',
      render: () => (
        <div>
          <SectionTitle
            title="Research Papers & Publications"
            primaryColor={primary}
            accentColor={primary}
            borderColor={primary}
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
                accentColor={primary}
              />
            ))}
          </div>
        </div>
      ),
    });
  }

  // 7. Core Strengths (Dedicated section after Certifications/Publications)
  if (softSkills.length > 0 && techSkills.length > 0) {
    blocks.push({
      id: 'core-strengths',
      type: 'strengths',
      render: ({ isFirstOfThisSectionOnPage, sectionStartedOnPrevPage }) => (
        <div>
          <SectionTitle
            title={!sectionStartedOnPrevPage ? 'Core Strengths' : 'Core Strengths (Continued)'}
            primaryColor={primary}
            accentColor={primary}
            borderColor={primary}
            style={sectionStyle}
          />
          <div style={{ fontSize: typo.softSkills || typo.technicalSkills, color: secondary, lineHeight: 1.55, overflowWrap: 'anywhere' }}>
            {softSkills.join(' • ')}
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
        <div>
          <SectionTitle
            title="Languages"
            primaryColor={primary}
            accentColor={primary}
            borderColor={primary}
            style={sectionStyle}
          />
          <div style={{ fontSize: typo.language, color: secondary, overflowWrap: 'anywhere' }}>
            {languages.join(' • ')}
          </div>
        </div>
      ),
    });
  }

  return (
    <TwoPageResumeCanvas
      className={styles.container}
      header={header}
      page2Header={
        <PageRunningHeader
          fullName={personalInfo.fullName}
          targetRole={personalInfo.targetRole}
          primaryColor={primary}
          pageNum={2}
          fontFamily="Georgia, 'Times New Roman', serif"
        />
      }
      blocks={blocks}
      fontFamily="Georgia, 'Times New Roman', serif"
      mainPadding="14px 26px"
      page2Padding="16px 26px"
      blockGap={8}
    />
  );
}

export default MinimalAtsTemplate;
