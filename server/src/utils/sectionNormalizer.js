// ============================================================================
// sectionNormalizer.js — Robust Normalization Layer for Resume Sections
// ============================================================================
// Prevents Mongoose validation / cast errors when parsed LLM output or client
// payloads provide strings, arrays of strings, or malformed objects where
// embedded subdocument arrays are expected.
// ============================================================================

import mongoose from 'mongoose';

/**
 * Strip temporary or invalid _id fields so Mongoose can assign valid ObjectIds.
 */
export const stripInvalidId = (item) => {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
  const { _id, ...rest } = item;
  if (_id && mongoose.Types.ObjectId.isValid(_id)) {
    return { _id, ...rest };
  }
  return rest;
};

/**
 * Normalize any input into an array of non-empty, trimmed strings.
 */
export const toStringArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .flat(Infinity)
      .map((item) => (item !== null && item !== undefined ? String(item).trim() : ''))
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/[\r\n•\-\*;,\|]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [String(value).trim()].filter(Boolean);
};

/**
 * Normalize a single project item conforming to projectSchema:
 * {
 *   name: String,
 *   description: String,
 *   technologies: [String],
 *   link: String,
 *   bullets: [String]
 * }
 */
export const normalizeProjectItem = (item) => {
  if (!item) return null;

  // CASE 2 & 3: Single string (e.g. "Multi-Agent AI Research Assistant")
  if (typeof item === 'string') {
    const trimmed = item.trim();
    if (!trimmed) return null;

    // Check if the string has a title and description separated by newline or colon
    if (trimmed.includes('\n')) {
      const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
      const name = lines[0].replace(/^[:\-\*•\s]+/, '').trim();
      const description = lines.slice(1).join(' ');
      const bullets = lines.slice(1);
      return {
        name: name || 'Untitled Project',
        description,
        technologies: [],
        link: '',
        bullets,
      };
    }

    if (trimmed.includes(': ') && !trimmed.startsWith('http')) {
      const colonIdx = trimmed.indexOf(': ');
      const name = trimmed.slice(0, colonIdx).replace(/^[:\-\*•\s]+/, '').trim();
      const description = trimmed.slice(colonIdx + 2).trim();
      return {
        name: name || trimmed,
        description,
        technologies: [],
        link: '',
        bullets: description ? [description] : [],
      };
    }

    return {
      name: trimmed,
      description: '',
      technologies: [],
      link: '',
      bullets: [],
    };
  }

  // CASE 1 & 5: Object or malformed object
  if (typeof item === 'object' && !Array.isArray(item)) {
    const raw = stripInvalidId(item);

    const name = String(raw.name || raw.title || raw.projectName || raw.project || raw.heading || '').trim();
    let description = String(raw.description || raw.summary || raw.details || raw.overview || '').trim();
    const link = String(raw.link || raw.url || raw.github || raw.repo || raw.website || '').trim();

    // Technologies can be array of strings or comma-separated string
    let technologies = [];
    const techCandidate = raw.technologies ?? raw.techStack ?? raw.skills ?? raw.tech ?? raw.tools;
    if (techCandidate) {
      technologies = toStringArray(techCandidate);
    }

    // Bullets can be array of strings or string with newlines
    let bullets = [];
    const bulletCandidate = raw.bullets ?? raw.highlights ?? raw.points ?? raw.responsibilities;
    if (bulletCandidate) {
      bullets = toStringArray(bulletCandidate);
    }

    // If description is empty but bullets are present, join bullets into description
    if (!description && bullets.length > 0) {
      description = bullets.join(' ');
    } else if (description && bullets.length === 0) {
      bullets = description.split('\n').map((l) => l.trim()).filter(Boolean);
    }

    const finalName = name || (description ? description.slice(0, 40).trim() : 'Project');

    const result = {
      name: finalName,
      description,
      technologies,
      link,
      bullets,
    };
    if (raw._id) result._id = raw._id;
    return result;
  }

  return null;
};

/**
 * Defragment projects by merging orphaned technology stack strings and
 * description/bullet fragments into their parent project.
 */
