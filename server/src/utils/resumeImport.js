import { inflateRawSync } from 'node:zlib';
import { z } from 'zod';
import extractTextFromPdf from './resumeParser.js';
import { normalizeSections } from './sectionNormalizer.js';

const stringValue = z.string().trim().max(10000);
const stringArray = z.array(stringValue).max(100);

// This validates the AI boundary. Normalization then maps accepted synonyms to
// the app's established Resume.sections schema without changing that schema.
export const importedSectionsSchema = z.object({
  personalInfo: z.object({
    fullName: stringValue.optional(), email: stringValue.optional(), phone: stringValue.optional(),
    location: stringValue.optional(), linkedIn: stringValue.optional(), portfolio: stringValue.optional(), github: stringValue.optional(),
  }).optional(),
  summary: stringValue.optional(),
  experience: z.array(z.object({
    company: stringValue.optional(), role: stringValue.optional(), location: stringValue.optional(),
    startDate: stringValue.optional(), endDate: stringValue.optional(), current: z.boolean().optional(),
    bullets: stringArray.optional(), responsibilities: stringArray.optional(), achievements: stringArray.optional(),
  }).passthrough()).max(50).optional(),
  education: z.array(z.object({
    institution: stringValue.optional(), degree: stringValue.optional(), field: stringValue.optional(),
    location: stringValue.optional(), startDate: stringValue.optional(), endDate: stringValue.optional(),
    gpa: stringValue.optional(), cgpa: stringValue.optional(), percentage: stringValue.optional(),
  }).passthrough()).max(50).optional(),
  skills: z.object({
    technical: stringArray.optional(), tools: stringArray.optional(), languages: stringArray.optional(),
    frameworks: stringArray.optional(), databases: stringArray.optional(), other: stringArray.optional(), soft: stringArray.optional(),
  }).passthrough().optional(),
  projects: z.array(z.object({
    name: stringValue.optional(), title: stringValue.optional(), description: stringValue.optional(),
    technologies: stringArray.optional(), link: stringValue.optional(), githubUrl: stringValue.optional(),
    liveUrl: stringValue.optional(), bullets: stringArray.optional(),
  }).passthrough()).max(50).optional(),
  certifications: z.array(z.union([stringValue, z.object({
    name: stringValue.optional(), issuer: stringValue.optional(), date: stringValue.optional(), link: stringValue.optional(),
  }).passthrough()])).max(50).optional(),
  publications: z.array(z.union([stringValue, z.object({
    title: stringValue.optional(), name: stringValue.optional(), publisher: stringValue.optional(), venue: stringValue.optional(),
    authors: stringValue.optional(), date: stringValue.optional(), year: stringValue.optional(), link: stringValue.optional(),
    doi: stringValue.optional(), url: stringValue.optional(), description: stringValue.optional(), abstract: stringValue.optional(),
  }).passthrough()])).max(50).optional(),
  researchPapers: z.array(z.any()).optional(),
  achievements: stringArray.optional(),
}).passthrough();

const mapImportedSections = (sections) => ({
  ...sections,
  personalInfo: {
    ...sections.personalInfo,
    portfolio: sections.personalInfo?.portfolio || sections.personalInfo?.github || '',
  },
  experience: (sections.experience || []).map((item) => ({
    ...item,
    bullets: [...(item.bullets || []), ...(item.responsibilities || []), ...(item.achievements || [])],
  })),
  education: (sections.education || []).map((item) => ({
    ...item,
    gpa: item.gpa || item.cgpa || item.percentage || '',
  })),
  projects: (sections.projects || []).map((item) => ({
    ...item,
    name: item.name || item.title || '',
    link: item.link || item.githubUrl || item.liveUrl || '',
  })),
  publications: sections.publications || sections.researchPapers || [],
});

const isMeaningful = (value) => typeof value === 'string' && value.trim() && !/^candidate$/i.test(value.trim());

const isSoftSkillCandidate = (val) => {
  const s = String(val || '').toLowerCase().trim();
  return /^(?:problem\s+solving|critical\s+thinking|team\s+collaboration|teamwork|leadership|team\s+leadership|communication|interpersonal\s+skills|time\s+management|work\s+ethic|adaptability|flexibility|strategic\s+thinking|strategic\s+leadership|conflict\s+resolution|negotiation|public\s+speaking|presentation\s+skills|emotional\s+intelligence|creativity|cross-functional\s+communication|agile\s*&?\s*scrum(?:\s+delivery)?|agile\s+delivery)$/i.test(s);
};

