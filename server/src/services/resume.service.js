import mongoose from 'mongoose';
import Resume from '../models/Resume.model.js';
import { DEFAULT_TEMPLATE_ID, VALID_TEMPLATE_IDS, resolveTemplateId } from '../constants/templates.js';
import {
  normalizeSections,
  normalizeProjects,
  normalizeExperience,
  normalizeEducation,
  normalizeSkills,
  normalizeCertifications,
  normalizePersonalInfo,
  normalizeSummary,
  normalizePublications,
} from '../utils/sectionNormalizer.js';

export const normalizeSectionData = (sectionName, sectionData) => {
  switch (sectionName) {
    case 'projects':
      return normalizeProjects(sectionData);
    case 'experience':
      return normalizeExperience(sectionData);
    case 'education':
      return normalizeEducation(sectionData);
    case 'skills':
      return normalizeSkills(sectionData);
    case 'certifications':
      return normalizeCertifications(sectionData);
    case 'publications':
      return normalizePublications(sectionData);
    case 'personalInfo':
      return normalizePersonalInfo(sectionData);
    case 'summary':
      return normalizeSummary(sectionData);
    default:
      return sectionData;
  }
};

export const sanitizeSections = (sections) => {
  return normalizeSections(sections || {});
};

const normalizeTemplateId = (templateId) => resolveTemplateId(templateId);

export const createResume = async (userId, data = {}) => {
  const sections = sanitizeSections(data.sections || {});
  console.log("NORMALIZED RESUME SECTIONS:", JSON.stringify(sections, null, 2));
  const resume = await Resume.create({
    userId,
    title: data.title || 'Untitled Resume',
    templateId: normalizeTemplateId(data.templateId),
    targetRole: data.targetRole || '',
    sections,
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
    console.log("NORMALIZED RESUME SECTIONS:", JSON.stringify(updateData.sections, null, 2));
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
  const sections = sanitizeSections(parsedSections || {});
  console.log("NORMALIZED RESUME SECTIONS:", JSON.stringify(sections, null, 2));
  const resume = await Resume.create({
    userId,
    title,
    templateId: DEFAULT_TEMPLATE_ID,
    sections,
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
