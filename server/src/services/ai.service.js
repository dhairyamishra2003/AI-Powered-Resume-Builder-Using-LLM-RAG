import { generateContent } from '../config/gemini.config.js';
import * as prompts from '../constants/prompts.js';
import { analyzeKeywords, analyzeSkills } from '../utils/keywordAnalyzer.js';
import {
  checkFormatting,
  scoreSummaryStrength,
  scoreBulletQuality,
  scoreSkillCoverage,
  analyzeBulletQuality,
} from '../utils/formatChecker.js';
import { calculateOverallScore } from '../utils/scoreCalculator.js';
import { normalizeSections } from '../utils/sectionNormalizer.js';
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

/**
 * toPlainSections — safely convert Mongoose subdocument to a plain JS object.
 * Mongoose documents have internal state ($__, getters, etc.) that can break
 * Array.isArray() checks and JSON.stringify word counts. A JSON round-trip
 * strips all Mongoose internals and gives us a clean plain object.
 */
const toPlainSections = (sections) => {
  if (!sections) return {};
  try {
    // Mongoose documents expose toJSON(); plain objects are a no-op
    const plain = typeof sections.toJSON === 'function'
      ? sections.toJSON()
      : sections;
    // Full JSON round-trip to strip any remaining proxy/getter behaviour
    return JSON.parse(JSON.stringify(plain));
  } catch {
    return {};
  }
};

/**
 * buildAlgorithmicScores — computes all 10 ATS metric scores deterministically.
 * Returns a flat scores object { keywordMatch: N, bulletQuality: N, ... }
 * and the intermediate results needed to build the full breakdown.
 */
export const buildAlgorithmicScores = (data) => {
  // Always work with a plain JS object — never a Mongoose document
  const sections      = toPlainSections(data.sections);
  const jobDescription = data.jobDescription || '';
  const resumeText    = JSON.stringify(sections);
  const targetRole    = data.targetRole || sections.personalInfo?.targetRole || '';

  const keywordResults = analyzeKeywords(resumeText, jobDescription);
  const skillResults   = analyzeSkills(sections, jobDescription);
  const formatResults  = checkFormatting(sections, jobDescription, targetRole);
  const bqAnalysis     = formatResults.bulletQualityAnalysis || analyzeBulletQuality(sections, jobDescription, targetRole);

  const scores = {
    keywordMatch:        keywordResults.score,
    bulletQuality:       bqAnalysis.bulletQuality,
    formatting:          formatResults.formatting,
    sectionCompleteness: formatResults.sectionCompleteness,
    summaryStrength:     scoreSummaryStrength(sections, jobDescription, targetRole),
    skillCoverage:       scoreSkillCoverage(skillResults),
    quantification:      formatResults.quantification,
    actionVerbs:         formatResults.actionVerbs,
    length:              formatResults.length,
    contactInfo:         formatResults.contactInfo,
  };

  return { scores, keywordResults, skillResults, formatResults, bqAnalysis };
};


/**
 * buildAtsFallbackScore — used when the LLM call fails.
 * Uses only algorithmic scores + static fix strings.
 */