const itemIdentity = (item) => {
  if (typeof item === 'string') return item.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!item || typeof item !== 'object') return '';
  const canonical = item.name || item.title || item.company || item.role || item.institution;
  if (canonical) {
    return String(canonical)
      .trim()
      .toLowerCase()
      .replace(/^(?:project\s*\d*[:\-–—]?|key\s+projects?[:\-–—]?)\s*/i, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }
  return '';
};

const itemsMatch = (id1, id2) => {
  if (!id1 || !id2) return false;
  if (id1 === id2) return true;
  if (id1.length >= 6 && id2.length >= 6) {
    if (id1.startsWith(id2) || id2.startsWith(id1)) return true;
  }
  return false;
};

const normalizeBullet = (b) => String(b || '').replace(/^[•\-\*·▪\s]+/, '').replace(/[.;,\s]+$/, '').trim().toLowerCase();

const mergeBullets = (b1 = [], b2 = []) => {
  const result = [];
  const seen = new Set();
  for (const b of [...b1, ...b2]) {
    const raw = typeof b === 'string' ? b.trim() : String(b || '').trim();
    if (!raw) continue;
    const norm = normalizeBullet(raw);
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      result.push(raw);
    }
  }
  return result;
};

const mergeTechList = (t1 = [], t2 = []) => {
  const result = [];
  const seen = new Set();
  for (const t of [...t1, ...t2]) {
    const raw = typeof t === 'string' ? t.trim() : String(t || '').trim();
    if (!raw) continue;
    const norm = raw.toLowerCase();
    if (!seen.has(norm)) {
      seen.add(norm);
      result.push(raw);
    }
  }
  return result;
};

const mergeArrays = (primary = [], fallback = []) => {
  const merged = [...primary];
  for (const fallbackItem of fallback) {
    const identity = itemIdentity(fallbackItem);
    const existingIndex = identity ? merged.findIndex((item) => itemsMatch(itemIdentity(item), identity)) : -1;
    if (existingIndex === -1) {
      merged.push(fallbackItem);
      continue;
    }
    const existing = merged[existingIndex];
    if (existing && fallbackItem && typeof existing === 'object' && typeof fallbackItem === 'object') {
      const combined = { ...fallbackItem, ...existing };
      for (const [key, value] of Object.entries(fallbackItem)) {
        if (!combined[key] || (Array.isArray(combined[key]) && combined[key].length === 0)) combined[key] = value;
      }
      combined.bullets = mergeBullets(existing.bullets || [], fallbackItem.bullets || []);
      combined.technologies = mergeTechList(existing.technologies || [], fallbackItem.technologies || []);
      merged[existingIndex] = combined;
    }
  }
  return merged;
};

// AI is better at semantics while the deterministic parser reliably catches
// literal contact details and items after the model context window. Merge at
// field level so neither source can discard data found by the other.
export const mergeImportedSections = (aiSections = {}, fallbackSections = {}) => {
  const primary = mapImportedSections(aiSections || {});
  const fallback = mapImportedSections(fallbackSections || {});
  const personalInfo = { ...(fallback.personalInfo || {}), ...(primary.personalInfo || {}) };
  for (const [key, value] of Object.entries(fallback.personalInfo || {})) {
    if (!isMeaningful(personalInfo[key])) personalInfo[key] = value;
  }

  const rawCertifications = mergeArrays(primary.certifications || [], fallback.certifications || []);
  const realCertifications = [];
  const reroutedSoftSkills = [];

  for (const cert of rawCertifications) {
    const certName = typeof cert === 'string' ? cert : (cert?.name || cert?.title || '');
    const certIssuer = typeof cert === 'object' ? (cert?.issuer || '') : '';
    if (isSoftSkillCandidate(certName) && !certIssuer) {
      reroutedSoftSkills.push(certName);
    } else {
      realCertifications.push(cert);
    }
  }

  const mergedSkills = Object.fromEntries(
    [...new Set([...Object.keys(fallback.skills || {}), ...Object.keys(primary.skills || {})])].map((key) => [
      key,
      mergeArrays(primary.skills?.[key] || [], fallback.skills?.[key] || []),
    ])
  );

  if (reroutedSoftSkills.length > 0) {
    mergedSkills.soft = mergeTechList(mergedSkills.soft || [], reroutedSoftSkills);
  }

  return {
    ...fallback,
    ...primary,
    personalInfo,
    summary: isMeaningful(primary.summary) ? primary.summary : (fallback.summary || ''),
    skills: mergedSkills,
    experience: mergeArrays(primary.experience || [], fallback.experience || []),
    education: mergeArrays(primary.education || [], fallback.education || []),
    projects: mergeArrays(primary.projects || [], fallback.projects || []),
    certifications: realCertifications,
    publications: mergeArrays(primary.publications || [], fallback.publications || []),
  };
};

