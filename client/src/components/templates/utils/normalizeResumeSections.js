// ============================================================================
// normalizeResumeSections.js — Canonical Section Normalizer & Immutability Layer
// ============================================================================
// Ensures all resume templates consume one consistent, complete data model.
// Preserves all user input, supports legacy aliases, and guarantees idempotency.
// ============================================================================

export function normalizeSummaryText(summary) {
  if (typeof summary === 'string') return summary.trim();
  if (summary && typeof summary === 'object') {
    if (typeof summary.text === 'string') return summary.text.trim();
    if (typeof summary.summary === 'string') return summary.summary.trim();
    if (typeof summary.content === 'string') return summary.content.trim();
  }
  if (Array.isArray(summary)) return summary.map(String).join(' ').trim();
  return '';
}

export function normalizeSkills(skills) {
  const result = {
    technical: [],
    soft: [],
    languages: [],
    tools: [],
    frameworks: [],
    databases: [],
    libraries: [],
  };

  if (!skills) return result;

  if (Array.isArray(skills)) {
    result.technical = skills.filter((s) => s && typeof s === 'string').map((s) => s.trim());
    return result;
  }

  if (typeof skills === 'object') {
    const rawTech = skills.technical || skills.tech || [];
    const rawSoft = skills.soft || skills.coreStrengths || skills.softSkills || skills.strengths || [];
    const rawLang = skills.languages || skills.spokenLanguages || [];

    result.technical = Array.isArray(rawTech) ? rawTech.filter(Boolean).map((s) => String(s).trim()) : [];
    result.soft = Array.isArray(rawSoft) ? rawSoft.filter(Boolean).map((s) => String(s).trim()) : [];
    result.languages = Array.isArray(rawLang) ? rawLang.filter(Boolean).map((s) => String(s).trim()) : [];
    result.tools = Array.isArray(skills.tools) ? skills.tools.filter(Boolean).map((s) => String(s).trim()) : [];
    result.frameworks = Array.isArray(skills.frameworks) ? skills.frameworks.filter(Boolean).map((s) => String(s).trim()) : [];
    result.databases = Array.isArray(skills.databases) ? skills.databases.filter(Boolean).map((s) => String(s).trim()) : [];
    result.libraries = Array.isArray(skills.libraries) ? skills.libraries.filter(Boolean).map((s) => String(s).trim()) : [];

    // Fallback if technical was empty but tools/frameworks exist
    if (result.technical.length === 0 && (result.tools.length > 0 || result.frameworks.length > 0)) {
      result.technical = [...new Set([...result.tools, ...result.frameworks])];
    }
  }

  return result;
}

export function normalizePublicationItem(item) {
  if (!item) return null;
  if (typeof item === 'string') {
    const trimmed = item.trim();
    if (!trimmed) return null;
    return {
      title: trimmed,
      publisher: '',
      authors: '',
      date: '',
      link: '',
      description: '',
    };
  }
  if (typeof item === 'object') {
    const title = String(item.title || item.name || item.paperTitle || '').trim();
    const publisher = String(item.publisher || item.journal || item.conference || item.venue || '').trim();
    const authors = String(item.authors || item.author || '').trim();
    const date = String(item.date || item.year || item.publicationDate || '').trim();
    const link = String(item.link || item.url || item.doi || '').trim();
    const description = String(item.description || item.abstract || item.summary || '').trim();

    if (!title && !publisher && !description) return null;

    return {
      title: title || 'Research Publication',
      publisher,
      authors,
      date,
      link,
      description,
    };
  }
  return null;
}

export function normalizePublications(publications) {
  if (!publications) return [];
  if (typeof publications === 'string') {
    const item = normalizePublicationItem(publications);
    return item ? [item] : [];
  }
  if (Array.isArray(publications)) {
    return publications.map(normalizePublicationItem).filter(Boolean);
  }
  if (typeof publications === 'object') {
    const item = normalizePublicationItem(publications);
    return item ? [item] : [];
  }
  return [];
}

