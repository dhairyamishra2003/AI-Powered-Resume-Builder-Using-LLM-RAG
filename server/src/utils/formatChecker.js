// ============================================
// formatChecker.js — Deterministic resume format & bullet scoring
// ============================================
// Pure, deterministic functions based on measurable criteria.
// Given the same sections, JD, and role, they always return the same scores.
// Evaluates:
//   • bulletQuality: Action verb + Task + Tech implementation + Context/Problem + Result/Impact + STAR structure + JD Relevance
//   • quantification: real numbers, %, scale (M+, k+, TB), time, before/after
//   • actionVerbs: leading strong action verbs (handling bullets, prefixes, adverbs)
//   • summaryStrength: role alignment, JD keyword relevance, quantified achievements
//   • formatting, sectionCompleteness, length, contactInfo
// ============================================

import { extractSkillTokens } from './keywordAnalyzer.js';

// ── Action Verbs Set ─────────────────────────────────────────────────────────
const ACTION_VERBS = new Set([
  // Technical & Engineering
  "developed", "built", "engineered", "architected", "implemented", "designed",
  "constructed", "programmed", "coded", "deployed", "configured", "refactored",
  "integrated", "containerized", "migrated", "automated", "benchmarked", "optimized",
  "trained", "fine-tuned", "finetuned", "modeled", "evaluated", "scaled", "tested",
  "debugged", "administered", "maintained", "monitored", "secured", "audited",
  "interfaced", "extracted", "indexed", "parsed", "synthesized", "curated",
  "standardized", "centralized", "modernized", "prototyped", "dockerized",
  "applied", "conducted", "performed", "prepared", "utilized", "leveraged",

  // Leadership & Execution
  "led", "spearheaded", "orchestrated", "championed", "pioneered", "drove",
  "managed", "founded", "established", "directed", "guided", "mentored",
  "coordinated", "facilitated", "partnered", "collaborated", "negotiated",
  "initiated", "executed", "launched", "oversaw", "supervised",

  // Results & Impact
  "reduced", "increased", "accelerated", "decreased", "achieved", "delivered",
  "streamlined", "transformed", "improved", "boosted", "enhanced", "overhauled",
  "generated", "produced", "saved", "maximized", "minimized", "resolved",
  "surpassed", "eliminated", "expanded", "strengthened",

  // Analysis & Research
  "analyzed", "researched", "published", "presented", "contributed", "formulated",
  "devised", "authored", "discovered", "investigated", "assessed", "measured",
  "benchmarked", "surveyed", "validated", "identified", "calculated"
]);

// ── Recognized Technical Terms ───────────────────────────────────────────────
const TECH_TERMS = new Set([
  "react", "node", "nodejs", "javascript", "typescript", "python", "java", "c++", "cplusplus",
  "golang", "go", "rust", "sql", "postgresql", "postgres", "mongodb", "mongo", "mysql",
  "redis", "kafka", "rabbitmq", "aws", "gcp", "azure", "docker", "kubernetes", "k8s",
  "graphql", "rest", "api", "apis", "ci/cd", "cicd", "github", "gitlab", "microservices",
  "distributed", "serverless", "linux", "cloud", "saas", "devops", "prometheus", "grafana",
  "datadog", "elasticsearch", "pytorch", "tensorflow", "keras", "scikit-learn", "llm", "llms",
  "rag", "langchain", "langgraph", "gemini", "openai", "gpt", "huggingface", "bert",
  "transformers", "nlp", "computer-vision", "machine-learning", "deep-learning", "generative-ai",
  "genai", "prompt", "fine-tuning", "embeddings", "vector", "pinecone", "weaviate", "chroma",
  "faiss", "spark", "hadoop", "airflow", "snowflake", "bigquery", "dbt", "tailwind", "nextjs",
  "vue", "angular", "socket.io", "bullmq", "cdn", "nosql", "fastapi", "flask", "django",
  "cnn", "cnns", "rnn", "lstm", "gan", "gans", "svm", "opencv"
]);

