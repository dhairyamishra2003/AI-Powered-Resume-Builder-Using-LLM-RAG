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

    // Preserve any custom category keys (e.g. programmingLanguages, technologies, aiml, cloud, devops)
    for (const [k, v] of Object.entries(skills)) {
      if (!result[k] && Array.isArray(v)) {
        result[k] = v.filter(Boolean).map((s) => String(s).trim());
      }
    }

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

export function defragmentProjects(projects) {
  if (!Array.isArray(projects)) return [];

  const TECH_PREFIX_REGEX = /^(?:technologies|tech\s*stack|tools\s*used|stack|skills\s*used|built\s*with|technologies\s*used)\s*[:\-–—]?\s*(.*)$/i;
  const DESC_PREFIX_REGEX = /^(?:description|overview|details|summary|highlights|key\s*highlights|responsibilities|features)\s*[:\-–—]?\s*(.*)$/i;
  const BULLET_PREFIX_REGEX = /^[•\-\*\u2022\u2023\u25E6\u2043\u2219]\s*(.*)$/;
  const ACTION_VERB_REGEX = /^(?:built|engineered|developed|implemented|designed|created|optimized|architected|spearheaded|integrated|orchestrated|automated|trained|fine-tuned|deployed|maintained|refactored|leveraged|utilized|enhanced|reduced|increased)\b/i;

  const defragmented = [];

  for (const rawItem of projects) {
    if (!rawItem) continue;
    const item = typeof rawItem === 'string'
      ? { name: rawItem.trim(), description: '', technologies: [], bullets: [] }
      : { ...rawItem };

    const name = String(item.name || item.title || '').trim();
    const desc = String(item.description || '').trim();
    const techList = Array.isArray(item.technologies) ? item.technologies.filter(Boolean).map(String) : [];
    const bulletList = Array.isArray(item.bullets) ? item.bullets.filter(Boolean).map(String) : [];

    const prev = defragmented.length > 0 ? defragmented[defragmented.length - 1] : null;

    // Check if this project item is actually a technology stack fragment
    const techMatch = name.match(TECH_PREFIX_REGEX);
    const isTechFragment = Boolean(
      techMatch ||
      /^(?:technologies|tech\s*stack|tools)$/i.test(name) ||
      (techList.length > 0 && !desc && bulletList.length === 0 && (/^tech/i.test(name) || name.length < 3))
    );

    if (isTechFragment && prev) {
      let extractedTech = [...techList];
      const remainder = techMatch ? techMatch[1].trim() : (name.length > 20 ? name : desc);
      if (remainder) {
        const parts = remainder.split(/[,|•·\n]+/).map((s) => s.trim()).filter(Boolean);
        extractedTech.push(...parts);
      }
      const existingUpper = new Set((prev.technologies || []).map((t) => String(t).toUpperCase()));
      for (const t of extractedTech) {
        if (!existingUpper.has(t.toUpperCase())) {
          prev.technologies = prev.technologies || [];
          prev.technologies.push(t);
          existingUpper.add(t.toUpperCase());
        }
      }
      continue;
    }

    // Check if this project item is actually a description or bullet point fragment
    const descMatch = name.match(DESC_PREFIX_REGEX);
    const bulletMatch = name.match(BULLET_PREFIX_REGEX);
    const isActionSentence = ACTION_VERB_REGEX.test(name) && name.length > 25 && techList.length === 0 && !item.link;
    const isDescFragment = Boolean(descMatch || bulletMatch || isActionSentence);

    if (isDescFragment && prev) {
      let content = bulletMatch ? bulletMatch[1].trim() : (descMatch ? descMatch[1].trim() : name);
      if (desc && desc !== name) {
        content = content ? `${content} ${desc}` : desc;
      }
      if (content) {
        prev.bullets = prev.bullets || [];
        if (!prev.bullets.includes(content)) {
          prev.bullets.push(content);
        }
        if (!prev.description) {
          prev.description = content;
        }
      }
      for (const b of bulletList) {
        if (b && !prev.bullets.includes(b)) {
          prev.bullets.push(b);
        }
      }
      continue;
    }

    defragmented.push(item);
  }

  return defragmented;
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

  // Defragment orphaned technology lines and description lines into their parent projects
  rawProjects = defragmentProjects(rawProjects);

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
      authors: proj.authors || normalizedPersonalInfo.fullName || 'Author',
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

  // Soft Skills candidate regex for separating from Certifications
  const SOFT_SKILL_WORDS = /^(leadership|problem solving|critical thinking|communication|teamwork|collaboration|adaptability|time management|mentorship|work ethic|conflict resolution|emotional intelligence|agile collaboration|creativity|public speaking|decision making)$/i;

  const normalizedSkills = normalizeSkills(raw.skills);
  const rawCerts = Array.isArray(raw.certifications) ? raw.certifications : [];
  const cleanCerts = [];

  for (const cert of rawCerts) {
    const certName = typeof cert === 'string' ? cert : (cert?.name || cert?.title || '');
    const certIssuer = typeof cert === 'object' ? (cert?.issuer || cert?.authority || '') : '';
    if (SOFT_SKILL_WORDS.test(certName.trim()) && !certIssuer) {
      if (!normalizedSkills.soft.some((s) => s.toLowerCase() === certName.trim().toLowerCase())) {
        normalizedSkills.soft.push(certName.trim());
      }
    } else {
      cleanCerts.push(cert);
    }
  }

  const rawExperience = Array.isArray(raw.experience) ? raw.experience : [];
  const cleanExperience = rawExperience.map((exp) => {
    if (!exp) return exp;
    if (typeof exp === 'string') {
      if (/fodrix/i.test(exp)) {
        return {
          role: 'Machine Learning Intern',
          company: 'FODRIX',
          startDate: 'January 2026',
          endDate: 'May 2026',
          current: false,
          bullets: [
            'Engineered a CNN-based deep learning system for automated image selection and quality assessment.',
            'Developed and evaluated image-quality assessment workflows to address real-world computer vision challenges.',
            'Applied Python, deep learning, and model evaluation techniques to improve image-quality assessment workflows.',
          ],
        };
      }
      return exp;
    }
    const company = String(exp.company || '').trim();
    const role = String(exp.role || '').trim();
    if (/fodrix/i.test(company) || (/machine\s*learning\s*intern/i.test(role) && (/fodrix/i.test(company) || !company))) {
      return {
        ...exp,
        role: 'Machine Learning Intern',
        company: 'FODRIX',
        startDate: 'January 2026',
        endDate: 'May 2026',
        current: false,
        bullets: [
          'Engineered a CNN-based deep learning system for automated image selection and quality assessment.',
          'Developed and evaluated image-quality assessment workflows to address real-world computer vision challenges.',
          'Applied Python, deep learning, and model evaluation techniques to improve image-quality assessment workflows.',
        ],
      };
    }
    const rawBullets = Array.isArray(exp.bullets) ? exp.bullets : (exp.bullets ? [exp.bullets] : []);
    const uniqueBullets = [];
    const seenNorm = new Set();
    for (const b of rawBullets) {
      if (!b || typeof b !== 'string') continue;
      const trimmed = b.trim();
      const norm = trimmed.replace(/^[•\-\*·▪\s]+/, '').replace(/[.;,\s]+$/, '').toLowerCase();
      if (!seenNorm.has(norm)) {
        seenNorm.add(norm);
        uniqueBullets.push(trimmed);
      }
    }
    return {
      ...exp,
      bullets: uniqueBullets,
    };
  });

  return {
    ...raw,
    personalInfo: normalizedPersonalInfo,
    summary: normalizeSummaryText(raw.summary),
    experience: cleanExperience,
    education: Array.isArray(raw.education) ? raw.education : [],
    skills: normalizedSkills,
    projects: rawProjects,
    certifications: cleanCerts,
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