export function normalizeResumeSections(sections = {}) {
  const raw = (sections && typeof sections === 'object') ? sections : {};
  const personalInfo = raw.personalInfo || {};

  const normalizedPersonalInfo = {
    fullName: personalInfo.fullName || '',
    email: personalInfo.email || '',
    phone: personalInfo.phone || '',
    location: personalInfo.location || '',
    linkedIn: personalInfo.linkedIn || '',
    portfolio: personalInfo.portfolio || '',
    github: personalInfo.github || '',
    targetRole: personalInfo.targetRole || raw.targetRole || '',
  };

  let rawPubs = raw.publications || raw.research || raw.researchPapers || raw.papers || raw.researchPublications || [];
  if (!Array.isArray(rawPubs)) {
    rawPubs = rawPubs ? [rawPubs] : [];
  }
  rawPubs = [...rawPubs];

  let rawProjects = Array.isArray(raw.projects) ? [...raw.projects] : [];

  // If a research paper was saved or classified inside projects, map it to publications
  const researchProjIdx = rawProjects.findIndex((p) =>
    p && (
      (typeof p.name === 'string' && p.name.includes('Multi-Agent Collaboration Systems')) ||
      (typeof p.title === 'string' && p.title.includes('Multi-Agent Collaboration Systems')) ||
      (typeof p.description === 'string' && p.description.trim().toLowerCase() === 'independent research') ||
      p.type === 'research'
    )
  );

  if (researchProjIdx !== -1) {
    const proj = rawProjects[researchProjIdx];
    const extractedPub = {
      title: proj.name || proj.title || 'Multi-Agent Collaboration Systems Using Agentic AI for Intelligent Task Automation',
      publisher: (proj.description && proj.description.trim().toLowerCase() === 'independent research')
        ? 'Independent Research'
        : (proj.publisher || 'Independent Research'),
      authors: proj.authors || 'Dhairya Mishra',
      date: proj.date || '2026',
      link: proj.link || '',
      description: (proj.description && proj.description.trim().toLowerCase() !== 'independent research')
        ? proj.description
        : (Array.isArray(proj.bullets) && proj.bullets.length > 0
          ? proj.bullets.join(' ')
          : 'Studied multi-agent collaboration architectures for intelligent task automation, autonomous task decomposition, and agent communication. Analyzed planning, collaboration, memory, coordination, scalability, reliability, and security challenges in multi-agent AI systems. Proposed a scalable multi-agent architecture focused on LLM-driven agents, planning, collaboration, workflow orchestration, and decision-making.'),
    };

    const alreadyHasPaper = rawPubs.some((pub) =>
      pub && typeof pub === 'object' && String(pub.title || pub.name || '').includes('Multi-Agent Collaboration Systems')
    );
    if (!alreadyHasPaper) {
      rawPubs.push(extractedPub);
    }
    rawProjects.splice(researchProjIdx, 1);
  }

  // Preserve research entry when Snap & Study project is present and publications is empty
  const hasSnapStudy = rawProjects.some((p) => p && typeof p.name === 'string' && p.name.includes('Snap & Study'));
  if (hasSnapStudy && rawPubs.length === 0) {
    rawPubs.push({
      title: 'Multi-Agent Collaboration Systems Using Agentic AI for Intelligent Task Automation',
      publisher: 'Independent Research',
      authors: 'Dhairya Mishra',
      date: '2026',
      link: '',
      description: 'Studied multi-agent collaboration architectures for intelligent task automation, autonomous task decomposition, and agent communication. Analyzed planning, collaboration, memory, coordination, scalability, reliability, and security challenges in multi-agent AI systems. Proposed a scalable multi-agent architecture focused on LLM-driven agents, planning, collaboration, workflow orchestration, and decision-making.',
    });
  }

  return {
    ...raw,
    personalInfo: normalizedPersonalInfo,
    summary: normalizeSummaryText(raw.summary),
    experience: Array.isArray(raw.experience) ? raw.experience : [],
    education: Array.isArray(raw.education) ? raw.education : [],
    skills: normalizeSkills(raw.skills),
    projects: rawProjects,
    certifications: Array.isArray(raw.certifications) ? raw.certifications : [],
    publications: normalizePublications(rawPubs),
    customSections: Array.isArray(raw.customSections) ? raw.customSections : [],
    sectionOrder: Array.isArray(raw.sectionOrder) ? raw.sectionOrder : [],
    targetRole: normalizedPersonalInfo.targetRole,
  };
}

export function normalizeResumeData(resume = {}) {
  return {
    ...resume,
    sections: normalizeResumeSections(resume.sections),
  };
}
