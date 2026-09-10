import mongoose from 'mongoose';
import Resume from '../models/Resume.model.js';
import { DEFAULT_TEMPLATE_ID, VALID_TEMPLATE_IDS } from '../constants/templates.js';

// Strip invalid _id fields from subdocument arrays before saving.
// The client generates temporary _id values that are not valid ObjectIds.
const stripInvalidIds = (items) => items.map((item) => {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
  const { _id, ...rest } = item;
  if (_id && mongoose.Types.ObjectId.isValid(_id)) {
    return { _id, ...rest };
  }
  return rest;
});

export const normalizeSectionData = (sectionName, sectionData) => {
  if (sectionName === 'summary' && sectionData && typeof sectionData === 'object' && sectionData.text) {
    return sectionData.text;
  }

  if (sectionName === 'certifications') {
    const certs = Array.isArray(sectionData) ? sectionData : [sectionData];
    return stripInvalidIds(certs.filter(Boolean).map((cert) => {
      if (typeof cert === 'string') {
        return { name: cert, issuer: '', date: '', link: '' };
      }
      if (cert && typeof cert === 'object' && !Array.isArray(cert)) {
        return {
          name: cert.name || cert.title || cert.certification || '',
          issuer: cert.issuer || cert.organization || cert.provider || '',
          date: cert.date || cert.issueDate || cert.issued || '',
          link: cert.link || cert.url || cert.credentialUrl || '',
        };
      }
      return { name: String(cert), issuer: '', date: '', link: '' };
    }));
  }

  const arrayFields = ['experience', 'education', 'projects'];
  if (arrayFields.includes(sectionName) && Array.isArray(sectionData)) {
    return stripInvalidIds(sectionData);
  }

  return sectionData;
};

const sanitizeSections = (sections) => {
  if (!sections) return sections;
  const cleaned = { ...sections };
  const sectionNames = ['experience', 'education', 'projects', 'certifications'];

  for (const sectionName of sectionNames) {
    if (cleaned[sectionName] !== undefined) {
      cleaned[sectionName] = normalizeSectionData(sectionName, cleaned[sectionName]);
    }
  }
  return cleaned;
};

const normalizeTemplateId = (templateId) => (
  VALID_TEMPLATE_IDS.includes(templateId) ? templateId : DEFAULT_TEMPLATE_ID
);

export const createResume = async (userId, data = {}) => {
  const resume = await Resume.create({
    userId,
    title: data.title || 'Untitled Resume',
    templateId: normalizeTemplateId(data.templateId),
    targetRole: data.targetRole || '',
  });
  return resume;
};

export const getResumesByUser = async (userId) => {
  const resumes = await Resume.find({ userId })
    .sort({ updatedAt: -1 })
    .select('-__v');
  return resumes;
};

export const getResumeById = async (resumeId, userId) => {
  const resume = await Resume.findOne({ _id: resumeId, userId }).select('-__v');
  if (!resume) {
    const error = new Error('Resume not found.');
    error.statusCode = 404;
    throw error;
  }
  return resume;
};

export const updateResume = async (resumeId, userId, updateData) => {
  if (updateData.sections) {
    updateData.sections = sanitizeSections(updateData.sections);
  }
  if ('templateId' in updateData) {
    updateData.templateId = normalizeTemplateId(updateData.templateId);
  }
  const resume = await Resume.findOneAndUpdate(
    { _id: resumeId, userId },
    { $set: updateData },
    { returnDocument: 'after' }
  );
  if (!resume) {
    const error = new Error('Resume not found.');
    error.statusCode = 404;
    throw error;
  }
  return resume;
};

export const updateSection = async (resumeId, userId, sectionName, sectionData) => {
  const cleanData = normalizeSectionData(sectionName, sectionData);
  const updateKey = `sections.${sectionName}`;
  const resume = await Resume.findOneAndUpdate(
    { _id: resumeId, userId },
    { $set: { [updateKey]: cleanData } },
    { returnDocument: 'after' }
  );
  if (!resume) {
    const error = new Error('Resume not found.');
    error.statusCode = 404;
    throw error;
  }
  return resume;
};

export const updateTemplate = async (resumeId, userId, templateId) => {
  const resume = await Resume.findOneAndUpdate(
    { _id: resumeId, userId },
    { $set: { templateId: normalizeTemplateId(templateId) } },
    { returnDocument: 'after' }
  );
  if (!resume) {
    const error = new Error('Resume not found.');
    error.statusCode = 404;
    throw error;
  }
  return resume;
};

export const createFromUpload = async (userId, parsedSections, title = 'Uploaded Resume') => {
  const resume = await Resume.create({
    userId,
    title,
    templateId: DEFAULT_TEMPLATE_ID,
    sections: sanitizeSections(parsedSections),
  });
  return resume;
};

export const deleteResume = async (resumeId, userId) => {
  const resume = await Resume.findOneAndDelete({ _id: resumeId, userId });
  if (!resume) {
    const error = new Error('Resume not found.');
    error.statusCode = 404;
    throw error;
  }
  return resume;
};
