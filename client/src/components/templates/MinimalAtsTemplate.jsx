import React from 'react';
import { A4Canvas, OneColumnLayout, SectionTitle, ExperienceItem, EducationItem, DualSectionRow } from './engine/LayoutEngine.jsx';
import { normalizeResumeSections } from './utils/normalizeResumeSections.js';
import { withPlaceholder } from './utils/placeholderData.js';

function MinimalAtsTemplate({ sections, isPreview = false }) {
  const normalizedSections = normalizeResumeSections(sections || {});
  const personalInfo = withPlaceholder('personalInfo', normalizedSections.personalInfo, normalizedSections, isPreview);
  const summary = withPlaceholder('summary', normalizedSections.summary, normalizedSections, isPreview);
  const experience = withPlaceholder('experience', normalizedSections.experience, normalizedSections, isPreview);
  const education = withPlaceholder('education', normalizedSections.education, normalizedSections, isPreview);
  const skills = withPlaceholder('skills', normalizedSections.skills, normalizedSections, isPreview);
  const projects = withPlaceholder('projects', normalizedSections.projects, normalizedSections, isPreview);
  const certifications = withPlaceholder('certifications', normalizedSections.certifications, normalizedSections, isPreview);

  const techSkills = (skills.technical || []).filter((s) => s && s.trim());
  const softSkills = (skills.soft || []).filter((s) => s && s.trim());
  const languages = (skills.languages || []).filter((l) => l && l.trim());
  const validExperience = (experience || []).filter((e) => e && (e.role || e.company));
  const validProjects = (projects || []).filter((p) => p && (p.name || p.description));
  const validEducation = (education || []).filter((e) => e && (e.degree || e.institution));
  const validCertifications = (certifications || []).filter((c) => c && c.name);

  // Contact elements for ATS-friendly inline row
  const contactParts = [
    personalInfo.phone,
    personalInfo.email,
    personalInfo.location,
    personalInfo.linkedIn ? personalInfo.linkedIn.replace(/^https?:\/\/(www\.)?/i, '') : '',
    personalInfo.portfolio ? personalInfo.portfolio.replace(/^https?:\/\/(www\.)?/i, '') : '',
  ].filter(Boolean);

  return (
    <A4Canvas sections={normalizedSections} fontFamily="Georgia, 'Times New Roman', serif">
      <OneColumnLayout>
        {/* ATS Clean Centered Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '9px', flexShrink: 0 }}>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0, color: '#0f172a', lineHeight: 1.15 }}>
            {personalInfo.fullName || (isPreview ? 'Candidate Name' : 'Your Name')}
          </h1>
          {personalInfo.targetRole && (
            <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#334155', marginTop: '2px' }}>
              {personalInfo.targetRole}
            </div>
          )}
          {contactParts.length > 0 && (
            <div style={{ fontSize: '9.5px', color: '#475569', marginTop: '4px', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '6px 10px', fontFamily: "'Inter', sans-serif" }}>
              {contactParts.map((item, idx) => (
                <span key={idx} style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {idx > 0 && <span style={{ marginRight: '6px', color: '#94a3b8' }}>•</span>}
                  <span>{item}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* SUMMARY */}
        {summary && summary.trim() && (
          <div>
            <SectionTitle title="Professional Summary" primaryColor="#0f172a" accentColor="#0f172a" borderBottom={true} borderColor="#0f172a" />
            <p style={{ fontSize: '10px', color: '#334155', lineHeight: 1.45, margin: 0, textAlign: 'justify' }}>
              {summary}
            </p>
          </div>
        )}

        {/* SKILLS */}
        {(techSkills.length > 0 || softSkills.length > 0 || languages.length > 0) && (
          <div>
            <SectionTitle title="Technical & Core Competencies" primaryColor="#0f172a" accentColor="#0f172a" borderBottom={true} borderColor="#0f172a" />
            <div style={{ fontSize: '9.5px', color: '#334155', lineHeight: 1.45, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {techSkills.length > 0 && <div><strong>Technical Skills:</strong> {techSkills.join(', ')}</div>}
              {softSkills.length > 0 && <div><strong>Core Competencies:</strong> {softSkills.join(', ')}</div>}
              {languages.length > 0 && <div><strong>Languages:</strong> {languages.join(', ')}</div>}
            </div>
          </div>
        )}

        {/* EXPERIENCE */}
        {validExperience.length > 0 && (
          <div>
            <SectionTitle title="Professional Experience" primaryColor="#0f172a" accentColor="#0f172a" borderBottom={true} borderColor="#0f172a" />
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
                  accentColor="#0f172a"
                  dateBadge={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* PROJECTS */}
        {validProjects.length > 0 && (
          <div>
            <SectionTitle title="Key Projects" primaryColor="#0f172a" accentColor="#0f172a" borderBottom={true} borderColor="#0f172a" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {validProjects.map((proj, idx) => {
                const pBullets = Array.isArray(proj.bullets)
                  ? proj.bullets.filter((b) => b && typeof b === 'string' && b.trim())
                  : [];
                const linkText = proj.link ? proj.link.replace(/^https?:\/\//i, '') : '';
                return (
                  <div key={idx} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a' }}>
                        {proj.name}
                        {proj.description && <span style={{ fontWeight: 'normal', color: '#475569', marginLeft: '6px', fontSize: '10px' }}>— {proj.description}</span>}
                      </span>
                      {linkText && <span style={{ fontSize: '9px', color: '#334155', fontFamily: "'Inter', sans-serif" }}>{linkText}</span>}
                    </div>
                    {proj.technologies && proj.technologies.length > 0 && (
                      <div style={{ fontSize: '9px', color: '#475569', fontStyle: 'italic', marginTop: '1px' }}>
                        Technologies: {proj.technologies.join(', ')}
                      </div>
                    )}
                    {pBullets.length > 0 && (
                      <ul style={{ margin: '2px 0 0 16px', padding: 0, fontSize: '9.5px', color: '#334155', lineHeight: 1.35 }}>
                        {pBullets.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* EDUCATION & CERTIFICATIONS ROW */}
        {(validEducation.length > 0 || validCertifications.length > 0) && (
          <DualSectionRow
            left={
              validEducation.length > 0 ? (
                <div>
                  <SectionTitle title="Education" primaryColor="#0f172a" accentColor="#0f172a" borderBottom={true} borderColor="#0f172a" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {validEducation.map((edu, idx) => (
                      <div key={idx} style={{ fontSize: '10px', lineHeight: 1.35 }}>
                        <div style={{ fontWeight: 'bold', color: '#0f172a' }}>
                          {edu.degree} {edu.field && <span>in {edu.field}</span>}
                        </div>
                        <div style={{ color: '#475569', fontSize: '9.5px' }}>
                          {edu.institution} {edu.startDate && `(${edu.startDate} – ${edu.endDate})`} {edu.gpa && `• GPA: ${edu.gpa}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
            }
            right={
              validCertifications.length > 0 ? (
                <div>
                  <SectionTitle title="Certifications" primaryColor="#0f172a" accentColor="#0f172a" borderBottom={true} borderColor="#0f172a" />
                  <ul style={{ margin: 0, paddingLeft: '15px', fontSize: '9.5px', color: '#334155', lineHeight: 1.4 }}>
                    {validCertifications.map((cert, idx) => (
                      <li key={idx} style={{ marginBottom: '2px' }}>
                        <strong>{cert.name}</strong> {cert.issuer && `— ${cert.issuer}`} {cert.date && `(${cert.date})`}
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

export default MinimalAtsTemplate;
