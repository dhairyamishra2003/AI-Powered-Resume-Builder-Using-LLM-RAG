import React from 'react';
import { HiBriefcase, HiAcademicCap, HiWrenchScrewdriver, HiFolder, HiSparkles } from 'react-icons/hi2';
import { A4Canvas, TwoColumnLayout, SectionTitle, ExperienceItem, SkillBadges, ProjectCard, EducationItem, SummaryCard, ContactList } from './engine/LayoutEngine.jsx';
import { normalizeResumeSections } from './utils/normalizeResumeSections.js';
import { withPlaceholder } from './utils/placeholderData.js';

function ModernProfessionalTemplate({ sections, colors, isPreview = false }) {
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
  const softSkills = (skills.soft || []).filter((s) => s && s.trim());
  const languages = (skills.languages || []).filter((l) => l && l.trim());
  const validEducation = (education || []).filter((e) => e && (e.degree || e.institution));
  const validExperience = (experience || []).filter((e) => e && (e.role || e.company));
  const validProjects = (projects || []).filter((p) => p && (p.name || p.description));
  const validCertifications = (certifications || []).filter((c) => c && c.name);

  const sidebarContent = (
    <>
      {/* TECHNICAL SKILLS */}
      {techSkills.length > 0 && (
        <div>
          <SectionTitle title="Technical Skills" icon={HiWrenchScrewdriver} primaryColor={primaryColor} accentColor={accentColor} />
          <SkillBadges skills={techSkills} background="#ffffff" borderColor="#cbd5e1" textColor="#1e293b" size="small" />
        </div>
      )}

      {/* SOFT SKILLS / COMPETENCIES */}
      {softSkills.length > 0 && (
        <div>
          <SectionTitle title="Core Strengths" primaryColor={primaryColor} accentColor={accentColor} />
          <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '9.5px', color: '#475569', lineHeight: 1.45 }}>
            {softSkills.map((sk, i) => <li key={i} style={{ marginBottom: '2px' }}>{sk}</li>)}
          </ul>
        </div>
      )}

      {/* EDUCATION */}
      {validEducation.length > 0 && (
        <div>
          <SectionTitle title="Education" icon={HiAcademicCap} primaryColor={primaryColor} accentColor={accentColor} />
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
      )}

      {/* LANGUAGES */}
      {languages.length > 0 && (
        <div>
          <SectionTitle title="Languages" primaryColor={primaryColor} accentColor={accentColor} />
          <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '9.5px', color: '#475569', lineHeight: 1.45 }}>
            {languages.map((lang, i) => <li key={i} style={{ marginBottom: '2px' }}>{lang}</li>)}
          </ul>
        </div>
      )}
    </>
  );

  const mainContent = (
    <>
      {/* SUMMARY */}
      {summary && summary.trim() && (
        <SummaryCard text={summary} borderColor={accentColor} backgroundColor="#f8fafc" textColor="#334155" />
      )}

      {/* EXPERIENCE */}
      {validExperience.length > 0 && (
        <div>
          <SectionTitle title="Work Experience" icon={HiBriefcase} primaryColor={primaryColor} accentColor={accentColor} />
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
              />
            ))}
          </div>
        </div>
      )}

      {/* PROJECTS */}
      {validProjects.length > 0 && (
        <div>
          <SectionTitle title="Key Projects" icon={HiFolder} primaryColor={primaryColor} accentColor={accentColor} />
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

      {/* CERTIFICATIONS */}
      {validCertifications.length > 0 && (
        <div>
          <SectionTitle title="Certifications" icon={HiSparkles} primaryColor={primaryColor} accentColor={accentColor} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px' }}>
            {validCertifications.map((cert, idx) => (
              <div key={idx} style={{ fontSize: '9.5px', color: '#334155', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                <strong>{cert.name}</strong> {cert.issuer && `— ${cert.issuer}`} {cert.date && `(${cert.date})`}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  return (
    <A4Canvas sections={normalizedSections} fontFamily="'Inter', system-ui, sans-serif">
      {/* Top Banner Header */}
      <div
        style={{
          background: primaryColor,
          color: '#ffffff',
          padding: '14px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `3px solid ${accentColor}`,
          flexShrink: 0,
        }}
      >
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', margin: 0, color: '#ffffff', lineHeight: 1.15 }}>
            {personalInfo.fullName || (isPreview ? 'Alex Johnson' : 'Your Name')}
          </h1>
          {(personalInfo.targetRole || isPreview) && (
            <h2 style={{ fontSize: '12px', fontWeight: 600, color: '#93c5fd', letterSpacing: '0.8px', textTransform: 'uppercase', marginTop: '2px', margin: 0 }}>
              {personalInfo.targetRole || 'Senior Professional'}
            </h2>
          )}
        </div>

        {/* Header Contact Column */}
        <ContactList personalInfo={personalInfo} align="right" accentColor="#60a5fa" textColor="#cbd5e1" />
      </div>

      {/* Two-Column Grid with Adaptive Height Distribution */}
      <TwoColumnLayout
        sidebar={sidebarContent}
        main={mainContent}
        sidebarWidth="30%"
      />
    </A4Canvas>
  );
}

export default ModernProfessionalTemplate;
