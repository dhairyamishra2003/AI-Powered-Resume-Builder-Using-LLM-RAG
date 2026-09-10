import React from 'react';
import { A4Canvas, TwoColumnLayout, SectionTitle, ExperienceItem, ProjectCard, EducationItem, SummaryCard, ContactList } from './engine/LayoutEngine.jsx';
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

  const primaryColor = colors?.primary || '#1e1b4b';
  const accentColor = colors?.accent || '#d97706';

  const techSkills = (skills.technical || []).filter((s) => s && s.trim());
  const softSkills = (skills.soft || []).filter((s) => s && s.trim());
  const validEducation = (education || []).filter((e) => e && (e.degree || e.institution));
  const validCertifications = (certifications || []).filter((c) => c && c.name);
  const validExperience = (experience || []).filter((e) => e && (e.role || e.company));
  const validProjects = (projects || []).filter((p) => p && (p.name || p.description));

  const sidebarContent = (
    <>
      {/* EXECUTIVE CORE COMPETENCIES */}
      {(techSkills.length > 0 || softSkills.length > 0) && (
        <div>
          <SectionTitle title="Executive Skills" primaryColor={primaryColor} accentColor={accentColor} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '9.5px', color: '#334155' }}>
            {techSkills.map((sk, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: accentColor, display: 'inline-block', flexShrink: 0 }} />
                <span>{sk}</span>
              </div>
            ))}
            {softSkills.map((sk, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: primaryColor, display: 'inline-block', flexShrink: 0 }} />
                <span>{sk}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EDUCATION */}
      {validEducation.length > 0 && (
        <div>
          <SectionTitle title="Education" primaryColor={primaryColor} accentColor={accentColor} />
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

      {/* CREDENTIALS / CERTIFICATIONS */}
      {validCertifications.length > 0 && (
        <div>
          <SectionTitle title="Credentials" primaryColor={primaryColor} accentColor={accentColor} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '9.5px', color: '#334155' }}>
            {validCertifications.map((cert, idx) => (
              <div key={idx}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{cert.name}</div>
                {cert.issuer && <div style={{ color: '#64748b', fontSize: '9px' }}>{cert.issuer} {cert.date && `(${cert.date})`}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  const mainContent = (
    <>
      {/* EXECUTIVE SUMMARY */}
      {summary && summary.trim() && (
        <SummaryCard
          text={summary}
          borderColor={accentColor}
          backgroundColor="#fcfcfd"
          textColor="#334155"
          style={{ fontStyle: 'italic', borderLeftColor: accentColor }}
        />
      )}

      {/* LEADERSHIP EXPERIENCE */}
      {validExperience.length > 0 && (
        <div>
          <SectionTitle title="Leadership Experience" primaryColor={primaryColor} accentColor={accentColor} />
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

      {/* STRATEGIC INITIATIVES & PROJECTS */}
      {validProjects.length > 0 && (
        <div>
          <SectionTitle title="Strategic Initiatives" primaryColor={primaryColor} accentColor={accentColor} />
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
                cardBg="#fcfcfd"
                borderColor="#e2e8f0"
              />
            ))}
          </div>
        </div>
      )}
    </>
  );

  return (
    <A4Canvas sections={normalizedSections} fontFamily="Georgia, 'Times New Roman', serif">
      {/* Top Banner Header */}
      <div
        style={{
          background: primaryColor,
          color: '#ffffff',
          padding: '14px 24px',
          borderBottom: `3px solid ${accentColor}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', letterSpacing: '0.8px', textTransform: 'uppercase', margin: 0, color: '#ffffff', lineHeight: 1.15 }}>
            {personalInfo.fullName || (isPreview ? 'Executive Candidate' : 'Your Name')}
          </h1>
          {(personalInfo.targetRole || isPreview) && (
            <h2 style={{ fontSize: '12px', fontStyle: 'italic', color: '#e2e8f0', letterSpacing: '0.8px', marginTop: '2px', margin: 0 }}>
              {personalInfo.targetRole || 'Chief Executive Officer / VP'}
            </h2>
          )}
        </div>

        {/* Contact details */}
        <ContactList personalInfo={personalInfo} align="right" accentColor="#fbbf24" textColor="#cbd5e1" />
      </div>

      {/* Two Column Layout (Sidebar: 30%, Main: 70%) with Adaptive Height Distribution */}
      <TwoColumnLayout
        sidebar={sidebarContent}
        main={mainContent}
        sidebarWidth="30%"
      />
    </A4Canvas>
  );
}

export default ExecutiveCorporateTemplate;