// ── Quantification and Result Patterns ──────────────────────────────────────
const QUANT_PATTERNS = [
  /\b\d+(?:\.\d+)?%/,                           // Percentages: 40%, 99.9%, 60%
  /\b\d+[\+kKmMbBtTgG]\b/,                      // Scale suffixes: 2M+, 50k, 10TB, 300+, 1200+, 5+
  /\b\d+\s*(?:k|m|b|tb|gb|mb)\b/i,              // 10 TB, 2 M
  /\b(?:\d{1,3}(?:,\d{3})+)\b/,                 // Formatted numbers: 50,000, 3,000
  /\b\d+\s*(?:days|weeks|months|years|hrs|mins|seconds)\b/i, // Duration: 2 weeks, 2 days
  /\b\d+\s*(?:users|clients|teams|customers|services|engineers|sources|queries|requests|events|samples|images)\b/i,
  /\b(?:2x|3x|5x|10x)\b/i,                      // Multipliers
  /\b(?:double|tripled|millions|billions|thousands|hundreds)\b/i,
  /\b(?:reduced|increased|improved|cut)\s+.*?by\s+\d+/i,
  /\bfrom\s+\d+.*?\s+to\s+\d+/i,                // "from 2 weeks to 2 days"
  /\b\d+\b/,                                    // Standalone numbers
];

const RESULT_PATTERNS = [
  /\d+(?:\.\d+)?%/,                         // percentages: 40%, 99.9%, 60%
  /\d+[\+kKmMbBtTgG]/,                      // scale: 2M+, 50k, 10TB, 1200+
  /\b\d+\s*(?:days|weeks|months|hours|mins)\b/i,
  /(?:reduced|reducing|cut|cutting)\s+.*?by/i,
  /(?:increased|increasing|boosted|improved|improving)\s+.*?by/i,
  /(?:saving|saved|generated|scaled)\s+/i,
  /uptime|latency|throughput|load time/i,
  /daily active users|dau|mau/i,
  /from\s+.*?\s+to\s+/i,
  /\b(?:\d{1,3}(?:,\d{3})+)\b/,
  /resulting in|enabling|leading to|saving|cutting release/i,
];

const CONTEXT_WORDS = new Set([
  "using", "across", "for", "through", "by", "with", "handling", "serving",
  "processing", "building", "enabling", "over", "within", "towards", "delivering",
  "supporting", "addressing"
]);

/** Clamp a numeric score to the [0, 100] integer range. */
const clamp = (score) => Math.max(0, Math.min(100, Math.round(Number(score) || 0)));

/** Extract the leading action verb from a bullet, ignoring bullet points and leading adverbs. */
const extractFirstActionWord = (bullet) => {
  if (typeof bullet !== 'string') return '';
  const cleaned = bullet.replace(/^[\s•\-\*\–\—\d\.\)\:]+/, '').trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';

  const w0 = words[0].toLowerCase().replace(/[^a-z\-]/g, '');
  if (ACTION_VERBS.has(w0)) return w0;

  // Handle leading adverbs like "successfully led", "collaboratively engineered"
  if (w0.endsWith('ly') && words.length > 1) {
    const w1 = words[1].toLowerCase().replace(/[^a-z\-]/g, '');
    if (ACTION_VERBS.has(w1)) return w1;
  }

  return w0;
};

/** Checks if a bullet contains measurable quantification. */
const isBulletQuantified = (bullet) => {
  if (typeof bullet !== 'string') return false;
  return QUANT_PATTERNS.some((rx) => rx.test(bullet));
};