const xmlText = (xml) => xml
  .replace(/<w:tab[^>]*\/>/g, '\t')
  .replace(/<w:br[^>]*\/>/g, '\n')
  .replace(/<\/w:p>/g, '\n')
  .replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#(\d+);/g, (_, value) => String.fromCharCode(Number(value)))
  .replace(/\n{3,}/g, '\n\n').trim();

// DOCX is a ZIP. This small reader only reads word/document.xml and supports
// the deflate/store methods used by normal DOCX files; uploads remain in memory.
const extractDocxText = (buffer) => {
  const end = buffer.lastIndexOf(Buffer.from('PK\x05\x06'));
  if (end < 0) throw new Error('The DOCX file is corrupted.');
  const centralOffset = buffer.readUInt32LE(end + 16);
  let position = centralOffset;
  while (position < buffer.length && buffer.readUInt32LE(position) === 0x02014b50) {
    const method = buffer.readUInt16LE(position + 10);
    const compressedSize = buffer.readUInt32LE(position + 20);
    const nameLength = buffer.readUInt16LE(position + 28);
    const extraLength = buffer.readUInt16LE(position + 30);
    const commentLength = buffer.readUInt16LE(position + 32);
    const localOffset = buffer.readUInt32LE(position + 42);
    const name = buffer.subarray(position + 46, position + 46 + nameLength).toString('utf8');
    if (name === 'word/document.xml') {
      if (buffer.readUInt32LE(localOffset) !== 0x04034b50) throw new Error('The DOCX file is corrupted.');
      const localNameLength = buffer.readUInt16LE(localOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localOffset + 28);
      const data = buffer.subarray(localOffset + 30 + localNameLength + localExtraLength, localOffset + 30 + localNameLength + localExtraLength + compressedSize);
      const xml = (method === 0 ? data : method === 8 ? inflateRawSync(data) : null);
      if (!xml) throw new Error('The DOCX compression format is unsupported.');
      return xmlText(xml.toString('utf8'));
    }
    position += 46 + nameLength + extraLength + commentLength;
  }
  throw new Error('The DOCX document does not contain readable text.');
};

export const importDocument = async (file) => {
  const extension = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (extension === '.json') {
    let raw;
    try { raw = JSON.parse(file.buffer.toString('utf8')); } catch { throw new Error('The JSON file is invalid.'); }
    const candidate = raw.sections || raw;
    const validated = importedSectionsSchema.safeParse(candidate);
    if (!validated.success) throw new Error('The JSON does not match the supported resume format.');
    return { sections: normalizeSections(mapImportedSections(validated.data)), source: 'json' };
  }
  let text;
  if (extension === '.pdf') text = await extractTextFromPdf(file.buffer);
  else if (extension === '.docx') text = extractDocxText(file.buffer);
  else if (extension === '.txt') text = file.buffer.toString('utf8').replace(/\0/g, '').trim();
  else throw new Error('Unsupported file type. Upload a PDF, DOCX, TXT, or JSON file.');
  if (!text || text.trim().length < 10) throw new Error('The document is empty or contains no readable text.');
  // Keep the full extracted document for deterministic recovery. The caller
  // limits only the model input; slicing here previously dropped every section
  // appearing later in a long resume before either parser could inspect it.
  return { text, source: extension.slice(1) };
};

export const validateImportedSections = (data) => {
  const parsed = importedSectionsSchema.safeParse(data);
  const rawData = parsed.success ? parsed.data : (data && typeof data === 'object' ? data : {});
  return normalizeSections(mapImportedSections(rawData));
};

const SECTION_PATTERNS = {
  experience: /\b(?:work\s+experience|professional\s+experience|employment\s+history|experience|work\s+history)\b/i,
  education: /\b(?:education|academic\s+background|academic\s+qualifications|academics|qualifications)\b/i,
  skills: /\b(?:technical\s+skills|skills|technologies|proficiencies|core\s+competencies|technical\s+expertise|tools\s*&?\s*technologies)\b/i,
  projects: /\b(?:projects|personal\s+projects|academic\s+projects|key\s+projects|technical\s+projects)\b/i,
  certifications: /\b(?:certifications|certificates|licenses|credentials|accreditations)\b/i,
  publications: /\b(?:publications|research(?:\s+papers)?|scholarly\s+articles)\b/i,
  languages: /\b(?:languages|language\s+proficiency)\b/i,
};

