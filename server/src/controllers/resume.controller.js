import * as resumeService from '../services/resume.service.js';
import extractTextFromPdf, { extractFallbackSections } from '../utils/resumeParser.js';
import * as aiService from '../services/ai.service.js';
import { VALID_TEMPLATE_IDS } from '../constants/templates.js';
import { importDocument, validateImportedSections } from '../utils/resumeImport.js';
import { hasPdfSignature } from '../middleware/upload.middleware.js';

export const createResume = async (req, res, next) => {
  try {
    const resume = await resumeService.createResume(req.user._id, req.body);
    return res.status(201).json({ success: true, data: resume });
  } catch (error) {
    next(error);
  }
};

export const getResumes = async (req, res, next) => {
  try {
    const resumes = await resumeService.getResumesByUser(req.user._id);
    return res.json({ success: true, data: resumes });
  } catch (error) {
    next(error);
  }
};

export const getResume = async (req, res, next) => {
  try {
    const resume = await resumeService.getResumeById(req.params.id, req.user._id);
    return res.json({ success: true, data: resume });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

export const updateResume = async (req, res, next) => {
  try {
    const resume = await resumeService.updateResume(req.params.id, req.user._id, req.body);
    return res.json({ success: true, data: resume });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

export const updateSection = async (req, res, next) => {
  try {
    const { section } = req.params;
    const validSections = ['personalInfo', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'publications', 'customSections', 'sectionOrder'];
    if (!validSections.includes(section)) {
      return res.status(400).json({ success: false, message: `Invalid section: ${section}` });
    }

    const resume = await resumeService.updateSection(req.params.id, req.user._id, section, req.body.data);
    return res.json({ success: true, data: resume });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

export const updateTemplate = async (req, res, next) => {
  try {
    const { templateId } = req.body;
    if (!VALID_TEMPLATE_IDS.includes(templateId)) {
      return res.status(400).json({ success: false, message: `Invalid template: ${templateId}` });
    }

    const resume = await resumeService.updateTemplate(req.params.id, req.user._id, templateId);
    return res.json({ success: true, data: resume });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

export const deleteResume = async (req, res, next) => {
  try {
    await resumeService.deleteResume(req.params.id, req.user._id);
    return res.json({ success: true, data: { message: 'Resume deleted successfully' } });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

export const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF file uploaded.' });
    }

    if (!hasPdfSignature(req.file.buffer)) {
      return res.status(400).json({
        success: false,
        message: 'The selected file is not a valid PDF.',
      });
    }

    // ── Step 1: Extract raw text from the PDF buffer ──────────────────────
    let extractedText;
    try {
      extractedText = await extractTextFromPdf(req.file.buffer);
    } catch (pdfError) {
      console.error('[Upload] PDF text extraction failed:', pdfError.message);
      return res.status(422).json({
        success: false,
        message: 'Could not read this PDF. Please ensure it is not password-protected and contains selectable text (not a scanned image).',
      });
    }

    if (!extractedText || extractedText.length < 50) {
      return res.status(422).json({
        success: false,
        message: 'Could not extract enough text from the PDF. Please use a text-based (not scanned/image) PDF.',
      });
    }

    // Trim to 15 000 chars to stay within Gemini token limits on large PDFs
    const trimmedText = extractedText.length > 15000
      ? extractedText.slice(0, 15000)
      : extractedText;

    // ── Step 2: AI parsing with automatic resilient heuristic fallback ──
    let parsedSections;
    try {
      const parsePromise = aiService.parseResume({ resumeText: trimmedText });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI parsing timeout (12s)')), 12000)
      );
      parsedSections = await Promise.race([parsePromise, timeoutPromise]);
    } catch (aiError) {
      console.warn('[Upload] AI parsing encountered an issue or timed out, seamlessly applying heuristic fallback parser:', aiError.message);
      parsedSections = extractFallbackSections(trimmedText);
    }

    // Derive a clean title from the uploaded file's original name
    const rawTitle = req.file.originalname
      ? req.file.originalname.replace(/(\.pdf)+$/i, '').trim()
      : 'Uploaded Resume';
    const title = rawTitle || 'Uploaded Resume';

    // ── Step 3: Save parsed resume to database ────────────────────────────
    const resume = await resumeService.createFromUpload(req.user._id, parsedSections, title);
    return res.status(201).json({ success: true, data: resume });
  } catch (error) {
    next(error);
  }
};

export const importResume = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Choose a PDF, DOCX, TXT, or JSON file to import.' });
    let imported;
    try {
      imported = await importDocument(req.file);
    } catch (error) {
      return res.status(422).json({ success: false, message: error.message || 'Unable to read this document.' });
    }
    if (imported.sections) return res.json({ success: true, data: { sections: imported.sections, source: imported.source } });

    let sections;
    try {
      const parsePromise = aiService.parseResumeImport({ resumeText: imported.text });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI parsing timeout (12s)')), 12000)
      );
      const parsed = await Promise.race([parsePromise, timeoutPromise]);
      sections = validateImportedSections(parsed);

      // Merge with deterministic fallback if any critical fields were missed by AI
      const fallback = extractFallbackSections(imported.text);
      if (!sections.personalInfo?.fullName || sections.personalInfo.fullName === 'Candidate') {
        if (fallback.personalInfo?.fullName && fallback.personalInfo.fullName !== 'Candidate') {
          sections.personalInfo.fullName = fallback.personalInfo.fullName;
        }
      }
      if (!sections.personalInfo?.email && fallback.personalInfo?.email) sections.personalInfo.email = fallback.personalInfo.email;
      if (!sections.personalInfo?.phone && fallback.personalInfo?.phone) sections.personalInfo.phone = fallback.personalInfo.phone;
      if (!sections.personalInfo?.location && fallback.personalInfo?.location) sections.personalInfo.location = fallback.personalInfo.location;
      if (!sections.personalInfo?.linkedIn && fallback.personalInfo?.linkedIn) sections.personalInfo.linkedIn = fallback.personalInfo.linkedIn;
      if (!sections.personalInfo?.portfolio && fallback.personalInfo?.portfolio) sections.personalInfo.portfolio = fallback.personalInfo.portfolio;
      if (!sections.summary && fallback.summary) sections.summary = fallback.summary;
      if ((!sections.experience || sections.experience.length === 0) && fallback.experience?.length > 0) {
        sections.experience = fallback.experience;
      }
      if ((!sections.education || sections.education.length === 0) && fallback.education?.length > 0) {
        sections.education = fallback.education;
      }
      if ((!sections.skills?.technical || sections.skills.technical.length === 0) && fallback.skills?.technical?.length > 0) {
        sections.skills = { ...(sections.skills || {}), technical: fallback.skills.technical };
      }
      if ((!sections.projects || sections.projects.length === 0) && fallback.projects?.length > 0) {
        sections.projects = fallback.projects;
      }
      if ((!sections.certifications || sections.certifications.length === 0) && fallback.certifications?.length > 0) {
        sections.certifications = fallback.certifications;
      }
      if ((!sections.publications || sections.publications.length === 0) && fallback.publications?.length > 0) {
        sections.publications = fallback.publications;
      }
    } catch (error) {
      console.warn('[Resume import] AI extraction unavailable or timed out, seamlessly using deterministic extractor:', error.message);
      const fallback = extractFallbackSections(imported.text);
      sections = validateImportedSections(fallback);
    }

    return res.json({ success: true, data: { sections, source: imported.source } });
  } catch (error) { next(error); }
};