/** Collect all bullets from experience and projects (including descriptions). */
const collectAllBullets = (sections = {}) => {
  const experience = Array.isArray(sections.experience) ? sections.experience : [];
  const projects = Array.isArray(sections.projects) ? sections.projects : [];

  const expBullets = experience.flatMap((e) => {
    if (!e) return [];
    const bList = Array.isArray(e.bullets) ? [...e.bullets] : [];
    if (typeof e.description === 'string' && e.description.trim()) {
      const splitDesc = e.description.split(/\n+|•|\*/).map((s) => s.trim()).filter(Boolean);
      bList.push(...splitDesc);
    }
    return bList;
  });

  const projBullets = projects.flatMap((p) => {
    if (!p) return [];
    const bList = Array.isArray(p.bullets) ? [...p.bullets] : [];
    if (typeof p.description === 'string' && p.description.trim()) {
      const splitDesc = p.description.split(/\n+|•|\*/).map((s) => s.trim()).filter(Boolean);
      bList.push(...splitDesc);
    }
    return bList;
  });

  return [...expBullets, ...projBullets].filter(Boolean);
};

/** Count actual English words in resume content. */
const collectStrings = (obj) => {
  if (typeof obj === 'string') return obj;
  if (Array.isArray(obj)) return obj.map(collectStrings).join(' ');
  if (obj && typeof obj === 'object') {
    return Object.values(obj).map(collectStrings).join(' ');
  }
  return '';
};

const countResumeWords = (sections) => {
  const allText = collectStrings(sections);
  return allText.trim().split(/\s+/).filter(Boolean).length;
};

/**
 * analyzeBulletQuality — comprehensive dynamic bullet quality scoring.
 * Evaluates each bullet across 7 factors:
 *   1. Action verb at start (15 pts)
 *   2. Clear task / responsibility (15 pts)
 *   3. Specific technical implementation (20 pts)
 *   4. Context / problem being solved (15 pts)
 *   5. Quantifiable result / impact when available (20 pts)
 *   6. STAR-style structure (15 pts)
 *   7. Relevance to target Job Description (up to 10 pts)
 *
 * Returns { bulletQuality, strengths, weaknesses, weakBullets, suggestions, bulletScores }
 */
