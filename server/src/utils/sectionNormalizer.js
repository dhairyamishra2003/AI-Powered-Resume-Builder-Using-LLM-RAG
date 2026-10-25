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
 * Normalizes projects section:
 * CASE 1: Array of project objects -> validated & preserved.
 * CASE 2: Single string -> converted into [{ name: str, description: '', technologies: [], link: '', bullets: [] }]
 * CASE 3: Array of strings -> converted into [{ name: str1, ... }, { name: str2, ... }]
 * CASE 4: null / undefined -> []
 * CASE 5: Malformed objects -> normalized to schema.
 */
export const normalizeProjects = (projects) => {
  if (!projects) return [];

  // CASE 2: Single string
  if (typeof projects === 'string') {
    const normalized = normalizeProjectItem(projects);
    return normalized ? [normalized] : [];
  }

  // CASE 1 & 3: Array of objects or strings
  if (Array.isArray(projects)) {
    return projects
      .map(normalizeProjectItem)
      .filter(Boolean);
  }

  // CASE 5: Single object wrapper or key-value dictionary
  if (typeof projects === 'object') {
    if (projects.name || projects.title || projects.description) {
      const normalized = normalizeProjectItem(projects);
      return normalized ? [normalized] : [];
    }
    if (Array.isArray(projects.projects || projects.list || projects.items)) {
      return (projects.projects || projects.list || projects.items)
        .map(normalizeProjectItem)
        .filter(Boolean);
    }
    const entries = Object.entries(projects);
    if (entries.length > 0) {
      return entries.map(([key, val]) => {
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

  return [];
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
    const startDate = String(raw.startDate || raw.start || raw.from || '').trim();
    const endDate = String(raw.endDate || raw.end || raw.to || '').trim();
    const current = Boolean(raw.current === true || /current|present/i.test(endDate));

    let bullets = [];
    const bulletCandidate = raw.bullets ?? raw.responsibilities ?? raw.achievements ?? raw.description ?? raw.highlights;
    if (bulletCandidate) {
      bullets = toStringArray(bulletCandidate);
    }

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
export const normalizeSkills = (skills) => {
  const result = {
    technical: [],
    soft: [],
    languages: [],
  };

  if (!skills) return result;

  if (typeof skills === 'string') {
    result.technical = toStringArray(skills);
    return result;
  }

  if (Array.isArray(skills)) {
    result.technical = toStringArray(skills);
    return result;
  }

  if (typeof skills === 'object') {
    // Technical skills
    const techCandidate = skills.technical ?? skills.tech ?? skills.hard ?? skills.tools ?? skills.frameworks;
    if (techCandidate) {
      result.technical = toStringArray(techCandidate);
    }

    // Soft skills
    const softCandidate = skills.soft ?? skills.interpersonal ?? skills.softSkills;
    if (softCandidate) {
      result.soft = toStringArray(softCandidate);
    }

    // Languages
    const langCandidate = skills.languages ?? skills.spokenLanguages;
    if (langCandidate) {
      result.languages = toStringArray(langCandidate);
    }

    // Gather any additional specialized skill categories (e.g. backend, frontend, devops) into technical
    const recognizedKeys = new Set(['technical', 'tech', 'hard', 'tools', 'frameworks', 'soft', 'interpersonal', 'softSkills', 'languages', 'spokenLanguages']);
    for (const [key, val] of Object.entries(skills)) {
      if (!recognizedKeys.has(key) && val) {
        const extra = toStringArray(val);
        if (extra.length > 0) {
          result.technical = [...result.technical, ...extra];
        }
      }
    }

    // Deduplicate within arrays
    result.technical = [...new Set(result.technical)];
    result.soft = [...new Set(result.soft)];
    result.languages = [...new Set(result.languages)];
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
 * Normalizes all sections conforming to Mongoose Resume.sections schema.
 * Preserves all actual information extracted from uploaded resumes.
 */
export const normalizeSections = (sections = {}) => {
  const raw = (sections && typeof sections === 'object') ? sections : {};
  return {
    personalInfo: normalizePersonalInfo(raw.personalInfo),
    summary: normalizeSummary(raw.summary),
    experience: normalizeExperience(raw.experience),
    education: normalizeEducation(raw.education),
    skills: normalizeSkills(raw.skills),
    projects: normalizeProjects(raw.projects),
    certifications: normalizeCertifications(raw.certifications),
  };
};
