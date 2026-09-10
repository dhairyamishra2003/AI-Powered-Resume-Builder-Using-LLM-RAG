export function normalizeSummaryText(summary) {
  if (typeof summary === 'string') return summary;
  if (summary && typeof summary === 'object') {
    if (typeof summary.text === 'string') return summary.text;
    if (typeof summary.summary === 'string') return summary.summary;
  }
  return '';
}

export function normalizeSkills(skills) {
  if (Array.isArray(skills)) {
    return {
      technical: skills,
      soft: [],
      languages: [],
    };
  }

  if (skills && typeof skills === 'object') {
    return {
      technical: Array.isArray(skills.technical) ? skills.technical : [],
      soft: Array.isArray(skills.soft) ? skills.soft : [],
      languages: Array.isArray(skills.languages) ? skills.languages : [],
    };
  }

  return {
    technical: [],
    soft: [],
    languages: [],
  };
}

export function normalizeResumeSections(sections = {}) {
  const personalInfo = sections.personalInfo || {};
  const normalizedPersonalInfo = {
    fullName: personalInfo.fullName || '',
    email: personalInfo.email || '',
    phone: personalInfo.phone || '',
    location: personalInfo.location || '',
    linkedIn: personalInfo.linkedIn || '',
    portfolio: personalInfo.portfolio || '',
    targetRole: personalInfo.targetRole || sections.targetRole || '',
  };

  return {
    ...sections,
    personalInfo: normalizedPersonalInfo,
    summary: normalizeSummaryText(sections.summary),
    experience: Array.isArray(sections.experience) ? sections.experience : [],
    education: Array.isArray(sections.education) ? sections.education : [],
    skills: normalizeSkills(sections.skills),
    projects: Array.isArray(sections.projects) ? sections.projects : [],
    certifications: Array.isArray(sections.certifications) ? sections.certifications : [],
    targetRole: normalizedPersonalInfo.targetRole,
  };
}

export function normalizeResumeData(resume = {}) {
  return {
    ...resume,
    sections: normalizeResumeSections(resume.sections),
  };
}
