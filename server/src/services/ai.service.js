import { generateContent } from '../config/gemini.config.js';
import * as prompts from '../constants/prompts.js';
import { analyzeKeywords } from '../utils/keywordAnalyzer.js';
import { checkFormatting } from '../utils/formatChecker.js';
import { calculateOverallScore } from '../utils/scoreCalculator.js';
import { runInterviewAgent } from './agent.service.js';
import {
  retrieveBulletContext,
  retrieveAtsContext,
  retrieveSummaryContext,
  retrieveReviewContext,
  retrieveJobMatchContext,
  retrieveSkillGapContext,
} from './rag.service.js';

const parseJsonResponse = (text) => {
  try { return JSON.parse(text); } catch (e) { /* continue */ }

  let jsonStr = null;
  if (text.includes('```json')) {
    const start = text.indexOf('```json') + 7;
    const end = text.indexOf('```', start);
    if (end > start) jsonStr = text.slice(start, end).trim();
  } else if (text.includes('```')) {
    const start = text.indexOf('```') + 3;
    const end = text.indexOf('```', start);
    if (end > start) jsonStr = text.slice(start, end).trim();
  } else if (text.includes('{')) {
    const start = text.indexOf('{');
    let depth = 0;
    for (let i = start; i < text.length; i++) {
      if (text[i] === '{') depth++;
      else if (text[i] === '}') { depth--; if (depth === 0) { jsonStr = text.slice(start, i + 1); break; } }
    }
  }

  if (jsonStr) {
    try { return JSON.parse(jsonStr); } catch (e) { /* continue */ }
  }

  return { error: 'Failed to parse AI response', raw: text };
};

const buildAtsFallbackScore = (data, algorithmicResults, errorMessage = '') => {
  const sections = data.sections || {};
  const skills = sections.skills || {};
  const technicalSkills = Array.isArray(skills)
    ? skills
    : [...(skills.technical || []), ...(skills.soft || [])];
  const keywordResults = algorithmicResults.keywordMatch || { score: 0, matched: [], missing: [] };
  const hasSummary = Boolean((sections.summary || '').trim());
  const hasBullets = [
    ...(sections.experience || []).flatMap((item) => item.bullets || []),
    ...(sections.projects || []).flatMap((item) => item.bullets || []),
  ].length > 0;

  const breakdown = {
    keywordMatch: {
      score: keywordResults.score || 0,
      fix: keywordResults.missing?.length
        ? `Add important job keywords such as ${keywordResults.missing.slice(0, 6).join(', ')}.`
        : 'Good keyword coverage for this job description.',
    },
    bulletQuality: {
      score: hasBullets ? Math.round(((algorithmicResults.actionVerbs || 0) + (algorithmicResults.quantification || 0)) / 2) : 0,
      fix: 'Start bullets with action verbs and include measurable outcomes where possible.',
    },
    formatting: {
      score: algorithmicResults.formatting || 0,
      fix: 'Use standard resume sections, simple headings, and avoid complex graphics for ATS parsing.',
    },
    sectionCompleteness: {
      score: algorithmicResults.sectionCompleteness || 0,
      fix: 'Complete personal info, summary, education, skills, projects, and relevant experience sections.',
    },
    summaryStrength: {
      score: hasSummary ? 75 : 0,
      fix: hasSummary
        ? 'Make the summary more specific to the target role and job description.'
        : 'Add a short 2-3 line professional summary tailored to the job.',
    },
    skillCoverage: {
      score: technicalSkills.length > 0 ? Math.max(keywordResults.score || 0, 55) : 0,
      fix: 'Mirror the most important tools, technologies, and role-specific skills from the job description.',
    },
    quantification: {
      score: algorithmicResults.quantification || 0,
      fix: 'Add numbers, percentages, scale, accuracy, time saved, or project impact to bullets.',
    },
    actionVerbs: {
      score: algorithmicResults.actionVerbs || 0,
      fix: 'Begin bullets with verbs like built, developed, analyzed, optimized, implemented, or automated.',
    },
    length: {
      score: algorithmicResults.length || 0,
      fix: 'Keep the resume detailed enough for screening while staying concise and relevant.',
    },
    contactInfo: {
      score: algorithmicResults.contactInfo || 0,
      fix: 'Include name, email, phone, location, and LinkedIn or portfolio link.',
    },
  };

  const scores = {};
  for (const [key, value] of Object.entries(breakdown)) {
    scores[key] = value.score;
  }

  return {
    overall: calculateOverallScore(scores),
    breakdown,
    missingKeywords: keywordResults.missing || [],
    presentKeywords: keywordResults.matched || [],
    suggestions: [
      'Tailor the resume language to match the job description more closely.',
      'Add measurable impact to project and experience bullets.',
      'Move the most relevant technical skills higher on the resume.',
      ...(errorMessage ? [`AI analysis was unavailable, so this score used the built-in ATS analyzer. ${errorMessage}`] : []),
    ],
    skillGaps: {
      missing: keywordResults.missing || [],
      recommendations: (keywordResults.missing || []).slice(0, 8).map((keyword) => `Add ${keyword} if it reflects your real experience.`),
    },
    source: errorMessage ? 'fallback' : 'algorithmic',
  };
};

