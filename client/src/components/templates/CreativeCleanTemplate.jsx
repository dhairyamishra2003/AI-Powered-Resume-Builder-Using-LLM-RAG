import React from 'react';
import { HiPaintBrush, HiBriefcase, HiAcademicCap, HiSparkles, HiFolder } from 'react-icons/hi2';
import { A4Canvas, TwoColumnLayout, SectionTitle, ExperienceItem, ProjectCard, EducationItem, SummaryCard, ContactList } from './engine/LayoutEngine.jsx';
import { normalizeResumeSections } from './utils/normalizeResumeSections.js';
import { withPlaceholder } from './utils/placeholderData.js';

function CreativeCleanTemplate({ sections, colors, isPreview = false }) {
  const normalizedSections = normalizeResumeSections(sections || {});
  const personalInfo = withPlaceholder('personalInfo', normalizedSections.personalInfo, normalizedSections, isPreview);
  const summary = withPlaceholder('summary', normalizedSections.summary, normalizedSections, isPreview);
  const experience = withPlaceholder('experience', normalizedSections.experience, normalizedSections, isPreview);
  const education = withPlaceholder('education', normalizedSections.education, normalizedSections, isPreview);
  const skills = withPlaceholder('skills', normalizedSections.skills, normalizedSections, isPreview);
  const projects = withPlaceholder('projects', normalizedSections.projects, normalizedSections, isPreview);
  const certifications = withPlaceholder('certifications', normalizedSections.certifications, normalizedSections, isPreview);

  const primaryColor = colors?.primary || '#6d28d9';
  const accentColor = colors?.accent || '#ec4899';

  const techSkills = (skills.technical || []).filter((s) => s && s.trim());
  const softSkills = (skills.soft || []).filter((s) => s && s.trim());
  const languages = (skills.languages || []).filter((l) => l && l.trim());
  const validEducation = (education || []).filter((e) => e && (e.degree || e.institution));
  const validExperience = (experience || []).filter((e) => e && (e.role || e.company));
  const validProjects = (projects || []).filter((p) => p && (p.name || p.description));
  const validCertifications = (certifications || []).filter((c) => c && c.name);

  const sidebarContent = (
    <>
      {/* CREATIVE SKILLS */}
      {techSkills.length > 0 && (
        <div>
          <SectionTitle title="Skills & Tools" icon={HiPaintBrush} primaryColor={primaryColor} accentColor={accentColor} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 4px' }}>
            {techSkills.map((sk, i) => (
              <span
                key={i}
                style={{
                  background: '#ffffff',
                  border: '1px solid #d8b4fe',
                  color: '#581c87',
                  padding: '1.5px 6px',
                  borderRadius: '10px',
                  fontSize: '9px',
                  fontWeight: 600,
                  lineHeight: 1.25,
                }}
              >
                {sk}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CORE COMPETENCIES */}
      {softSkills.length > 0 && (
        <div>
          <SectionTitle title="Core Strengths" primaryColor={primaryColor} accentColor={accentColor} />
          <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '9.5px', color: '#4c1d95', lineHeight: 1.45 }}>
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
                accentColor={primaryColor}
              />
            ))}
          </div>
        </div>
      )}

      {/* LANGUAGES */}
      {languages.length > 0 && (
        <div>
          <SectionTitle title="Languages" primaryColor={primaryColor} accentColor={accentColor} />
          <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '9.5px', color: '#4c1d95', lineHeight: 1.45 }}>
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
        <SummaryCard
          text={summary}
          borderColor={primaryColor}
          backgroundColor="#faf5ff"
          textColor="#3b0764"
          style={{ borderLeftColor: primaryColor }}
        />
      )}

      {/* EXPERIENCE */}
      {validExperience.length > 0 && (
        <div>
          <SectionTitle title="Design & Creative Experience" icon={HiBriefcase} primaryColor={primaryColor} accentColor={accentColor} />
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
                accentColor={primaryColor}
              />
            ))}
          </div>
        </div>
      )}

      {/* PROJECTS */}
      {validProjects.length > 0 && (
        <div>
          <SectionTitle title="Featured Projects" icon={HiFolder} primaryColor={primaryColor} accentColor={accentColor} />
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
                accentColor={primaryColor}
                cardBg="#fcfaff"
                borderColor="#f3e8ff"
              />
            ))}
          </div>
        </div>
      )}

      {/* CERTIFICATIONS / HONORS */}
      {validCertifications.length > 0 && (
        <div>
          <SectionTitle title="Honors & Certifications" icon={HiSparkles} primaryColor={primaryColor} accentColor={accentColor} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px' }}>
            {validCertifications.map((cert, idx) => (
              <div key={idx} style={{ fontSize: '9.5px', color: '#3b0764', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
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
      {/* Top Header */}
      <div
        style={{
          padding: '14px 24px',
          background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
          borderBottom: `3px solid ${primaryColor}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: primaryColor, letterSpacing: '0.6px', margin: 0, lineHeight: 1.15 }}>
            {personalInfo.fullName || (isPreview ? 'Alex Johnson' : 'Your Name')}
          </h1>
          {(personalInfo.targetRole || isPreview) && (
            <h2 style={{ fontSize: '12px', fontWeight: 700, color: accentColor, letterSpacing: '0.8px', textTransform: 'uppercase', marginTop: '2px', margin: 0 }}>
              {personalInfo.targetRole || 'Creative Designer & Product Lead'}
            </h2>
          )}
        </div>

        {/* Contact List */}
        <ContactList personalInfo={personalInfo} align="right" accentColor={primaryColor} textColor="#4c1d95" />
      </div>

      {/* Two Column Layout (Sidebar: 30%, Main: 70%) with Adaptive Height Distribution */}
      <TwoColumnLayout
        sidebar={sidebarContent}
        main={mainContent}
        sidebarBackground="#faf5ff"
        sidebarBorder="1px solid #e9d5ff"
        sidebarWidth="30%"
      />
    </A4Canvas>
  );
}

export default CreativeCleanTemplate;
