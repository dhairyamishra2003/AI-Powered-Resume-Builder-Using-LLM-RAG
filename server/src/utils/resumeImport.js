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
  return { text: text.slice(0, 30000), source: extension.slice(1) };
};

export const validateImportedSections = (data) => {
  const parsed = importedSectionsSchema.safeParse(data);
  const rawData = parsed.success ? parsed.data : (data && typeof data === 'object' ? data : {});
  return normalizeSections(mapImportedSections(rawData));
};
