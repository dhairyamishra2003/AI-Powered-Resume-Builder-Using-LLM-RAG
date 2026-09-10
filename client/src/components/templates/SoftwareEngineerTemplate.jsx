import React from 'react';
import { HiCodeBracket, HiBriefcase, HiFolder, HiAcademicCap, HiCommandLine, HiSparkles, HiWrenchScrewdriver } from 'react-icons/hi2';
import { A4Canvas, OneColumnLayout, SectionTitle, SkillBadges, ExperienceItem, ProjectCard, EducationItem, DualSectionRow, SummaryCard, ContactList } from './engine/LayoutEngine.jsx';
import { normalizeResumeSections } from './utils/normalizeResumeSections.js';
import { withPlaceholder } from './utils/placeholderData.js';

function SoftwareEngineerTemplate({ sections, colors, isPreview = false }) {
  const normalizedSections = normalizeResumeSections(sections || {});
  const personalInfo = withPlaceholder('personalInfo', normalizedSections.personalInfo, normalizedSections, isPreview);
  const summary = withPlaceholder('summary', normalizedSections.summary, normalizedSections, isPreview);
  const experience = withPlaceholder('experience', normalizedSections.experience, normalizedSections, isPreview);
  const education = withPlaceholder('education', normalizedSections.education, normalizedSections, isPreview);
  const skills = withPlaceholder('skills', normalizedSections.skills, normalizedSections, isPreview);
  const projects = withPlaceholder('projects', normalizedSections.projects, normalizedSections, isPreview);
  const certifications = withPlaceholder('certifications', normalizedSections.certifications, normalizedSections, isPreview);

  const primaryColor = colors?.primary || '#0f172a';
  const accentColor = colors?.accent || '#2563eb';

  const techSkills = (skills.technical || []).filter((s) => s && s.trim());
  const validExperience = (experience || []).filter((e) => e && (e.role || e.company));
  const validProjects = (projects || []).filter((p) => p && (p.name || p.description));
  const validEducation = (education || []).filter((e) => e && (e.degree || e.institution));
  const validCertifications = (certifications || []).filter((c) => c && c.name);

  return (
    <A4Canvas sections={normalizedSections} fontFamily="'Inter', system-ui, sans-serif">
      <OneColumnLayout>
        {/* Top Header - Matching Reference Design */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${primaryColor}`, paddingBottom: '10px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Developer Icon Badge */}
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '7px',
                background: accentColor,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
              }}
            >
              <HiCodeBracket />
            </div>
            <div>
              <h1 style={{ fontSize: '21px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: primaryColor, margin: 0, lineHeight: 1.15 }}>
                {personalInfo.fullName || 'Software Engineer'}
              </h1>
              <div style={{ fontSize: '12px', fontWeight: 600, color: accentColor, marginTop: '2px', letterSpacing: '0.3px' }}>
                {personalInfo.targetRole || 'Software Engineer'}
              </div>
            </div>
          </div>

          {/* Contact Details with Icons */}
          <ContactList personalInfo={personalInfo} align="right" accentColor={accentColor} textColor="#334155" />
        </div>

        {/* Professional Summary */}
        {summary && summary.trim() && (
          <SummaryCard text={summary} borderColor={accentColor} backgroundColor="#f8fafc" textColor="#334155" />
        )}

        {/* Technical Skills & Stack */}
        {techSkills.length > 0 && (
          <div>
            <SectionTitle title="Technical Skills & Stack" icon={HiWrenchScrewdriver} primaryColor={primaryColor} accentColor={accentColor} />
            <SkillBadges skills={techSkills} background="#eff6ff" borderColor="#bfdbfe" textColor="#1e40af" />
          </div>
        )}

        {/* Software Engineering Experience */}
        {validExperience.length > 0 && (
          <div>
            <SectionTitle title="Software Engineering Experience" icon={HiBriefcase} primaryColor={primaryColor} accentColor={accentColor} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {validExperience.map((exp, idx) => (
                <ExperienceItem
                  key={idx}
                  role={exp.role}
                  company={exp.company}
                  startDate={exp.startDate}
                  endDate={exp.endDate}
                  current={exp.current}
                  bullets={exp.bullets}
                  accentColor={accentColor}
                  dateBadge={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Key Technical Projects */}
        {validProjects.length > 0 && (
          <div>
            <SectionTitle title="Key Technical Projects" icon={HiFolder} primaryColor={primaryColor} accentColor={accentColor} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
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
                  accentColor={accentColor}
                  cardBg="#f8fafc"
                  borderColor="#e2e8f0"
                />
              ))}
            </div>
          </div>
        )}

        {/* Education & Certifications Row */}
        {(validEducation.length > 0 || validCertifications.length > 0) && (
          <DualSectionRow
            left={
              validEducation.length > 0 ? (
                <div>
                  <SectionTitle title="Education" icon={HiAcademicCap} primaryColor={primaryColor} accentColor={accentColor} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
              ) : null
            }
            right={
              validCertifications.length > 0 ? (
                <div>
                  <SectionTitle title="Certifications" icon={HiSparkles} primaryColor={primaryColor} accentColor={accentColor} />
                  <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '9.5px', color: '#334155', lineHeight: 1.4 }}>
                    {validCertifications.map((cert, idx) => (
                      <li key={idx} style={{ marginBottom: '2px' }}>
                        <strong>{cert.name}</strong>
                        {cert.issuer && <span style={{ color: '#64748b' }}> — {cert.issuer}</span>}
                        {cert.date && <span style={{ color: '#94a3b8', fontSize: '9px' }}> ({cert.date})</span>}
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

export default SoftwareEngineerTemplate;