const buildAtsFallbackScore = (data, algoData, errorMessage = '') => {
  const { scores, keywordResults, bqAnalysis } = algoData;

  // Default fix strings (static — always same)
  const DEFAULT_FIXES = {
    keywordMatch:        keywordResults.missing?.length
      ? `Add important job keywords such as: ${keywordResults.missing.slice(0, 6).join(', ')}.`
      : 'Good keyword coverage for this job description.',
    bulletQuality:       bqAnalysis?.suggestions?.[0] || 'Start bullets with strong action verbs and include quantified results (numbers, %, scale).',
    formatting:          'Use standard resume sections, simple headings, and avoid complex graphics for ATS parsing.',
    sectionCompleteness: 'Ensure you have personal info, summary, education, skills, projects, and experience sections.',
    summaryStrength:     'Write a 2-4 sentence summary tailored to the target role with at least one quantified achievement.',
    skillCoverage:       'Mirror the most important tools, technologies, and role-specific skills from the job description.',
    quantification:      'Add numbers, percentages, scale, accuracy, time saved, or project impact to experience bullets.',
    actionVerbs:         'Begin bullets with verbs like built, developed, analyzed, optimized, implemented, or automated.',
    length:              'Keep the resume detailed enough for screening while staying concise and relevant.',
    contactInfo:         'Include name, email, phone, location, and LinkedIn or portfolio link.',
  };

  const breakdown = {};
  for (const [key, score] of Object.entries(scores)) {
    breakdown[key] = { score, fix: DEFAULT_FIXES[key] || '' };
  }

  const overall = calculateOverallScore(scores, true); // verbose=true → logs each metric contribution

  const fallbackSuggestions = [
    ...(bqAnalysis?.suggestions || []),
    'Tailor the resume language to match the job description more closely.',
    'Add measurable impact to project and experience bullets.',
    'Move the most relevant technical skills higher on the resume.',
    ...(errorMessage ? [`AI analysis was unavailable; score computed by built-in ATS analyzer. ${errorMessage}`] : []),
  ];

  return {
    overall,
    metricScores: { ...scores },  // flat copy for frontend verification
    breakdown,
    bulletQuality: scores.bulletQuality,
    bulletQualityDetail: bqAnalysis || null,
    strengths: bqAnalysis?.strengths || [],
    weaknesses: bqAnalysis?.weaknesses || [],
    weakBullets: bqAnalysis?.weakBullets || [],
    missingKeywords: keywordResults.missing || [],
    presentKeywords: keywordResults.matched || [],
    matchedSkills: [],
    missingSkills: [],
    suggestions: [...new Set(fallbackSuggestions)],
    skillGaps: {
      missing: keywordResults.missing || [],
      recommendations: (keywordResults.missing || []).slice(0, 8).map((kw) => `Add "${kw}" if it reflects your real experience.`),
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
  // ── Step 1: Compute all 10 metric scores deterministically ──────────────
  // This runs before (and independently of) the LLM call.
  // Same resume + same JD will always produce the same scores here.
  const algoData = buildAlgorithmicScores(data);
  const { scores, keywordResults, skillResults } = algoData;

  // Scores are fully deterministic. Gemini contributes optional qualitative
  // copy only, so do not put the normal ATS path behind a network request.
  if (process.env.ATS_AI_INSIGHTS !== 'true') {
    return buildAtsFallbackScore(data, algoData);
  }

  // ── Step 2: Call LLM for qualitative data only (fix strings, keywords) ──
  // The LLM does NOT output any numeric scores.
  let parsed;
  try {
    // RAG: Retrieve ATS best practices, industry keywords, and synonyms
    const ragContext = await retrieveAtsContext(data.targetRole, data.jobDescription || '');
    const prompt = prompts.atsScorerPrompt(data, ragContext);
    const result = await generateContent(prompt);
    parsed = parseJsonResponse(result);
  } catch (error) {
    console.error('ATS AI analysis failed, using fallback scorer:', error.message);
    return buildAtsFallbackScore(data, algoData, error.message);
  }

  if (!parsed || parsed.error || !parsed.breakdown) {
    return buildAtsFallbackScore(data, algoData, parsed?.error || 'AI response could not be parsed.');
  }

  // ── Step 3: Build final breakdown — algorithmic scores + LLM fix strings ─
  // LLM fix strings are purely qualitative; numeric scores come only from Step 1.
  const METRIC_KEYS = [
    'keywordMatch', 'bulletQuality', 'formatting', 'sectionCompleteness',
    'summaryStrength', 'skillCoverage', 'quantification', 'actionVerbs', 'length', 'contactInfo',
  ];
  const DEFAULT_FIXES = {
    keywordMatch:        keywordResults.missing?.length
      ? `Add important job keywords such as: ${keywordResults.missing.slice(0, 6).join(', ')}.`
      : 'Good keyword coverage for this job description.',
    bulletQuality:       'Start bullets with strong action verbs and include quantified results (numbers, %, scale).',
    formatting:          'Use standard resume sections, simple headings, and avoid complex graphics for ATS parsing.',
    sectionCompleteness: 'Ensure you have personal info, summary, education, skills, projects, and experience sections.',
    summaryStrength:     'Write a 2-4 sentence summary tailored to the target role with at least one quantified achievement.',
    skillCoverage:       'Mirror the most important tools, technologies, and role-specific skills from the job description.',
    quantification:      'Add numbers, percentages, scale, accuracy, time saved, or project impact to experience bullets.',
    actionVerbs:         'Begin bullets with verbs like built, developed, analyzed, optimized, implemented, or automated.',
    length:              'Keep the resume detailed enough for screening while staying concise and relevant.',
    contactInfo:         'Include name, email, phone, location, and LinkedIn or portfolio link.',
  };

  const breakdown = {};
  for (const key of METRIC_KEYS) {
    const llmEntry = parsed.breakdown?.[key];
    // Use LLM fix string if non-empty; fall back to default.
    let fix = (typeof llmEntry?.fix === 'string' && llmEntry.fix.trim())
      ? llmEntry.fix.trim()
      : (DEFAULT_FIXES[key] || '');

    // For bulletQuality, prioritize the deterministic grounded suggestion based on actual weak bullets
    if (key === 'bulletQuality' && algoData.bqAnalysis?.suggestions?.length > 0) {
      fix = algoData.bqAnalysis.suggestions[0];
    }
    breakdown[key] = { score: scores[key], fix };
  }

  // ── Step 4: Compute overall from algorithmic scores only ─────────────────
  // LLM never influences the final score.
  const overall = calculateOverallScore(scores, true);

  // ── Step 5: Validate LLM skill lists against actual JD content ───────────
  // Any skill the LLM returns that is NOT in the JD skill token set is dropped.
  // This prevents hallucinated suggestions like "Cloud Infrastructure" or
  // "Testing/QA" when they don't appear in the actual job description.
  const jdSkillSet = new Set(skillResults.jdSkillTokens || []);

  const validateSkillList = (llmList) => {
    if (!Array.isArray(llmList) || llmList.length === 0) return [];
    return llmList.filter((s) => {
      if (typeof s !== 'string') return false;
      const normalised = s.toLowerCase().trim();
      // Accept if ANY JD skill token appears in the skill string or vice versa
      for (const jdToken of jdSkillSet) {
        if (normalised.includes(jdToken) || jdToken.includes(normalised)) return true;
      }
      return false;
    });
  };

  // Prefer algorithmic results for skill display — they are JD-grounded.
  // LLM results are used to supplement only if they pass validation.
  const algorithmicMatchedSkills = skillResults.matched || [];
  const algorithmicMissingSkills = skillResults.missing || [];
  const llmMatchedValidated = validateSkillList(parsed.matchedSkills);
  const llmMissingValidated  = validateSkillList(parsed.missingSkills);

  const finalMatchedSkills = [...new Set([...algorithmicMatchedSkills, ...llmMatchedValidated])].slice(0, 20);
  const finalMissingSkills  = [...new Set([...algorithmicMissingSkills,  ...llmMissingValidated])].slice(0, 15);

  return {
    overall,
    metricScores: { ...scores },
    breakdown,
    bulletQuality: scores.bulletQuality,
    bulletQualityDetail: algoData.bqAnalysis || null,
    strengths: algoData.bqAnalysis?.strengths || [],
    weaknesses: algoData.bqAnalysis?.weaknesses || [],
    weakBullets: algoData.bqAnalysis?.weakBullets || [],
    // Keywords & skills
    presentKeywords: [...new Set([
      ...(keywordResults.matched || []),
      ...(parsed.matchedKeywords || []),
    ])].slice(0, 20),
    missingKeywords: [...new Set([
      ...(keywordResults.missing || []),
      ...(parsed.missingKeywords || []),
    ])].slice(0, 15),
    matchedSkills:  finalMatchedSkills,
    missingSkills:  finalMissingSkills,
    // Skill coverage debug info (visible in response for transparency)
    skillCoverageDetail: {
      jdSkillTokens:  skillResults.jdSkillTokens || [],
      matched:        algorithmicMatchedSkills,
      missing:        algorithmicMissingSkills,
      score:          scores.skillCoverage,
      total:          (skillResults.jdSkillTokens || []).length,
    },
    suggestions: [
      ...(algoData.bqAnalysis?.suggestions || []),
      ...(parsed.suggestions || [
        'Tailor the resume language to match the job description more closely.',
        'Add measurable impact to project and experience bullets.',
        'Move the most relevant technical skills higher on the resume.',
      ]),
    ].filter((v, i, a) => a.indexOf(v) === i),
    skillGaps: {
      missing: finalMissingSkills,
      recommendations: finalMissingSkills
        .slice(0, 8)
        .map((kw) => `Add "${kw}" to your skills section if it reflects your real experience.`),
    },
    source: 'deterministic',
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
  const parsed = parseJsonResponse(result) || {};
  return normalizeSections(parsed);
};

// Import uses the raw response so the route can validate it with Zod before
// normalization or insertion into application state.
export const parseResumeImport = async (data) => {
  const prompt = prompts.resumeParserPrompt(data.resumeText || '');
  const result = await generateContent(prompt);
  const parsed = parseJsonResponse(result) || {};
  if (parsed.error) throw new Error(parsed.error);
  return parsed;
};