// Interview Agent — uses Gemini function calling for autonomous tool use
export const chatWithInterviewAgent = async (data) => {
  return runInterviewAgent(data);
};

export const generateBullets = async (data) => {
  // RAG: Retrieve similar resume bullets and action verbs from knowledge base
  const ragContext = await retrieveBulletContext(
    data.role, data.rawExperience, data.targetRole
  );
  const prompt = prompts.bulletWriterPrompt(data, ragContext);
  const result = await generateContent(prompt);
  return parseJsonResponse(result);
};

export const generateSummary = async (data) => {
  // RAG: Retrieve role-specific summary examples and keywords
  const ragContext = await retrieveSummaryContext(data.targetRole);
  const prompt = prompts.summaryWriterPrompt(data, ragContext);
  const result = await generateContent(prompt);
  return parseJsonResponse(result);
};

export const getAtsScore = async (data) => {
  const sections = data.sections || {};
  const jobDescription = data.jobDescription || '';

  const resumeText = JSON.stringify(sections);
  const keywordResults = analyzeKeywords(resumeText, jobDescription);
  const formatResults = checkFormatting(sections);

  const algorithmicResults = {
    keywordMatch: keywordResults,
    formatting: formatResults.formatting || 0,
    sectionCompleteness: formatResults.sectionCompleteness || 0,
    quantification: formatResults.quantification || 0,
    actionVerbs: formatResults.actionVerbs || 0,
    length: formatResults.length || 0,
    contactInfo: formatResults.contactInfo || 0,
  };

  let parsed;
  try {
    // RAG: Retrieve ATS best practices, industry keywords, and synonyms
    const ragContext = await retrieveAtsContext(data.targetRole, jobDescription);
    const prompt = prompts.atsScorerPrompt({ ...data, algorithmicResults }, ragContext);
    const result = await generateContent(prompt);
    parsed = parseJsonResponse(result);
  } catch (error) {
    console.error('ATS AI analysis failed, using fallback scorer:', error.message);
    return buildAtsFallbackScore(data, algorithmicResults, error.message);
  }

  if (!parsed.breakdown) {
    return buildAtsFallbackScore(data, algorithmicResults, parsed.error || 'AI response could not be parsed.');
  }

  if (parsed.breakdown) {
    const breakdown = parsed.breakdown;
    for (const metric of ['keywordMatch', 'formatting', 'sectionCompleteness', 'quantification', 'actionVerbs', 'length', 'contactInfo']) {
      const algoScore = metric === 'keywordMatch'
        ? (typeof algorithmicResults[metric] === 'object' ? algorithmicResults[metric].score : algorithmicResults[metric])
        : algorithmicResults[metric];
      if (typeof algoScore === 'number' && breakdown[metric] && typeof breakdown[metric] === 'object') {
        const aiScore = breakdown[metric].score || algoScore;
        breakdown[metric].score = Math.round((algoScore + aiScore) / 2);
      }
    }
    const scores = {};
    for (const [key, val] of Object.entries(breakdown)) {
      scores[key] = typeof val === 'object' ? (val.score || 0) : val;
    }
    parsed.overall = calculateOverallScore(scores);
  }

  return {
    presentKeywords: keywordResults.matched || [],
    missingKeywords: keywordResults.missing || [],
    ...parsed,
  };
};

export const reviewResume = async (data) => {
  // RAG: Retrieve review criteria and high-quality bullet examples for comparison
  const ragContext = await retrieveReviewContext(data.targetRole);
  const prompt = prompts.reviewerPrompt(data, ragContext);
  const result = await generateContent(prompt);
  return parseJsonResponse(result);
};

export const matchJob = async (data) => {
  // RAG: Retrieve industry keywords, synonyms, and skill taxonomies
  const ragContext = await retrieveJobMatchContext(data.targetRole, data.jobDescription);
  const prompt = prompts.matchJobPrompt(data, ragContext);
  const result = await generateContent(prompt);
  return parseJsonResponse(result);
};

export const detectSkillGaps = async (data) => {
  // RAG: Retrieve skill taxonomies and industry-standard keywords
  const ragContext = await retrieveSkillGapContext(data.targetRole, data.jobDescription);
  const prompt = prompts.skillGapsPrompt(data, ragContext);
  const result = await generateContent(prompt);
  return parseJsonResponse(result);
};

export const parseResume = async (data) => {
  const prompt = prompts.resumeParserPrompt(data.resumeText || '');
  const result = await generateContent(prompt);
  return parseJsonResponse(result);
};