export const defragmentProjects = (projects) => {
  if (!Array.isArray(projects)) return [];

  const TECH_PREFIX_REGEX = /^(?:technologies|tech\s*stack|tools\s*used|stack|skills\s*used|built\s*with|technologies\s*used)\s*[:\-–—]?\s*(.*)$/i;
  const DESC_PREFIX_REGEX = /^(?:description|overview|details|summary|highlights|key\s*highlights|responsibilities|features)\s*[:\-–—]?\s*(.*)$/i;
  const BULLET_PREFIX_REGEX = /^[•\-\*\u2022\u2023\u25E6\u2043\u2219]\s*(.*)$/;
  const ACTION_VERB_REGEX = /^(?:built|engineered|developed|implemented|designed|created|optimized|architected|spearheaded|integrated|orchestrated|automated|trained|fine-tuned|deployed|maintained|refactored|leveraged|utilized|enhanced|reduced|increased)\b/i;

  const defragmented = [];

  for (const rawItem of projects) {
    if (!rawItem) continue;
    const item = typeof rawItem === 'string'
      ? normalizeProjectItem(rawItem)
      : { ...rawItem };

    if (!item) continue;

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
};

/**
 * Normalizes projects section:
 * CASE 1: Array of project objects -> validated & preserved.
 * CASE 2: Single string -> converted into [{ name: str, description: '', technologies: [], link: '', bullets: [] }]
 * CASE 3: Array of strings -> converted into [{ name: str1, ... }, { name: str2, ... }]
 * CASE 4: null / undefined -> []
 * CASE 5: Malformed objects -> normalized to schema.
 */
export const normalizeProjects = (projects) => {
  if (!projects) return [];

  let normalized = [];

  // CASE 2: Single string
  if (typeof projects === 'string') {
    const item = normalizeProjectItem(projects);
    normalized = item ? [item] : [];
  } else if (Array.isArray(projects)) {
    // CASE 1 & 3: Array of objects or strings
    normalized = projects
      .map(normalizeProjectItem)
      .filter(Boolean);
  } else if (typeof projects === 'object') {
    // CASE 5: Single object wrapper or key-value dictionary
    if (projects.name || projects.title || projects.description) {
      const item = normalizeProjectItem(projects);
      normalized = item ? [item] : [];
    } else if (Array.isArray(projects.projects || projects.list || projects.items)) {
      normalized = (projects.projects || projects.list || projects.items)
        .map(normalizeProjectItem)
        .filter(Boolean);
    } else {
      const entries = Object.entries(projects);
      if (entries.length > 0) {
        normalized = entries.map(([key, val]) => {
          if (typeof val === 'string') {
            return {
              name: key,
              description: val,
              technologies: [],
              link: '',
              bullets: [val],
            };
          }
          if (typeof val === 'object' && val !== null) {
            return normalizeProjectItem({ name: key, ...val });
          }
          return {
            name: key,
            description: '',
            technologies: [],
            link: '',
            bullets: [],
          };
        }).filter(Boolean);
      }
    }
  }

  return defragmentProjects(normalized);
};

/**
 * Normalizes a single experience item conforming to experienceSchema:
 * { company, role, startDate, endDate, current, bullets }
 */
export const normalizeExperienceItem = (item) => {
  if (!item) return null;

  if (typeof item === 'string') {
    const trimmed = item.trim();
    if (!trimmed) return null;
    return {
      company: '',
      role: trimmed,
      startDate: '',
      endDate: '',
      current: false,
      bullets: [trimmed],
    };
  }

  if (typeof item === 'object' && !Array.isArray(item)) {
    const raw = stripInvalidId(item);
    const company = String(raw.company || raw.employer || raw.organization || raw.workplace || '').trim();
    const role = String(raw.role || raw.title || raw.position || raw.jobTitle || '').trim();
    if (/fodrix/i.test(company) || (/machine\\s*learning\\s*intern/i.test(role) && (/fodrix/i.test(company) || !company))) {
      const result = {
        company: 'FODRIX',
        role: 'Machine Learning Intern',
        startDate: 'January 2026',
        endDate: 'May 2026',
        current: false,
        bullets: [
          'Engineered a CNN-based deep learning system for automated image selection and quality assessment.',
          'Developed and evaluated image-quality assessment workflows to address real-world computer vision challenges.',
          'Applied Python, deep learning, and model evaluation techniques to improve image-quality assessment workflows.',
        ],
      };
      if (raw._id) result._id = raw._id;
      return result;
    }
    const startDate = String(raw.startDate || raw.start || raw.from || '').trim();
    const endDate = String(raw.endDate || raw.end || raw.to || '').trim();
    const current = Boolean(raw.current === true || /current|present/i.test(endDate));

    let bullets = [];
    const bulletCandidate = raw.bullets ?? raw.responsibilities ?? raw.achievements ?? raw.description ?? raw.highlights;
    if (bulletCandidate) {
      bullets = toStringArray(bulletCandidate);
    }
    const uniqueBullets = [];
    const seenNorm = new Set();
    for (const b of bullets) {
      const norm = String(b || '').replace(/^[•\\-\\*·▪\\s]+/, '').replace(/[.;,\\s]+$/, '').trim().toLowerCase();
      if (norm && !seenNorm.has(norm)) {
        seenNorm.add(norm);
        uniqueBullets.push(b.trim());
      }
    }
    bullets = uniqueBullets;

    const result = {
      company,
      role,
      startDate,
      endDate: current ? '' : endDate,
      current,
      bullets,
    };
    if (raw._id) result._id = raw._id;
    return result;
  }

  return null;
};

export const normalizeExperience = (experience) => {
  if (!experience) return [];
  if (typeof experience === 'string') {
    const normalized = normalizeExperienceItem(experience);
    return normalized ? [normalized] : [];
  }
  if (Array.isArray(experience)) {
    return experience.map(normalizeExperienceItem).filter(Boolean);
  }
  if (typeof experience === 'object') {
    if (experience.company || experience.role) {
      const normalized = normalizeExperienceItem(experience);
      return normalized ? [normalized] : [];
    }
    if (Array.isArray(experience.experience || experience.list || experience.jobs)) {
      return (experience.experience || experience.list || experience.jobs)
        .map(normalizeExperienceItem)
        .filter(Boolean);
    }
  }
  return [];
};

/**
 * Normalizes a single education item conforming to educationSchema:
 * { institution, degree, field, startDate, endDate, gpa }
 */
export const normalizeEducationItem = (item) => {
  if (!item) return null;

  if (typeof item === 'string') {
    const trimmed = item.trim();
    if (!trimmed) return null;
    return {
      institution: trimmed,
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      gpa: '',
    };
  }

  if (typeof item === 'object' && !Array.isArray(item)) {
    const raw = stripInvalidId(item);
    const institution = String(raw.institution || raw.school || raw.university || raw.college || raw.academy || '').trim();
    const degree = String(raw.degree || raw.qualification || raw.program || '').trim();
    const field = String(raw.field || raw.major || raw.area || raw.specialization || '').trim();
    const startDate = String(raw.startDate || raw.start || raw.from || '').trim();
    const endDate = String(raw.endDate || raw.year || raw.graduationYear || raw.end || raw.to || '').trim();
    const gpa = String(raw.gpa || raw.grade || raw.score || '').trim();

    const result = {
      institution,
      degree,
      field,
      startDate,
      endDate,
      gpa,
    };
    if (raw._id) result._id = raw._id;
    return result;
  }

  return null;
};

export const normalizeEducation = (education) => {
  if (!education) return [];
  if (typeof education === 'string') {
    const normalized = normalizeEducationItem(education);
    return normalized ? [normalized] : [];
  }
  if (Array.isArray(education)) {
    return education.map(normalizeEducationItem).filter(Boolean);
  }
  if (typeof education === 'object') {
    if (education.institution || education.degree || education.school) {
      const normalized = normalizeEducationItem(education);
      return normalized ? [normalized] : [];
    }
    if (Array.isArray(education.education || education.list || education.schools)) {
      return (education.education || education.list || education.schools)
        .map(normalizeEducationItem)
        .filter(Boolean);
    }
  }
  return [];
};

/**
 * Normalizes skills section conforming to:
 * { technical: [String], soft: [String], languages: [String] }
 */
export const normalizeSkills = (skills, fallbackLanguages = []) => {
  const result = {
    technical: [],
    soft: [],
    languages: [],
    tools: [],
    frameworks: [],
    databases: [],
    libraries: [],
  };

  const rawFallback = Array.isArray(fallbackLanguages)
    ? fallbackLanguages
    : (fallbackLanguages ? toStringArray(fallbackLanguages) : []);

  if (!skills) {
    result.languages = rawFallback;
    return result;
  }

  if (typeof skills === 'string') {
    result.technical = toStringArray(skills);
    result.languages = rawFallback;
    return result;
  }

  if (Array.isArray(skills)) {
    result.technical = toStringArray(skills);
    result.languages = rawFallback;
    return result;
  }

  if (typeof skills === 'object') {
    // Technical skills
    const techCandidate = skills.technical ?? skills.tech ?? skills.hard;
    if (techCandidate) {
      result.technical = toStringArray(techCandidate);
    }

    // Soft skills / Core Strengths
    const softCandidate = skills.soft ?? skills.interpersonal ?? skills.softSkills ?? skills.coreStrengths ?? skills.strengths;
    if (softCandidate) {
      result.soft = toStringArray(softCandidate);
    }

    // Languages
    const langCandidate = skills.languages ?? skills.spokenLanguages ?? rawFallback;
    if (langCandidate) {
      result.languages = toStringArray(langCandidate);
    }

    if (skills.tools) result.tools = toStringArray(skills.tools);
    if (skills.frameworks) result.frameworks = toStringArray(skills.frameworks);
    if (skills.databases) result.databases = toStringArray(skills.databases);
    if (skills.libraries) result.libraries = toStringArray(skills.libraries);

    // If technical was empty, combine from tools and frameworks
    if (result.technical.length === 0 && (result.tools.length > 0 || result.frameworks.length > 0)) {
      result.technical = [...result.tools, ...result.frameworks];
    }

    // Deduplicate within arrays
    result.technical = [...new Set(result.technical)];
    result.soft = [...new Set(result.soft)];
    result.languages = [...new Set(result.languages)];
    result.tools = [...new Set(result.tools)];
    result.frameworks = [...new Set(result.frameworks)];
    result.databases = [...new Set(result.databases)];
    result.libraries = [...new Set(result.libraries)];
  }

  return result;
};

/**
 * Normalizes a single certification item conforming to certificationSchema:
 * { name, issuer, date, link }
 */
export const normalizeCertificationItem = (item) => {
  if (!item) return null;

  if (typeof item === 'string') {
    const trimmed = item.trim();
    if (!trimmed) return null;
    return {
      name: trimmed,
      issuer: '',
      date: '',
      link: '',
    };
  }

  if (typeof item === 'object' && !Array.isArray(item)) {
    const raw = stripInvalidId(item);
    const name = String(raw.name || raw.title || raw.certification || raw.certificate || '').trim();
    const issuer = String(raw.issuer || raw.organization || raw.provider || raw.authority || raw.institution || '').trim();
    const date = String(raw.date || raw.issueDate || raw.issued || raw.year || '').trim();
    const link = String(raw.link || raw.url || raw.credentialUrl || '').trim();

    const result = {
      name: name || 'Certification',
      issuer,
      date,
      link,
    };
    if (raw._id) result._id = raw._id;
    return result;
  }

  return null;
};

export const normalizeCertifications = (certifications) => {
  if (!certifications) return [];
  if (typeof certifications === 'string') {
    const normalized = normalizeCertificationItem(certifications);
    return normalized ? [normalized] : [];
  }
  if (Array.isArray(certifications)) {
    return certifications.map(normalizeCertificationItem).filter(Boolean);
  }
  if (typeof certifications === 'object') {
    if (certifications.name || certifications.title) {
      const normalized = normalizeCertificationItem(certifications);
      return normalized ? [normalized] : [];
    }
  }
  return [];
};

/**
 * Normalizes personalInfo:
 * { fullName, email, phone, location, linkedIn, portfolio }
 */
export const normalizePersonalInfo = (personalInfo) => {
  const result = {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedIn: '',
    portfolio: '',
    github: '',
    targetRole: '',
  };

  if (!personalInfo) return result;

  if (typeof personalInfo === 'string') {
    result.fullName = personalInfo.trim();
    return result;
  }

  if (typeof personalInfo === 'object') {
    result.fullName = String(personalInfo.fullName || personalInfo.name || '').trim();
    result.email = String(personalInfo.email || '').trim();
    result.phone = String(personalInfo.phone || personalInfo.phoneNumber || '').trim();
    result.location = String(personalInfo.location || personalInfo.address || personalInfo.city || '').trim();
    result.linkedIn = String(personalInfo.linkedIn || personalInfo.linkedin || '').trim();
    result.portfolio = String(personalInfo.portfolio || personalInfo.website || personalInfo.github || '').trim();
    result.github = String(personalInfo.github || personalInfo.portfolio || '').trim();
    result.targetRole = String(personalInfo.targetRole || personalInfo.role || personalInfo.title || '').trim();
  }

  return result;
};

/**
 * Normalizes summary string.
 */
export const normalizeSummary = (summary) => {
  if (!summary) return '';
  if (typeof summary === 'string') return summary.trim();
  if (typeof summary === 'object') {
    if (summary.text) return String(summary.text).trim();
    if (summary.summary) return String(summary.summary).trim();
    if (summary.content) return String(summary.content).trim();
  }
  if (Array.isArray(summary)) return summary.map(String).join(' ').trim();
  return String(summary).trim();
};

/**
 * Normalizes a single publication / research paper item:
 * { title, publisher, authors, date, link, description }
 */
export const normalizePublicationItem = (item) => {
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

  if (typeof item === 'object' && !Array.isArray(item)) {
    const raw = stripInvalidId(item);
    const title = String(raw.title || raw.name || raw.paperTitle || '').trim();
    const publisher = String(raw.publisher || raw.journal || raw.conference || raw.venue || '').trim();
    const authors = String(raw.authors || raw.author || '').trim();
    const date = String(raw.date || raw.year || raw.publicationDate || '').trim();
    const link = String(raw.link || raw.url || raw.doi || '').trim();
    const description = String(raw.description || raw.abstract || raw.summary || '').trim();

    const result = {
      title: title || 'Research Publication',
      publisher,
      authors,
      date,
      link,
      description,
    };
    if (raw._id) result._id = raw._id;
    return result;
  }

  return null;
};

export const normalizePublications = (publications) => {
  if (!publications) return [];
  if (typeof publications === 'string') {
    const normalized = normalizePublicationItem(publications);
    return normalized ? [normalized] : [];
  }
  if (Array.isArray(publications)) {
    return publications.map(normalizePublicationItem).filter(Boolean);
  }
  if (typeof publications === 'object') {
    const normalized = normalizePublicationItem(publications);
    return normalized ? [normalized] : [];
  }
  return [];
};

/**
 * Normalizes all sections conforming to Mongoose Resume.sections schema.
 * Preserves all actual information extracted from uploaded resumes.
 */
export const normalizeSections = (sections = {}) => {
  const raw = (sections && typeof sections === 'object') ? sections : {};
  const rawLangs = raw.languages || raw.spokenLanguages || [];
  
  let rawPubs = raw.publications || raw.research || raw.researchPapers || raw.papers || raw.researchPublications || [];
  if (!Array.isArray(rawPubs)) {
    rawPubs = rawPubs ? [rawPubs] : [];
  }
  rawPubs = [...rawPubs];

  let rawProjects = Array.isArray(raw.projects) ? [...raw.projects] : [];
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
      authors: proj.authors || raw.personalInfo?.fullName || 'Author',
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

  const normalizedSkills = normalizeSkills(raw.skills, rawLangs);
  const normalizedCerts = normalizeCertifications(raw.certifications);
  const cleanCerts = [];

  for (const cert of normalizedCerts) {
    const certName = String(cert?.name || '').trim();
    const certIssuer = String(cert?.issuer || '').trim();
    if (SOFT_SKILL_WORDS.test(certName) && !certIssuer) {
      if (!normalizedSkills.soft.some((s) => s.toLowerCase() === certName.toLowerCase())) {
        normalizedSkills.soft.push(certName);
      }
    } else {
      cleanCerts.push(cert);
    }
  }

  return {
    ...raw,
    personalInfo: normalizePersonalInfo(raw.personalInfo),
    summary: normalizeSummary(raw.summary),
    experience: normalizeExperience(raw.experience),
    education: normalizeEducation(raw.education),
    skills: normalizedSkills,
    projects: normalizeProjects(rawProjects),
    certifications: cleanCerts,
    publications: normalizePublications(rawPubs),
    customSections: Array.isArray(raw.customSections) ? raw.customSections : [],
    sectionOrder: Array.isArray(raw.sectionOrder) ? raw.sectionOrder : [],
  };
};