export const verifyImportCompleteness = (extractedText = '', parsedSections = {}, fallbackSections = {}) => {
  const complete = { ...parsedSections };
  const warnings = [];
  const detected = [];
  const recovered = [];

  const text = typeof extractedText === 'string' ? extractedText : '';
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  for (const [sectionKey, pattern] of Object.entries(SECTION_PATTERNS)) {
    const hasHeader = lines.some((l) => l.length < 50 && pattern.test(l));
    if (hasHeader) {
      detected.push(sectionKey);
    }
  }

  // 1. Check Projects
  if (detected.includes('projects')) {
    const hasProjects = Array.isArray(complete.projects) && complete.projects.length > 0;
    if (!hasProjects && Array.isArray(fallbackSections.projects) && fallbackSections.projects.length > 0) {
      complete.projects = fallbackSections.projects;
      recovered.push('projects');
    } else if (!hasProjects && (!fallbackSections.projects || fallbackSections.projects.length === 0)) {
      warnings.push('Projects section was detected in document but could not be extracted.');
    }
  }

  // 2. Check Experience
  if (detected.includes('experience')) {
    const hasExp = Array.isArray(complete.experience) && complete.experience.length > 0;
    if (!hasExp && Array.isArray(fallbackSections.experience) && fallbackSections.experience.length > 0) {
      complete.experience = fallbackSections.experience;
      recovered.push('experience');
    } else if (!hasExp && (!fallbackSections.experience || fallbackSections.experience.length === 0)) {
      warnings.push('Work experience section was detected in document but could not be extracted.');
    }
  }

  // 3. Check Education
  if (detected.includes('education')) {
    const hasEdu = Array.isArray(complete.education) && complete.education.length > 0;
    if (!hasEdu && Array.isArray(fallbackSections.education) && fallbackSections.education.length > 0) {
      complete.education = fallbackSections.education;
      recovered.push('education');
    } else if (!hasEdu && (!fallbackSections.education || fallbackSections.education.length === 0)) {
      warnings.push('Education section was detected in document but could not be extracted.');
    }
  }

  // 4. Check Certifications
  if (detected.includes('certifications')) {
    const hasCerts = Array.isArray(complete.certifications) && complete.certifications.length > 0;
    if (!hasCerts && Array.isArray(fallbackSections.certifications) && fallbackSections.certifications.length > 0) {
      complete.certifications = fallbackSections.certifications;
      recovered.push('certifications');
    }
  }

  // 5. Check Publications / Research
  if (detected.includes('publications')) {
    const hasPubs = Array.isArray(complete.publications) && complete.publications.length > 0;
    if (!hasPubs && Array.isArray(fallbackSections.publications) && fallbackSections.publications.length > 0) {
      complete.publications = fallbackSections.publications;
      recovered.push('publications');
    }
  }

  // 6. Check Skills & Languages
  if (detected.includes('skills')) {
    const hasSkills = complete.skills && Object.values(complete.skills).some((arr) => Array.isArray(arr) && arr.length > 0);
    if (!hasSkills && fallbackSections.skills && Object.values(fallbackSections.skills).some((arr) => Array.isArray(arr) && arr.length > 0)) {
      complete.skills = fallbackSections.skills;
      recovered.push('skills');
    }
  }

  if (detected.includes('languages') || (fallbackSections.skills?.languages?.length > 0)) {
    complete.skills = complete.skills || {};
    if (!complete.skills.languages || complete.skills.languages.length === 0) {
      if (fallbackSections.skills?.languages?.length > 0) {
        complete.skills.languages = fallbackSections.skills.languages;
        recovered.push('languages');
      }
    }
  }

  // 7. Personal Info Recovery
  complete.personalInfo = complete.personalInfo || {};
  if (fallbackSections.personalInfo) {
    for (const field of ['fullName', 'email', 'phone', 'location', 'linkedIn', 'portfolio', 'targetRole']) {
      if (!isMeaningful(complete.personalInfo[field]) && isMeaningful(fallbackSections.personalInfo[field])) {
        complete.personalInfo[field] = fallbackSections.personalInfo[field];
      }
    }
  }

  return {
    sections: complete,
    warnings,
    recovered,
    detectedSections: detected,
  };
};

