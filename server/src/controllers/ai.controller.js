import crypto from 'crypto';
import * as aiService from '../services/ai.service.js';
import ChatHistory from '../models/ChatHistory.model.js';
import Resume from '../models/Resume.model.js';
import { cacheAtsScore, getCachedAtsScore, makeAtsCacheKey } from '../services/ats-cache.service.js';

export const chat = async (req, res, next) => {
  try {
    const { resumeId, message, sectionTargeted } = req.body;

    if (!resumeId || !message) {
      return res.status(400).json({ success: false, message: 'resumeId and message are required.' });
    }

    if (typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'message must be a non-empty string.' });
    }

    let chatHistory = await ChatHistory.findOne({
      resumeId,
      userId: req.user._id,
      agentType: 'interview',
    });

    if (!chatHistory) {
      chatHistory = await ChatHistory.create({
        resumeId,
        userId: req.user._id,
        agentType: 'interview',
        messages: [],
        metadata: { sectionTargeted: sectionTargeted || '' },
      });
    }

    const resume = await Resume.findById(resumeId);

    // Pass the last 10 saved messages as history context.
    // The current user message is NOT yet in chatHistory.messages —
    // we pass it separately so the agent service adds it exactly once.
    const result = await aiService.chatWithInterviewAgent({
      message: message.trim(),
      conversationHistory: chatHistory.messages.slice(-10),
      currentSections: resume?.sections || {},
      sectionTargeted: sectionTargeted || '',
      targetRole: resume?.targetRole || '',
      resumeId,
      jobDescription: resume?.jobDescription || '',
    });

    // Save both messages to DB after successful response
    chatHistory.messages.push({ role: 'user', content: message.trim() });
    chatHistory.messages.push({ role: 'assistant', content: result.message });
    await chatHistory.save();

    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const generateBullets = async (req, res, next) => {
  try {
    const { resumeId, rawExperience, role, company } = req.body;

    if (!rawExperience) {
      return res.status(400).json({ success: false, message: 'rawExperience is required.' });
    }

    const resume = resumeId ? await Resume.findById(resumeId) : null;

    const result = await aiService.generateBullets({
      rawExperience,
      role: role || '',
      company: company || '',
      targetRole: resume?.targetRole || '',
      jobDescription: resume?.jobDescription || '',
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const generateSummary = async (req, res, next) => {
  try {
    const { resumeId } = req.body;

    if (!resumeId) {
      return res.status(400).json({ success: false, message: 'resumeId is required.' });
    }

    const resume = await Resume.findOne({ _id: resumeId, userId: req.user._id });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found.' });
    }

    const result = await aiService.generateSummary({
      sections: resume.sections,
      targetRole: resume.targetRole,
      jobDescription: resume.jobDescription,
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const atsScore = async (req, res, next) => {
  try {
    const startedAt = performance.now();
    const { resumeId, jobDescription, sections, targetRole } = req.body;

    if (!resumeId) {
      return res.status(400).json({ success: false, message: 'resumeId is required.' });
    }

    const resume = await Resume.findOne({ _id: resumeId, userId: req.user._id });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found.' });
    }

    if (jobDescription) {
      resume.jobDescription = jobDescription;
    }
    if (sections && typeof sections === 'object') {
      resume.sections = sections;
    }
    if (targetRole) {
      resume.targetRole = targetRole;
    }

    const activeSections = sections || resume.sections;
    const activeJd = jobDescription || resume.jobDescription || '';
    const activeRole = targetRole || resume.targetRole || '';

    const jdHash = crypto.createHash('md5').update(activeJd).digest('hex').slice(0, 8);
    const resumeTextStr = JSON.stringify(activeSections || {});

    const cacheKey = makeAtsCacheKey({ sections: activeSections, jobDescription: activeJd, targetRole: activeRole });
    let result = getCachedAtsScore(cacheKey);
    const cacheHit = Boolean(result);
    const scoringStartedAt = performance.now();
    if (!result) {
      result = await aiService.getAtsScore({ sections: activeSections, jobDescription: activeJd, targetRole: activeRole });
      cacheAtsScore(cacheKey, result);
    }

    if (process.env.NODE_ENV !== 'production') {
      console.info(`[ATS] resume=${resume._id} jd=${jdHash} cache=${cacheHit ? 'hit' : 'miss'} scoring=${(performance.now() - scoringStartedAt).toFixed(1)}ms`);
    }

    const numericBreakdown = {};
    if (result.breakdown) {
      for (const [key, val] of Object.entries(result.breakdown)) {
        numericBreakdown[key] = typeof val === 'object' ? (val.score || 0) : (val || 0);
      }
    }

    resume.atsScore = {
      overall: result.overall || 0,
      breakdown: numericBreakdown,
      missingKeywords: result.missingKeywords || [],
      suggestions: result.suggestions || [],
    };
    await resume.save();

    if (process.env.NODE_ENV !== 'production') {
      console.info(`[ATS] total=${(performance.now() - startedAt).toFixed(1)}ms database+save included`);
    }

    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const review = async (req, res, next) => {
  try {
    const { resumeId } = req.body;

    if (!resumeId) {
      return res.status(400).json({ success: false, message: 'resumeId is required.' });
    }

    const resume = await Resume.findOne({ _id: resumeId, userId: req.user._id });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found.' });
    }

    const result = await aiService.reviewResume({
      sections: resume.sections,
      targetRole: resume.targetRole,
      jobDescription: resume.jobDescription,
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const matchJob = async (req, res, next) => {
  try {
    const { resumeId, jobDescription } = req.body;

    if (!resumeId || !jobDescription) {
      return res.status(400).json({ success: false, message: 'resumeId and jobDescription are required.' });
    }

    const resume = await Resume.findOne({ _id: resumeId, userId: req.user._id });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found.' });
    }

    resume.jobDescription = jobDescription;
    await resume.save();

    const result = await aiService.matchJob({
      sections: resume.sections,
      jobDescription,
      targetRole: resume.targetRole,
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const skillGaps = async (req, res, next) => {
  try {
    const { resumeId, jobDescription } = req.body;

    if (!resumeId) {
      return res.status(400).json({ success: false, message: 'resumeId is required.' });
    }

    const resume = await Resume.findOne({ _id: resumeId, userId: req.user._id });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found.' });
    }

    const result = await aiService.detectSkillGaps({
      skills: resume.sections.skills,
      jobDescription: jobDescription || resume.jobDescription,
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getChatHistory = async (req, res, next) => {
  try {
    const { resumeId } = req.params;

    const histories = await ChatHistory.find({
      resumeId,
      userId: req.user._id,
    }).sort({ updatedAt: -1 });

    return res.json({ success: true, data: histories });
  } catch (error) {
    next(error);
  }
};
