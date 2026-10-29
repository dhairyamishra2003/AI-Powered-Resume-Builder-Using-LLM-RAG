import * as resumeService from '../services/resume.service.js';
import extractTextFromPdf, { extractFallbackSections } from '../utils/resumeParser.js';
import * as aiService from '../services/ai.service.js';
import { VALID_TEMPLATE_IDS } from '../constants/templates.js';
import { importDocument, mergeImportedSections, validateImportedSections, verifyImportCompleteness } from '../utils/resumeImport.js';
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

    // Bound only the model request; the full PDF remains available to fallback extraction.
    const trimmedText = extractedText.length > 30000
      ? extractedText.slice(0, 30000)
      : extractedText;

    // ── Step 2: AI parsing with automatic resilient heuristic fallback ──
    const fallbackSections = extractFallbackSections(extractedText);
    let rawParsed;
    try {
      const parsePromise = aiService.parseResume({ resumeText: trimmedText });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI parsing timeout (30s)')), 30000)
      );
      rawParsed = mergeImportedSections(await Promise.race([parsePromise, timeoutPromise]), fallbackSections);
    } catch (aiError) {
      console.warn('[Upload] AI parsing encountered an issue or timed out, seamlessly applying heuristic fallback parser:', aiError.message);
      rawParsed = fallbackSections;
    }

    // Completeness verification: compare against detected source headers and recover any gaps
    const verification = verifyImportCompleteness(extractedText, rawParsed, fallbackSections);
    const parsedSections = verification.sections;
    const warnings = verification.warnings;

    // Derive a clean title from the uploaded file's original name
    const rawTitle = req.file.originalname
      ? req.file.originalname.replace(/(\.pdf)+$/i, '').trim()
      : 'Uploaded Resume';
    const title = rawTitle || 'Uploaded Resume';

    // ── Step 3: Save parsed resume to database ────────────────────────────
    const resume = await resumeService.createFromUpload(req.user._id, parsedSections, title);
    return res.status(201).json({ success: true, data: resume, warnings });
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

    let rawSections;
    const fallback = extractFallbackSections(imported.text);
    try {
      const modelText = imported.text.length > 30000 ? imported.text.slice(0, 30000) : imported.text;
      const parsePromise = aiService.parseResumeImport({ resumeText: modelText });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI parsing timeout (30s)')), 30000)
      );
      const parsed = await Promise.race([parsePromise, timeoutPromise]);
      rawSections = mergeImportedSections(parsed, fallback);
    } catch (error) {
      console.warn('[Resume import] AI extraction unavailable or timed out, seamlessly using deterministic extractor:', error.message);
      rawSections = fallback;
    }

    const verification = verifyImportCompleteness(imported.text, rawSections, fallback);
    const sections = validateImportedSections(verification.sections);
    const warnings = verification.warnings;

    return res.json({ success: true, data: { sections, source: imported.source }, warnings });
  } catch (error) { next(error); }
};
