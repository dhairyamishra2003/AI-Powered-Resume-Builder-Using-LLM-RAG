import React from 'react';
import {
  HiCpuChip,
  HiSparkles,
  HiBeaker,
  HiAcademicCap,
  HiWrenchScrewdriver,
} from 'react-icons/hi2';

import {
  A4Canvas,
  OneColumnLayout,
  SectionTitle,
  SkillBadges,
  ExperienceItem,
  ProjectCard,
  EducationItem,
  DualSectionRow,
  SummaryCard,
  ContactList,
} from './engine/LayoutEngine.jsx';

import { normalizeResumeSections } from './utils/normalizeResumeSections.js';
import { withPlaceholder } from './utils/placeholderData.js';

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

  const primaryColor = colors?.primary || '#0f766e';
  const accentColor = colors?.accent || '#0d9488';

  const techSkills = (skills.technical || []).filter(
    (s) => s && s.trim()
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

  return (
    <A4Canvas
      sections={normalizedSections}
      fontFamily="'Inter', system-ui, sans-serif"
    >
      <OneColumnLayout
        padding="28px 30px"
        gap="17px"
        justifyContent="flex-start"
      >

        {/* HEADER */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `2px solid ${primaryColor}`,
            paddingBottom: '18px',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '7px',
                background: `linear-gradient(135deg, ${primaryColor} 0%, #14b8a6 100%)`,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '21px',
                flexShrink: 0,
                boxShadow:
                  '0 2px 6px rgba(15, 118, 110, 0.25)',
              }}
            >
              <HiCpuChip />
            </div>

            <div>
              <h1
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  color: '#0f172a',
                  margin: 0,
                  lineHeight: 1.15,
                }}
              >
                {personalInfo.fullName || 'AI / ML Engineer'}
              </h1>

              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: primaryColor,
                  marginTop: '3px',
                  letterSpacing: '0.3px',
                }}
              >
                {personalInfo.targetRole ||
                  'AI / ML Engineer & Data Scientist'}
              </div>
            </div>
          </div>

          <ContactList
            personalInfo={personalInfo}
            align="right"
            accentColor={primaryColor}
            textColor="#334155"
          />
        </div>

        {/* SUMMARY */}
        {summary && summary.trim() && (
          <SummaryCard
            text={summary}
            borderColor={primaryColor}
            backgroundColor="#f0fdfa"
            textColor="#134e4a"
          />
        )}

        {/* SKILLS */}
        {techSkills.length > 0 && (
          <div>
            <SectionTitle
              title="AI / ML Core Capabilities & Stack"
              icon={HiWrenchScrewdriver}
              primaryColor="#0f172a"
              accentColor={primaryColor}
              borderColor="#99f6e4"
            />

            <SkillBadges
              skills={techSkills}
              background="#f0fdfa"
              borderColor="#99f6e4"
              textColor="#0f766e"
            />
          </div>
        )}

        {/* EXPERIENCE */}
        {validExperience.length > 0 && (
          <div>
            <SectionTitle
              title="AI / ML Engineering Experience"
              icon={HiBeaker}
              primaryColor="#0f172a"
              accentColor={primaryColor}
              borderColor="#99f6e4"
            />

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              {validExperience.map((exp, idx) => (
                <ExperienceItem
                  key={idx}
                  role={exp.role}
                  company={exp.company}
                  startDate={exp.startDate}
                  endDate={exp.endDate}
                  current={exp.current}
                  bullets={exp.bullets}
                  accentColor={primaryColor}
                  dateBadge={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* PROJECTS */}
        {validProjects.length > 0 && (
          <div>
            <SectionTitle
              title="Machine Learning & AI Projects"
              icon={HiSparkles}
              primaryColor="#0f172a"
              accentColor={primaryColor}
              borderColor="#99f6e4"
            />

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {validProjects.map((proj, idx) => (
                <ProjectCard
                  key={idx}
                  name={proj.name}
                  description={proj.description}
                  technologies={proj.technologies}
                  link={proj.link}
                  startDate={proj.startDate}
                  endDate={proj.endDate}
                  date={proj.date}
                  bullets={proj.bullets}
                  accentColor={primaryColor}
                  cardBg="#fcfdfd"
                  borderColor="#ccfbf1"
                />
              ))}
            </div>
          </div>
        )}

        {/* EDUCATION + CERTIFICATIONS */}
        {(validEducation.length > 0 ||
          validCertifications.length > 0) && (
            <DualSectionRow
              left={
                validEducation.length > 0 ? (
                  <div>
                    <SectionTitle
                      title="Education"
                      icon={HiAcademicCap}
                      primaryColor="#0f172a"
                      accentColor={primaryColor}
                      borderColor="#99f6e4"
                    />

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
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
                ) : null
              }

              right={
                validCertifications.length > 0 ? (
                  <div>
                    <SectionTitle
                      title="Certifications & Research"
                      icon={HiSparkles}
                      primaryColor="#0f172a"
                      accentColor={primaryColor}
                      borderColor="#99f6e4"
                    />

                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: '16px',
                        fontSize: '10px',
                        color: '#334155',
                        lineHeight: 1.55,
                      }}
                    >
                      {validCertifications.map((cert, idx) => (
                        <li
                          key={idx}
                          style={{
                            marginBottom: '5px',
                          }}
                        >
                          <strong>{cert.name}</strong>

                          {cert.issuer && (
                            <span style={{ color: '#64748b' }}>
                              {' '}
                              — {cert.issuer}
                            </span>
                          )}

                          {cert.date && (
                            <span
                              style={{
                                color: '#94a3b8',
                                fontSize: '9.5px',
                              }}
                            >
                              {' '}
                              ({cert.date})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null
              }
            />
          )}
      </OneColumnLayout>
    </A4Canvas>
  );
}

export default AimlEngineerTemplate;