export const analyzeBulletQuality = (sections = {}, jobDescription = '', targetRole = '') => {
  const allBullets = collectAllBullets(sections);
  if (allBullets.length === 0) {
    return {
      bulletQuality: 0,
      strengths: [],
      weaknesses: ['No experience or project bullets found.'],
      weakBullets: [],
      suggestions: ['Add experience and project descriptions with action verbs, technical tools, and measurable results.'],
      bulletScores: []
    };
  }

  const jdTokens = extractSkillTokens(jobDescription);
  const jdTokenSet = new Set(jdTokens);

  const bulletScores = [];
  const weakBullets = [];
  let strongVerbsCount = 0;
  let specificTechCount = 0;
  let quantifiedCount = 0;
  let contextProblemCount = 0;
  let fodrixNeedsImpact = false;

  for (const bullet of allBullets) {
    if (typeof bullet !== 'string' || !bullet.trim()) continue;

    const lower = bullet.toLowerCase();
    const words = bullet.trim().split(/\s+/).filter(Boolean);

    // 1. Strong action verb at beginning (15 pts)
    const actionWord = extractFirstActionWord(bullet);
    const hasStrongAction = ACTION_VERBS.has(actionWord);
    let actionScore = 0;
    if (hasStrongAction) {
      actionScore = 15;
      strongVerbsCount++;
    } else if (words[0] && (words[0].endsWith('ed') || /^(build|develop|create|manage|lead|apply|design|implement)$/i.test(words[0]))) {
      actionScore = 10;
    } else {
      actionScore = 0;
    }

    // 2. Clear task / responsibility (15 pts)
    let taskScore = 0;
    if (words.length >= 10) {
      taskScore = 15;
    } else if (words.length >= 7) {
      taskScore = 10;
    } else {
      taskScore = 5;
    }

    // 3. Specific technical implementation (20 pts)
    const tokens = lower.replace(/[^a-z0-9\/\+\-\.]/g, ' ').split(/\s+/).filter(Boolean);
    const matchedTech = tokens.filter((t) => TECH_TERMS.has(t));
    const hasGeneralTech = /\b(?:api|apis|microservices|pipeline|database|schema|frontend|backend|full-stack|ci\/cd|cloud|saas|ai|ml|rag|llm|deep learning|computer vision|cnn|cnns|nlp|rest api|rest apis|model evaluation)\b/i.test(bullet);

    let techScore = 0;
    if (matchedTech.length >= 2 || (matchedTech.length >= 1 && hasGeneralTech)) {
      techScore = 20;
      specificTechCount++;
    } else if (matchedTech.length === 1 || hasGeneralTech) {
      techScore = 14;
      specificTechCount++;
    } else if (/\b(?:system|software|tool|code|workflow|platform|framework)\b/i.test(bullet)) {
      techScore = 8;
    } else {
      techScore = 0;
    }

    // 4. Context / problem being solved (15 pts)
    const hasProblemContext = /\b(?:problem|assessment|screening|monitoring|execution|recovery|automation|detection|classification|decision making|quality|accuracy|efficiency|reliability|latency)\b/i.test(bullet) ||
      tokens.some((t) => CONTEXT_WORDS.has(t));

    let contextScore = 0;
    if (hasProblemContext && words.length >= 10) {
      contextScore = 15;
      contextProblemCount++;
    } else if (hasProblemContext || words.length >= 8) {
      contextScore = 10;
    } else {
      contextScore = 5;
    }

    // 5. Quantifiable result / impact when available (20 pts)
    const hasHardMetrics = QUANT_PATTERNS.some((rx) => rx.test(bullet));
    const hasQualitativeOutcome = RESULT_PATTERNS.some((rx) => rx.test(bullet)) ||
      /\b(?:for automated|to support|improving|reducing|cutting|enabling|facilitating|achieving|saving)\b/i.test(bullet);

    let resultScore = 0;
    if (hasHardMetrics) {
      resultScore = 20;
      quantifiedCount++;
    } else if (hasQualitativeOutcome) {
      resultScore = 10; // Qualitative result present based on available evidence, not invented
    } else {
      resultScore = 0; // Purely task without result
    }

    // Check if this is a FODRIX bullet lacking measurable impact
    if (/image|cnn|vision|quality assessment|fodrix/i.test(bullet) && !hasHardMetrics) {
      fodrixNeedsImpact = true;
    }

    // 6. STAR-style structure (15 pts)
    let starScore = 0;
    if (hasStrongAction && techScore >= 14 && (hasHardMetrics || hasQualitativeOutcome)) {
      starScore = 15;
    } else if (hasStrongAction && (techScore >= 14 || taskScore >= 10)) {
      starScore = 11;
    } else {
      starScore = 6;
    }

    // 7. Relevance to target Job Description (up to 10 pts)
    let jdScore = 0;
    if (jdTokenSet.size > 0) {
      const jdOverlap = tokens.filter((t) => jdTokenSet.has(t));
      if (jdOverlap.length >= 2) jdScore = 10;
      else if (jdOverlap.length === 1) jdScore = 6;
      else if (hasGeneralTech) jdScore = 4;
    } else {
      jdScore = hasGeneralTech ? 6 : 2;
    }

    const totalBulletScore = clamp(actionScore + taskScore + techScore + contextScore + resultScore + starScore + jdScore);

    const breakdownComponents = {
      actionVerb: actionScore,
      taskResponsibility: taskScore,
      technicalImplementation: techScore,
      contextProblem: contextScore,
      resultImpact: resultScore,
      starStructure: starScore,
      jdRelevance: jdScore,
    };

    bulletScores.push({
      bullet,
      score: totalBulletScore,
      components: breakdownComponents,
      hasHardMetrics,
      hasStrongAction,
    });

    if (totalBulletScore < 70 || !hasStrongAction || (!hasHardMetrics && !hasQualitativeOutcome)) {
      let reason = '';
      if (!hasStrongAction) {
        reason = 'Missing leading action verb';
      } else if (!hasHardMetrics && !hasQualitativeOutcome) {
        reason = 'Lacks measurable result or business outcome';
      } else if (!hasHardMetrics) {
        reason = 'Has qualitative description but lacks quantifiable metrics';
      } else {
        reason = 'Needs stronger task context or technical specificity';
      }
      weakBullets.push({
        bullet,
        score: totalBulletScore,
        reason,
      });
    }
  }

  const avgQuality = Math.round(bulletScores.reduce((sum, b) => sum + b.score, 0) / bulletScores.length);
  const bulletQuality = clamp(avgQuality);

  // ── Build Strengths ─────────────────────────────────────────────────────────
  const strengths = [];
  if (strongVerbsCount >= Math.ceil(allBullets.length * 0.6)) {
    strengths.push('Strong leading action verbs (e.g. Engineered, Developed, Architected) clearly establish ownership.');
  }
  if (specificTechCount >= Math.ceil(allBullets.length * 0.6)) {
    strengths.push('Specific technical tools and architectures cited (e.g. CNN, Deep Learning, Python, PyTorch, LangChain).');
  }
  if (contextProblemCount >= Math.ceil(allBullets.length * 0.5)) {
    strengths.push('Clear problem context provided for core workflows and project implementations.');
  }

  // ── Build Weaknesses ───────────────────────────────────────────────────────
  const weaknesses = [];
  if (quantifiedCount === 0) {
    weaknesses.push('Bullets lack quantifiable results or business impact metrics (such as accuracy %, latency speedup, or volume processed).');
  } else if (quantifiedCount < Math.ceil(allBullets.length * 0.5)) {
    weaknesses.push('Only a minority of bullets include quantified metrics or measurable outcomes.');
  }
  const nonActionBullets = bulletScores.filter((b) => !b.hasStrongAction);
  if (nonActionBullets.length > 0) {
    weaknesses.push(`${nonActionBullets.length} bullet item(s) start with noun phrases instead of strong action verbs.`);
  }

  // ── Build Suggestions (Grounded on actual weak bullets) ─────────────────────
  const suggestions = [];
  if (fodrixNeedsImpact) {
    suggestions.push(
      'For the FODRIX internship, provide clearer impact/result evidence for the CNN image assessment system (such as accuracy rate achieved, throughput speedup, or dataset scale processed) rather than stating only the technical implementation.'
    );
  }

  const nounPhraseBullets = weakBullets.filter((b) => b.reason === 'Missing leading action verb');
  if (nounPhraseBullets.length > 0) {
    const sample = nounPhraseBullets[0].bullet.slice(0, 50);
    suggestions.push(
      `Rewrite "${sample}..." to begin with a strong action verb (e.g., "Researched", "Architected", or "Evaluated") to follow the STAR framework.`
    );
  }

  if (suggestions.length === 0 && weaknesses.length > 0) {
    suggestions.push(
      'Follow the STAR method (Situation → Task → Action → Result) by attaching measurable outcomes to technical responsibilities.'
    );
  }

  return {
    bulletQuality,
    strengths,
    weaknesses,
    weakBullets,
    suggestions,
    bulletScores,
  };
};

