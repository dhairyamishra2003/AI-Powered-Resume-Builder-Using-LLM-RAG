import React from 'react';
import {
  HiCodeBracket,
  HiBriefcase,
  HiFolder,
  HiAcademicCap,
  HiSparkles,
  HiWrenchScrewdriver,
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
import styles from './SoftwareEngineerTemplate.module.css';

function SoftwareEngineerTemplate({ sections, colors, isPreview = false }) {
  const normalizedSections = normalizeResumeSections(sections || {});
  const personalInfo = withPlaceholder('personalInfo', normalizedSections.personalInfo, normalizedSections, isPreview);
  const summary = withPlaceholder('summary', normalizedSections.summary, normalizedSections, isPreview);
  const experience = withPlaceholder('experience', normalizedSections.experience, normalizedSections, isPreview);
  const education = withPlaceholder('education', normalizedSections.education, normalizedSections, isPreview);
  const skills = withPlaceholder('skills', normalizedSections.skills, normalizedSections, isPreview);
  const projects = withPlaceholder('projects', normalizedSections.projects, normalizedSections, isPreview);
  const certifications = withPlaceholder('certifications', normalizedSections.certifications, normalizedSections, isPreview);
  const publications = withPlaceholder('publications', normalizedSections.publications, normalizedSections, isPreview);

  const primaryColor = colors?.primary || '#0f172a';
  const accentColor = colors?.accent || '#2563eb';

  const techSkills = (skills.technical || []).filter((s) => s && typeof s === 'string' && s.trim());
  const softSkills = (skills.soft || []).filter((s) => s && typeof s === 'string' && s.trim());
  const languages = (skills.languages || []).filter((l) => l && typeof l === 'string' && l.trim());

  const validExperience = (experience || []).filter((e) => e && (e.role || e.company));
  const validProjects = (projects || []).filter((p) => p && (p.name || p.description));
  const validEducation = (education || []).filter((e) => e && (e.degree || e.institution));
  const validCertifications = (certifications || []).filter((c) => c && c.name);
  const validPublications = (publications || []).filter((pub) => pub && (pub.title || pub.publisher));

  const typo = getTemplateTypography('software-engineer');
  const sectionTitleStyle = {
    fontSize: typo.sectionTitle,
    marginBottom: '6px',
    paddingBottom: '3px',
  };

  // ── Header (Page 1 ONLY) ────────────────────────────────────────────────────
  const header = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `3px solid ${accentColor}`,
        padding: '16px 24px 14px',
        boxSizing: 'border-box',
        width: '100%',
        gap: '16px',
        background: primaryColor,
        color: '#ffffff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
        {/* Developer Icon Badge */}
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            background: accentColor,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)',
          }}
        >
          <HiCodeBracket />
        </div>
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontSize: typo.name,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              color: '#ffffff',
              margin: 0,
              lineHeight: 1.15,
              overflowWrap: 'anywhere',
            }}
          >
            {personalInfo.fullName || (isPreview ? 'Software Engineer' : 'Your Name')}
          </h1>
          <div
            style={{
              fontSize: typo.targetRole,
              fontWeight: 650,
              color: '#93c5fd',
              marginTop: '3px',
              letterSpacing: '0.3px',
              overflowWrap: 'anywhere',
            }}
          >
            {personalInfo.targetRole || 'Software Engineer'}
          </div>
        </div>
      </div>

      {/* Contact Details with Icons */}
      <ContactList
        personalInfo={personalInfo}
        align="right"
        accentColor="#60a5fa"
        textColor="#cbd5e1"
        style={{ fontSize: typo.contact }}
      />
    </div>
  );

  // ── Logical Atomic Content Blocks ──────────────────────────────────────────
  const blocks = [];

  // 1. Professional Summary
  if (summary && summary.trim()) {
    blocks.push({
      id: 'summary',
      type: 'summary',
      render: () => (
        <SummaryCard
          text={summary}
          borderColor={accentColor}
          backgroundColor="#f8fafc"
          textColor="#334155"
          style={{ fontSize: typo.summary, lineHeight: 1.5 }}
        />
      ),
    });
  }

  // 2. Technical Skills & Tech Stack (Immediately after Summary)
  if (techSkills.length > 0) {
    blocks.push({
      id: 'tech-skills',
      type: 'skills',
      render: () => (
        <div>
          <SectionTitle
            title="Technical Skills & Tech Stack"
            icon={HiWrenchScrewdriver}
            primaryColor={primaryColor}
            accentColor={accentColor}
            style={sectionTitleStyle}
          />
          <SkillBadges
            skills={techSkills}
            background="#eff6ff"
            borderColor="#bfdbfe"
            textColor="#1e40af"
          />
        </div>
      ),
    });
  }

  // 3. Education (Immediately after Skills)
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
            style={sectionTitleStyle}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {validEducation.map((edu, idx) => (
              <EducationItem
                key={idx}
                degree={edu.degree}
                field={edu.field}
                institution={edu.institution}
                startDate={edu.startDate}
                endDate={edu.endDate}
                gpa={edu.gpa}
                accentColor={accentColor}
              />
            ))}
          </div>
        </div>
      ),
    });
  }

  // 3. Software Engineering Experience
  if (validExperience.length > 0) {
    validExperience.forEach((exp, idx) => {
      blocks.push({
        id: `exp-${idx}`,
        type: 'experience',
        render: ({ isFirstOfThisSectionOnPage, sectionStartedOnPrevPage }) => (
          <div>
            {(idx === 0 || isFirstOfThisSectionOnPage) && (
              <SectionTitle
                title={idx === 0 || !sectionStartedOnPrevPage ? 'Software Engineering Experience' : 'Software Engineering Experience (Continued)'}
                icon={HiBriefcase}
                primaryColor={primaryColor}
                accentColor={accentColor}
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
              accentColor={accentColor}
              dateBadge={true}
            />
          </div>
        ),
      });
    });
  }

  // 4. Key Technical Projects
  if (validProjects.length > 0) {
    validProjects.forEach((proj, idx) => {
      blocks.push({
        id: `project-${idx}`,
        type: 'projects',
        render: ({ isFirstOfThisSectionOnPage, sectionStartedOnPrevPage }) => (
          <div>
            {(idx === 0 || isFirstOfThisSectionOnPage) && (
              <SectionTitle
                title={idx === 0 || !sectionStartedOnPrevPage ? 'Key Technical Projects' : 'Key Technical Projects (Continued)'}
                icon={HiFolder}
                primaryColor={primaryColor}
                accentColor={accentColor}
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
              accentColor={accentColor}
              cardBg="#f8fafc"
              borderColor="#e2e8f0"
              style={{
                borderLeft: `3px solid ${accentColor}`,
                padding: '7px 10px',
              }}
            />
          </div>
        ),
      });
    });
  }

  // 5. Certifications
  if (validCertifications.length > 0) {
    blocks.push({
      id: 'certifications',
      type: 'certifications',
      render: ({ isFirstOfThisSectionOnPage, sectionStartedOnPrevPage }) => (
        <div>
          <SectionTitle
            title={!sectionStartedOnPrevPage ? 'Certifications' : 'Certifications (Continued)'}
            icon={HiSparkles}
            primaryColor={primaryColor}
            accentColor={accentColor}
            style={sectionTitleStyle}
          />
          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: typo.certification, color: '#334155', lineHeight: 1.45 }}>
            {validCertifications.map((cert, idx) => (
              <li key={idx} style={{ marginBottom: '3px', overflowWrap: 'anywhere' }}>
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

  // Research Papers & Publications
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

  // 6. Core Strengths & Soft Skills
  if (softSkills.length > 0) {
    blocks.push({
      id: 'soft-skills',
      type: 'strengths',
      render: () => (
        <div>
          <SectionTitle
            title="Core Strengths & Engineering Practices"
            icon={HiUserGroup}
            primaryColor={primaryColor}
            accentColor={accentColor}
            style={sectionTitleStyle}
          />
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '5px 8px',
              fontSize: typo.softSkills,
              color: '#1e293b',
            }}
          >
            {softSkills.map((sk, i) => (
              <span
                key={i}
                style={{
                  background: '#f1f5f9',
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

  // 8. Languages (Requirement 4: previously omitted!)
  if (languages.length > 0) {
    blocks.push({
      id: 'languages',
      type: 'languages',
      render: () => (
        <div>
          <SectionTitle
            title="Languages"
            icon={HiLanguage}
            primaryColor={primaryColor}
            accentColor={accentColor}
            style={sectionTitleStyle}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: typo.language, color: '#334155' }}>
            {languages.map((language, idx) => (
              <span
                key={idx}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
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
      mainPadding="14px 22px"
      page2Padding="16px 22px"
      blockGap={8}
    />
  );
}

export default SoftwareEngineerTemplate;
