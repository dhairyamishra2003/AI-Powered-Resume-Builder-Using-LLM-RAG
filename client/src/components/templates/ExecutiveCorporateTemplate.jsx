import React from 'react';
import {
  HiBriefcase,
  HiAcademicCap,
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
  ProjectCard,
  EducationItem,
  SummaryCard,
  ContactList,
  PublicationItem,
} from './engine/LayoutEngine.jsx';

import { getTemplateTypography } from '../../config/resumeTypography.js';
import { normalizeResumeSections } from './utils/normalizeResumeSections.js';
import { withPlaceholder } from './utils/placeholderData.js';

function ExecutiveCorporateTemplate({ sections, colors, isPreview = false }) {
  const normalizedSections = normalizeResumeSections(sections || {});
  const personalInfo = withPlaceholder('personalInfo', normalizedSections.personalInfo, normalizedSections, isPreview);
  const summary = withPlaceholder('summary', normalizedSections.summary, normalizedSections, isPreview);
  const experience = withPlaceholder('experience', normalizedSections.experience, normalizedSections, isPreview);
  const education = withPlaceholder('education', normalizedSections.education, normalizedSections, isPreview);
  const skills = withPlaceholder('skills', normalizedSections.skills, normalizedSections, isPreview);
  const projects = withPlaceholder('projects', normalizedSections.projects, normalizedSections, isPreview);
  const certifications = withPlaceholder('certifications', normalizedSections.certifications, normalizedSections, isPreview);
  const publications = withPlaceholder('publications', normalizedSections.publications, normalizedSections, isPreview);

  const primaryColor = colors?.primary || '#1e1b4b';
  const accentColor = colors?.accent || '#d97706';

  const rawTech = [
    ...(Array.isArray(skills.technical) ? skills.technical : []),
    ...(Array.isArray(skills.tools) ? skills.tools : []),
    ...(Array.isArray(skills.frameworks) ? skills.frameworks : []),
    ...(Array.isArray(skills.databases) ? skills.databases : []),
    ...(Array.isArray(skills.libraries) ? skills.libraries : []),
  ];
  const techSkills = [...new Set(rawTech.map((s) => (typeof s === 'string' ? s.trim() : String(s || '').trim())).filter(Boolean))];

  const rawSoft = Array.isArray(skills.soft) ? skills.soft : (skills.coreStrengths || skills.softSkills || skills.strengths || []);
  const softSkills = [...new Set(rawSoft.map((s) => (typeof s === 'string' ? s.trim() : String(s || '').trim())).filter(Boolean))];

  const languages = (skills.languages || []).filter((l) => l && typeof l === 'string' && l.trim());

  const validEducation = (education || []).filter((e) => e && (e.degree || e.institution));
  const validCertifications = (certifications || []).filter((c) => c && c.name);
  const validPublications = (publications || []).filter((pub) => pub && (pub.title || pub.publisher));
  const validExperience = (experience || []).filter((e) => e && (e.role || e.company));
  const validProjects = (projects || []).filter((p) => p && (p.name || p.description));

  const allSkillsList = [
    ...techSkills.map((name) => ({ name, type: 'tech' })),
    ...softSkills.map((name) => ({ name, type: 'soft' })),
  ];

  const typo = getTemplateTypography('executive-corporate');
  const sectionTitleStyle = {
    fontSize: typo.sectionTitle,
    marginBottom: '6px',
    paddingBottom: '3px',
    fontFamily: "Georgia, 'Times New Roman', serif",
  };

  // ── Header (Page 1 ONLY) ────────────────────────────────────────────────────
  const header = (
    <div
      style={{
        background: primaryColor,
        color: '#ffffff',
        padding: '16px 24px 14px',
        borderBottom: `3.5px solid ${accentColor}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
        boxSizing: 'border-box',
        width: '100%',
        gap: '16px',
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <h1
          style={{
            fontSize: typo.name,
            fontWeight: 'bold',
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            margin: 0,
            color: '#ffffff',
            lineHeight: 1.15,
            overflowWrap: 'anywhere',
          }}
        >
          {personalInfo.fullName || (isPreview ? 'Executive Candidate' : 'Your Name')}
        </h1>
        {(personalInfo.targetRole || isPreview) && (
          <h2
            style={{
              fontSize: typo.targetRole,
              fontStyle: 'italic',
              color: '#fef3c7',
              letterSpacing: '0.8px',
              marginTop: '3px',
              margin: '3px 0 0 0',
              overflowWrap: 'anywhere',
            }}
          >
            {personalInfo.targetRole || 'Chief Executive Officer / Vice President'}
          </h2>
        )}
      </div>
      <ContactList
        personalInfo={personalInfo}
        align="right"
        accentColor="#fbbf24"
        textColor="#e2e8f0"
        style={{ fontSize: typo.contact }}
      />
    </div>
  );

  // Helper to render compact vertical list of skills in sidebar
  const renderSkillList = (skillArray = [], measureItems = false, isSidebar = true) => (
    <div
      style={{
        display: 'flex',
        flexDirection: isSidebar ? 'column' : 'row',
        flexWrap: isSidebar ? 'nowrap' : 'wrap',
        gap: isSidebar ? '5px' : '8px 16px',
        fontSize: typo.technicalSkills,
        color: '#334155',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {(skillArray || []).map((sk, i) => {
        const skillName = typeof sk === 'string' ? sk : (sk?.name || String(sk || ''));
        const skillType = typeof sk === 'object' && sk?.type ? sk.type : 'soft';
        if (!skillName) return null;
        return (
          <div
            key={`sk-${i}`}
            {...(measureItems ? { 'data-sidebar-skill': '' } : {})}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
              width: isSidebar ? '100%' : 'auto',
              boxSizing: 'border-box',
              minWidth: 0,
            }}
          >
            <span
              style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: skillType === 'tech' ? accentColor : primaryColor,
                display: 'inline-block',
                flexShrink: 0,
                marginTop: '5px',
              }}
            />
            <span
              style={{
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
                lineHeight: 1.35,
                fontWeight: 500,
                flex: isSidebar ? 1 : undefined,
                minWidth: 0,
                boxSizing: 'border-box',
              }}
            >
              {skillName}
            </span>
          </div>
        );
      })}
    </div>
  );

  // ── Page 1 Sidebar Sections ─────────────────────────────────────────────────
  const sidebarSections = [];

  // 1. Technical Competencies
  if (techSkills.length > 0) {
    sidebarSections.push({
      id: 'tech-skills',
      type: 'skills',
      items: techSkills.map((name) => ({ name, type: 'tech' })),
      render: ({ isOverflow, items = techSkills.map((name) => ({ name, type: 'tech' })) }) => (
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
          <SectionTitle
            title={isOverflow ? 'Technical Competencies (Continued)' : 'Technical Competencies'}
            icon={HiBriefcase}
            primaryColor={primaryColor}
            accentColor={accentColor}
            style={sectionTitleStyle}
          />
          {renderSkillList(items, true)}
        </div>
      ),
    });
  }



  // ── Page 2 Sidebar (Visible on Page 2 with remaining skills + Languages at bottom) ──
  if (languages.length > 0) {
    sidebarSections.push({
      id: 'languages',
      type: 'languages',
      render: ({ isOverflow }) => (
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
          <SectionTitle
            title={isOverflow ? 'Languages (Continued)' : 'Languages'}
            icon={HiLanguage}
            primaryColor={primaryColor}
            accentColor={accentColor}
            style={sectionTitleStyle}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: typo.language, color: '#334155' }}>
            {languages.map((lang, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: accentColor, flexShrink: 0 }} />
                <span style={{ overflowWrap: 'anywhere', lineHeight: 1.35, fontWeight: 500 }}>{lang}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    });
  }

  // Page 2 continuation is supplied by the shared measured sidebar engine.
  const page2Skills = [];
  const hasPage2Sidebar = false;

  const page2Sidebar = hasPage2Sidebar ? (
    <div style={{ width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {page2Skills.length > 0 && (
        <div style={{ width: '100%', boxSizing: 'border-box', paddingTop: '4px' }}>
          {renderSkillList(page2Skills)}
        </div>
      )}

      {languages.length > 0 && (
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
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
              flexDirection: 'column',
              gap: '6px',
              fontSize: typo.language,
              color: '#334155',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {languages.map((lang, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  width: '100%',
                  boxSizing: 'border-box',
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: accentColor,
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
                <span style={{ overflowWrap: 'anywhere', lineHeight: 1.35, fontWeight: 500 }}>
                  {lang}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  ) : null;

  // ── Main Content Blocks ───────────────────────────────────────────────────
  const blocks = [];

  // 1. Executive Summary
  if (summary && summary.trim()) {
    blocks.push({
      id: 'summary',
      type: 'summary',
      render: () => (
        <SummaryCard
          text={summary}
          borderColor={accentColor}
          backgroundColor="#fcfcfd"
          textColor="#334155"
          style={{
            fontStyle: 'italic',
            borderLeftColor: accentColor,
            fontSize: typo.summary,
            lineHeight: 1.55,
          }}
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
            title="Education"
            icon={HiAcademicCap}
            primaryColor={primaryColor}
            accentColor={accentColor}
            style={sectionTitleStyle}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
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

  // 2. Leadership Experience
  if (validExperience.length > 0) {
    validExperience.forEach((exp, idx) => {
      blocks.push({
        id: `experience-${idx}`,
        type: 'experience',
        render: ({ isFirstOfThisSectionOnPage, sectionStartedOnPrevPage }) => (
          <div>
            {(idx === 0 || isFirstOfThisSectionOnPage) && (
              <SectionTitle
                title="Executive Leadership Experience"
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

  // 3. Strategic Initiatives (Projects)
  if (validProjects.length > 0) {
    validProjects.forEach((proj, idx) => {
      blocks.push({
        id: `initiative-${idx}`,
        type: 'projects',
        render: ({ isFirstOfThisSectionOnPage, sectionStartedOnPrevPage }) => (
          <div>
            {(idx === 0 || isFirstOfThisSectionOnPage) && (
              <SectionTitle
                title="Strategic Initiatives & Key Portfolios"
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
              cardBg="#fcfcfd"
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

  // 4. Credentials & Honors (Certifications — Main Content)
  if (validCertifications.length > 0) {
    blocks.push({
      id: 'certifications',
      type: 'certifications',
      render: ({ isFirstOfThisSectionOnPage, sectionStartedOnPrevPage }) => (
        <div>
          <SectionTitle
            title="Credentials & Honors"
            icon={HiSparkles}
            primaryColor={primaryColor}
            accentColor={accentColor}
            style={sectionTitleStyle}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: typo.certification, color: '#334155' }}>
            {validCertifications.map((cert, idx) => (
              <div key={idx} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', overflowWrap: 'anywhere' }}>{cert.name}</div>
                {cert.issuer && (
                  <div style={{ color: '#64748b', fontSize: '9.8px', overflowWrap: 'anywhere' }}>
                     {cert.issuer} {cert.date && `(${cert.date})`}
                  </div>
                )}
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

  // 5. Core Strengths (Main Content — Directly below Credentials & Honors)
  if (softSkills.length > 0) {
    blocks.push({
      id: 'core-strengths',
      type: 'strengths',
      render: ({ isFirstOfThisSectionOnPage, sectionStartedOnPrevPage }) => (
        <div>
          <SectionTitle
            title={!sectionStartedOnPrevPage ? 'Core Strengths' : 'Core Strengths (Continued)'}
            icon={HiUserGroup}
            primaryColor={primaryColor}
            accentColor={accentColor}
            style={sectionTitleStyle}
          />
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px 14px',
              fontSize: typo.softSkills || typo.technicalSkills,
              color: '#334155',
              paddingTop: '2px',
            }}
          >
            {softSkills.map((sk, idx) => {
              const skillName = typeof sk === 'string' ? sk : (sk?.name || String(sk || ''));
              if (!skillName) return null;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: accentColor,
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ overflowWrap: 'anywhere', lineHeight: 1.35, fontWeight: 500 }}>
                    {skillName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ),
    });
  }

  return (
    <TwoPageResumeCanvas
      header={header}
      sidebarSections={sidebarSections}
      page2Sidebar={null}
      page2Header={
        <PageRunningHeader
          fullName={personalInfo.fullName}
          targetRole={personalInfo.targetRole}
          primaryColor={primaryColor}
          pageNum={2}
          fontFamily="Georgia, 'Times New Roman', serif"
        />
      }
      blocks={blocks}
      fontFamily="Georgia, 'Times New Roman', serif"
      sidebarWidth="238px"
      lockSidebarWidth={true}
      sidebarBackground="#f8fafc"
      sidebarBorder="1px solid #e2e8f0"
      sidebarPadding="12px 10px"
      mainPadding="12px 16px"
      page2Padding="16px 22px"
      twoColumnGap={10}
      blockGap={8}
    />
  );
}

export default ExecutiveCorporateTemplate;