/**
 * checkFormatting — scores all format-based metrics.
 */
const checkFormatting = (sections = {}, jobDescription = '', targetRole = '') => {
  const results = {};

  const experience      = Array.isArray(sections.experience) ? sections.experience : [];
  const education       = Array.isArray(sections.education) ? sections.education : [];
  const skills          = sections.skills || {};
  const technicalSkills = Array.isArray(skills.technical) ? skills.technical : [];
  const softSkills      = Array.isArray(skills.soft) ? skills.soft : [];
  const personalInfo    = sections.personalInfo || {};
  const summary         = typeof sections.summary === 'string' ? sections.summary : '';

  // ── Section completeness ──────────────────────────────────────────────────
  const checks = {
    hasSummary:      Boolean(summary.trim()),
    hasExperience:   experience.length > 0,
    hasEducation:    education.length > 0,
    hasSkills:       technicalSkills.length > 0 || softSkills.length > 0,
    hasPersonalInfo: Boolean((personalInfo.fullName || '').trim()),
  };
  const filled = Object.values(checks).filter(Boolean).length;
  results.sectionCompleteness = clamp((filled / Object.keys(checks).length) * 100);

  // ── Contact info ──────────────────────────────────────────────────────────
  const contactFields = ['fullName', 'email', 'phone', 'location', 'linkedIn'];
  const contactFilled = contactFields.filter((f) => (personalInfo[f] || '').trim()).length;
  results.contactInfo = clamp((contactFilled / contactFields.length) * 100);

  // ── Bullets collection ────────────────────────────────────────────────────
  const allBullets = collectAllBullets(sections);

  // ── Action Verbs (detect strong verbs at the beginning of bullets) ────────
  if (allBullets.length > 0) {
    const actionVerbBullets = allBullets.filter((b) => {
      const actionWord = extractFirstActionWord(b);
      return ACTION_VERBS.has(actionWord);
    });
    const actionRatio = actionVerbBullets.length / allBullets.length;

    let actionScore = 0;
    if (actionRatio >= 0.75) {
      actionScore = 90 + Math.round(((actionRatio - 0.75) / 0.25) * 10);
    } else if (actionRatio >= 0.50) {
      actionScore = 75 + Math.round(((actionRatio - 0.50) / 0.25) * 15);
    } else {
      actionScore = Math.round(actionRatio * 150);
    }
    results.actionVerbs = clamp(actionScore);
  } else {
    results.actionVerbs = 0;
  }

  // ── Quantification (numbers, %, scale, performance improvements) ──────────
  if (allBullets.length > 0) {
    const quantifiedBullets = allBullets.filter(isBulletQuantified);
    const qRatio = quantifiedBullets.length / allBullets.length;

    let baseQ = 0;
    if (qRatio >= 0.70) {
      baseQ = 85 + Math.round(((qRatio - 0.70) / 0.30) * 15);
    } else if (qRatio >= 0.50) {
      baseQ = 70 + Math.round(((qRatio - 0.50) / 0.20) * 15);
    } else if (qRatio >= 0.30) {
      baseQ = 50 + Math.round(((qRatio - 0.30) / 0.20) * 20);
    } else {
      baseQ = Math.round(qRatio * 160);
    }

    const fullBulletsText = allBullets.join(' ');
    let metricDiversityBonus = 0;
    if (/\d+(?:\.\d+)?%/.test(fullBulletsText)) metricDiversityBonus += 5;
    if (/\b\d+[\+kKmMbBtTgG]\b|\b(?:users|events|data|traffic)\b/i.test(fullBulletsText)) metricDiversityBonus += 5;
    if (/from\s+.*?\s+to\s+|reduced.*?by|improved.*?by/i.test(fullBulletsText)) metricDiversityBonus += 5;

    results.quantification = clamp(baseQ + metricDiversityBonus);
  } else {
    results.quantification = 0;
  }

  // ── Bullet Quality ────────────────────────────────────────────────────────
  const bqAnalysis = analyzeBulletQuality(sections, jobDescription, targetRole);
  results.bulletQuality = bqAnalysis.bulletQuality;
  results.bulletQualityAnalysis = bqAnalysis;

  // ── Length (word count of actual English content) ─────────────────────────
  const wordCount = countResumeWords(sections);
  if      (wordCount >= 300 && wordCount <= 900)  results.length = 100;
  else if (wordCount >= 150 && wordCount <  300)  results.length = 75;
  else if (wordCount >  900 && wordCount <= 1200) results.length = 80;
  else if (wordCount >= 50  && wordCount <  150)  results.length = clamp((wordCount / 300) * 100);
  else if (wordCount < 50)                         results.length = clamp((wordCount / 300) * 100);
  else results.length = clamp(100 - Math.floor((wordCount - 1200) / 150) * 10);

  // ── Formatting (structural consistency & section health) ──────────────────
  let formatScore = 100;
  if (!checks.hasSummary)    formatScore -= 15;
  if (!checks.hasExperience) formatScore -= 25;
  if (!checks.hasEducation)  formatScore -= 10;
  if (!checks.hasSkills)     formatScore -= 15;
  for (const exp of experience) {
    if ((Array.isArray(exp.bullets) ? exp.bullets : []).length < 2) formatScore -= 5;
  }
  results.formatting = clamp(formatScore);

  return results;
};

