import React from 'react';
import {
  HiBriefcase,
  HiAcademicCap,
  HiWrenchScrewdriver,
  HiFolder,
  HiSparkles,
  HiLanguage,
  HiUserGroup,
  HiBookOpen,
} from 'react-icons/hi2';
import {
  TwoPageResumeCanvas,
  PageRunningHeader,
  SectionTitle,
  ExperienceItem,
  SkillBadges,
  ProjectCard,
  EducationItem,
  SummaryCard,
  ContactList,
  PublicationItem,
} from './engine/LayoutEngine.jsx';
import { getTemplateTypography } from '../../config/resumeTypography.js';
import { normalizeResumeSections } from './utils/normalizeResumeSections.js';
import { withPlaceholder } from './utils/placeholderData.js';
import styles from './ModernProfessionalTemplate.module.css';

function ModernProfessionalTemplate({ sections, colors, isPreview = false }) {
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
  const rawSoft = skills.soft || skills.coreStrengths || skills.softSkills || skills.strengths || [];
  const softSkills = (rawSoft || []).filter((s) => s && typeof s === 'string' && s.trim());
  const languages = (skills.languages || []).filter((l) => l && typeof l === 'string' && l.trim());
  const validEducation = (education || []).filter((e) => e && (e.degree || e.institution));
  const validExperience = (experience || []).filter((e) => e && (e.role || e.company));
  const validProjects = (projects || []).filter((p) => p && (p.name || p.description));
  const validCertifications = (certifications || []).filter((c) => c && c.name);
  const validPublications = (publications || []).filter((pub) => pub && (pub.title || pub.publisher));

  const typo = getTemplateTypography('modern-professional');
  const sectionTitleStyle = {
    fontSize: typo.sectionTitle,
    marginBottom: '6px',
    paddingBottom: '3px',
  };

  // ── Header (Page 1 ONLY) ────────────────────────────────────────────────────
  const header = (
    <div
      style={{
        background: primaryColor,
        color: '#ffffff',
        padding: '14px 22px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `3px solid ${accentColor}`,
        flexShrink: 0,
        boxSizing: 'border-box',
        width: '100%',
        gap: '16px',
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <h1
          style={{
            fontSize: typo.name,
            fontWeight: 800,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            margin: 0,
            color: '#ffffff',
            lineHeight: 1.15,
            overflowWrap: 'anywhere',
          }}
        >
          {personalInfo.fullName || (isPreview ? 'Alex Johnson' : 'Your Name')}
        </h1>
        {(personalInfo.targetRole || isPreview) && (
          <h2
            style={{
              fontSize: typo.targetRole,
              fontWeight: 600,
              color: '#93c5fd',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              marginTop: '3px',
              margin: '3px 0 0 0',
              overflowWrap: 'anywhere',
            }}
          >
            {personalInfo.targetRole || 'Senior Professional'}
          </h2>
        )}
      </div>
      <ContactList
        personalInfo={personalInfo}
        align="right"
        accentColor="#60a5fa"
        textColor="#cbd5e1"
        style={{ fontSize: typo.contact }}
      />
    </div>
  );

  // ── Sidebar Sections (Strict Order: 1. Technical Skills, 2. Core Strengths, 3. Languages, 4. Education) ──
  // If technical skills or sidebar content is long, overflowing sections intelligently move to Page 2.
  const sidebarSections = [];

  // 1. Technical Skills
  if (techSkills.length > 0) {
    sidebarSections.push({
      id: 'tech-skills',
      type: 'skills',
      items: techSkills,
      render: ({ isOverflow, items = techSkills }) => (
        <div>
          <SectionTitle
            title={isOverflow ? 'Technical Skills (Continued)' : 'Technical Skills'}
            icon={HiWrenchScrewdriver}
            primaryColor={primaryColor}
            accentColor={accentColor}
            style={sectionTitleStyle}
          />
          <SkillBadges
            skills={items}
            background="#ffffff"
            borderColor="#cbd5e1"
            textColor="#1e293b"
            size="small"
            itemDataAttribute="data-sidebar-skill"
          />
        </div>
      ),
    });
  }

  // 2. Core Strengths (Soft Skills)
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
            primaryColor={primaryColor}
            accentColor={accentColor}
            style={sectionTitleStyle}
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
                color: '#334155',
                lineHeight: 1.45,
              }}
            >
              {softSkills.map((sk, i) => (
                <li key={i} style={{ marginBottom: '2px', overflowWrap: 'anywhere' }}>
                  {sk}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ),
    });
  }

  // 3. Languages (Requirement 2.B: In sidebar on Page 1 if 1-page; moves after Certifications on Page 2)
  if (languages.length > 0) {
    sidebarSections.push({
      id: 'languages',
      type: 'languages',
      render: ({ isOverflow, hasPage2 = true }) => {
        if (hasPage2) return null;
        return (
          <div>
            <SectionTitle
              title={isOverflow ? 'Languages (Continued)' : 'Languages'}
              icon={HiLanguage}
              primaryColor={primaryColor}
              accentColor={accentColor}
              style={sectionTitleStyle}
            />
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px 8px',
                fontSize: typo.language,
                color: '#334155',
                lineHeight: 1.45,
              }}
            >
              {languages.map((lang, i) => (
                <span
                  key={i}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '3px',
                    padding: '2px 6px',
                    fontWeight: 500,
                    overflowWrap: 'anywhere',
                  }}
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        );
      },
    });
  }

  // ── Main Content Blocks ───────────────────────────────────────────────────
  const blocks = [];

  // Summary
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

  // Education (Immediately after Summary)
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

  // Experience Items
  if (validExperience.length > 0) {
    validExperience.forEach((exp, idx) => {
      blocks.push({
        id: `exp-${idx}`,
        type: 'experience',
        render: ({ isFirstOfThisSectionOnPage, sectionStartedOnPrevPage }) => (
          <div>
            {(idx === 0 || isFirstOfThisSectionOnPage) && (
              <SectionTitle
                title={idx === 0 || !sectionStartedOnPrevPage ? 'Work Experience' : 'Work Experience (Continued)'}
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

  // Key Projects
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
                borderLeft: `3px solid ${primaryColor}`,
                padding: '7px 10px',
              }}
            />
          </div>
        ),
      });
    });
  }

  // Certifications (Requirement 8: in main flow after experience and projects)
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: validCertifications.length > 3 ? 'repeat(2, minmax(0, 1fr))' : '1fr',
              gap: '6px 14px',
              fontSize: typo.certification,
              color: '#334155',
              lineHeight: 1.45,
            }}
          >
            {validCertifications.map((cert, idx) => (
              <div key={idx} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                <strong style={{ color: '#0f172a' }}>{cert.name}</strong>
                {cert.issuer && <span style={{ color: '#64748b' }}> — {cert.issuer}</span>}
                {cert.date && <span style={{ color: '#94a3b8' }}> ({cert.date})</span>}
              </div>
            ))}
          </div>
        </div>
      ),
    });
  }

  // Research Papers & Publications
  if (validPublications.length > 0) {
    blocks.push({
      id: 'publications',
      type: 'publications',
      render: ({ isFirstOfThisSectionOnPage, sectionStartedOnPrevPage }) => (
        <div>
          <SectionTitle
            title={!sectionStartedOnPrevPage ? 'Research Papers & Publications' : 'Research Papers & Publications (Continued)'}
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

  // Languages (Requirement 2.B: On Page 2, position immediately after Certifications/Publications in main content flow)
  if (languages.length > 0) {
    blocks.push({
      id: 'languages',
      type: 'languages',
      render: ({ page = 2, isProbe = false, hasPage2 = true }) => {
        if (!isProbe && !hasPage2) return null;
        if (!isProbe && page === 1 && hasPage2) return null;
        return (
          <div>
            <SectionTitle
              title="Languages"
              icon={HiLanguage}
              primaryColor={primaryColor}
              accentColor={accentColor}
              style={sectionTitleStyle}
            />
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px 8px',
                fontSize: typo.language,
                color: '#334155',
                lineHeight: 1.45,
              }}
            >
              {languages.map((lang, i) => (
                <span
                  key={i}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '3px',
                    padding: '2px 6px',
                    fontWeight: 500,
                    overflowWrap: 'anywhere',
                  }}
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        );
      },
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
      sidebarBackground="#f8fafc"
      sidebarBorder="1px solid #e2e8f0"
      sidebarPadding="12px 10px"
      mainPadding="12px 16px"
      page2Padding="16px 22px"
      twoColumnGap={10}
      blockGap={8}
      // Keep the same two-column grid on continuation pages. Moving a long
      // skills sidebar into the full-width main flow made page two look like a
      // different template and displaced the remaining sections.
      disablePage2Sidebar={false}
    />
  );
}

export default ModernProfessionalTemplate;