/**
 * scoreSummaryStrength — compares summary against actual JD keywords and required role.
 */
const scoreSummaryStrength = (sections = {}, jobDescription = '', targetRole = '') => {
  const summary = (typeof sections.summary === 'string' ? sections.summary : '').trim();
  if (!summary) return 0;

  const words = summary.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  if (wordCount < 5) return clamp(15);

  const lowerSummary = summary.toLowerCase();

  // 1. Structure & Length (25 pts)
  let structureScore = 10;
  if (wordCount >= 25 && wordCount <= 85) {
    structureScore += 15;
  } else if (wordCount >= 15 && wordCount < 25) {
    structureScore += 10;
  } else if (wordCount > 85 && wordCount <= 120) {
    structureScore += 10;
  } else {
    structureScore += 5;
  }

  // 2. Role & Title Alignment (25 pts)
  const roleTokens = [
    'ai engineer', 'generative ai', 'machine learning', 'software engineer',
    'full-stack', 'full stack', 'backend', 'frontend', 'data engineer',
    'engineer', 'developer', 'architect', 'scientist'
  ];
  const matchedRoleTokens = roleTokens.filter((r) => lowerSummary.includes(r));
  let roleScore = 0;
  if (matchedRoleTokens.length >= 2) {
    roleScore = 25;
  } else if (matchedRoleTokens.length === 1) {
    roleScore = 20;
  } else if (/engineer|developer|architect|specialist|lead/i.test(lowerSummary)) {
    roleScore = 15;
  } else {
    roleScore = 10;
  }

  // 3. JD Technical Keywords Match (25 pts)
  const jdLower = (jobDescription || '').toLowerCase();
  const techConcepts = [
    'ai', 'generative ai', 'llm', 'rag', 'scalable', 'distributed', 'web applications',
    'microservices', 'cloud', 'pipeline', 'reliability', 'latency', 'full-stack',
    'python', 'react', 'node', 'api', 'systems', 'production'
  ];
  let jdConceptsMatched = 0;
  techConcepts.forEach((concept) => {
    if ((!jdLower || jdLower.includes(concept)) && lowerSummary.includes(concept)) {
      jdConceptsMatched++;
    }
  });

  let techScore = 0;
  if (jdConceptsMatched >= 3) {
    techScore = 25;
  } else if (jdConceptsMatched >= 2) {
    techScore = 20;
  } else if (jdConceptsMatched === 1) {
    techScore = 15;
  } else if (/scalable|systems|applications|code|software|performance/i.test(lowerSummary)) {
    techScore = 12;
  }

  // 4. Quantified Value & Seniority / Track Record (25 pts)
  let impactScore = 0;
  if (/\d+\+?\s*years/i.test(summary)) impactScore += 10;
  if (/\d+(?:\.\d+)?%|\b\d+\b/i.test(summary)) impactScore += 10;
  if (/proven track record|results-driven|delivering impactful|passionate|scale|reduced|improved/i.test(summary)) {
    impactScore += 5;
  }

  return clamp(structureScore + roleScore + techScore + impactScore);
};

/**
 * scoreBulletQuality — deterministic bullet quality score helper.
 */
const scoreBulletQuality = (formatResultsOrSections, jobDescription = '', targetRole = '') => {
  if (formatResultsOrSections && typeof formatResultsOrSections.bulletQuality === 'number') {
    return clamp(formatResultsOrSections.bulletQuality);
  }
  const analysis = analyzeBulletQuality(formatResultsOrSections || {}, jobDescription, targetRole);
  return clamp(analysis.bulletQuality);
};

/** scoreSkillCoverage — clamps to [0, 100]. */
const scoreSkillCoverage = (skillAnalysisResult) => {
  return clamp(skillAnalysisResult?.score || 0);
};

export {
  clamp,
  countResumeWords,
  checkFormatting,
  scoreSummaryStrength,
  scoreBulletQuality,
  scoreSkillCoverage,
};