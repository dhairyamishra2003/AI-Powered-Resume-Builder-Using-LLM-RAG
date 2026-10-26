// ============================================
// keywordAnalyzer.js — Deterministic keyword & skill analysis
// ============================================
// Two separate concerns handled separately:
//   analyzeKeywords — broad keyword match (role words OK here)
//   analyzeSkills   — technical skill coverage (role words EXCLUDED)
// ============================================

// ── Stop words ────────────────────────────────────────────────────────────────
const STOP_WORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "can", "had",
  "her", "was", "one", "our", "out", "has", "have", "been", "will",
  "with", "this", "that", "from", "they", "were", "said", "each",
  "which", "their", "about", "would", "make", "like", "just", "over",
  "such", "take", "than", "them", "very", "some", "into", "most",
  "other", "could", "also", "more", "what", "when", "your", "work",
  "able", "using", "used", "including", "must", "should", "well",
  "experience", "role", "team", "join", "looking", "based", "strong",
  "working", "knowledge", "understanding", "skills", "ability",
  "responsibilities", "requirements", "qualifications", "preferred",
  "required", "years", "plus", "etc", "minimum",
]);

// ── Role / title words — filtered OUT of skill matching ──────────────────────
// These are job-title words that appear heavily in JD titles but are NOT skills.
// We exclude them so that "AI Engineer | Full-Stack Engineer" doesn't pollute
// the skill denominator with "engineer" × 3.
const ROLE_WORDS = new Set([
  "engineer", "engineers", "developer", "developers", "programmer", "programmers",
  "architect", "architects", "scientist", "scientists", "analyst", "analysts",
  "manager", "managers", "lead", "leads", "senior", "junior", "mid", "staff",
  "principal", "director", "head", "specialist", "consultant", "associate",
  "intern", "contractor", "freelance", "remote", "hybrid", "onsite",
  "full", "stack",   // keep these out when standalone — "full-stack" is handled by alias
  "time", "part",
]);

// ── Skill aliases ─────────────────────────────────────────────────────────────
// Maps shorthand → canonical single-word token.
// Sorted longest-first at runtime to prevent partial overlap.
const SKILL_ALIASES = {
  // Common compound-to-canonical
  "generative ai":         "generativeai",
  "gen ai":                "generativeai",
  "large language model":  "llm",
  "large language models": "llm",
  "machine learning":      "machinelearning",
  "deep learning":         "deeplearning",
  "natural language processing": "nlp",
  "computer vision":       "computervision",
  "reinforcement learning": "reinforcementlearning",
  "retrieval augmented generation": "rag",
  "full stack":            "fullstack",
  "full-stack":            "fullstack",
  "front end":             "frontend",
  "front-end":             "frontend",
  "back end":              "backend",
  "back-end":              "backend",
  "node js":               "nodejs",
  "node.js":               "nodejs",
  "react js":              "reactjs",
  "react.js":              "reactjs",
  "vue js":                "vuejs",
  "vue.js":                "vuejs",
  "next js":               "nextjs",
  "next.js":               "nextjs",
  "type script":           "typescript",
  "object oriented":       "oop",
  "object-oriented":       "oop",
  "continuous integration": "cicd",
  "continuous deployment":  "cicd",
  "google cloud":          "gcp",
  "google cloud platform": "gcp",
  "amazon web services":   "aws",
  "microsoft azure":       "azure",
  // Abbreviations / shorthands (single words)
  "js":       "javascript",
  "ts":       "typescript",
  "py":       "python",
  "cpp":      "cplusplus",
  "golang":   "go",
  "ml":       "machinelearning",
  "dl":       "deeplearning",
  "genai":    "generativeai",
  "gen-ai":   "generativeai",
  "llms":     "llm",
  "rl":       "reinforcementlearning",
  "xgb":      "xgboost",
  "ci/cd":    "cicd",
  "cicd":     "cicd",
  "k8s":      "kubernetes",
  "ui/ux":    "uiux",
  "restful":  "restapi",
  "apis":     "api",
  "pg":       "postgresql",
  "mongo":    "mongodb",
  "es":       "elasticsearch",
};

/**
 * normalizeText — lowercase, expand multi-word aliases, collapse whitespace.
 * Processes longest aliases first to prevent partial overlaps.
 * Returns a normalised string ready for token extraction.
 */
const normalizeText = (text) => {
  if (!text) return '';
  let t = text.toLowerCase();
  // Replace punctuation separators with spaces
  t = t.replace(/[,;:|•–—→()\[\]]/g, ' ');
  t = t.replace(/[/\\]/g, ' ');
  // Remove apostrophes
  t = t.replace(/'/g, '');
  // Collapse whitespace before alias expansion
  t = t.replace(/\s+/g, ' ').trim();

  // Expand aliases — longest first to prevent partial matches
  const sortedAliases = Object.entries(SKILL_ALIASES)
    .sort((a, b) => b[0].length - a[0].length);
  for (const [alias, canonical] of sortedAliases) {
    try {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      t = t.replace(new RegExp(`\\b${escaped}\\b`, 'g'), canonical);
    } catch {
      try {
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        t = t.replace(new RegExp(escaped, 'g'), canonical);
      } catch {
        // Safe fallback: continue
      }
    }
  }

  return t.replace(/\s+/g, ' ').trim();
};

/**
 * extractTokens — extract meaningful single-word tokens from normalised text.
 * Minimum 2 chars; filters stop words.
 * Used for KEYWORD matching (role words included).
 */
const extractTokens = (text) => {
  const normalised = normalizeText(text);
  const words = normalised.match(/\b[a-z0-9][a-z0-9+#.\-]{1,}\b/g) || [];
  return words.filter((w) => !STOP_WORDS.has(w));
};

/**
 * extractSkillTokens — extract TECHNICAL skill tokens from normalised text.
 * Filters BOTH stop words AND role words — so "engineer", "developer", etc.
 * do not pollute the skill denominator when extracting skills from a JD title.
 */
const extractSkillTokens = (text) => {
  return extractTokens(text).filter((w) => !ROLE_WORDS.has(w));
};

/**
 * buildFrequencyTop — build a frequency-ranked, deduplicated list of tokens.
 * Stable sort: frequency descending, then alphabetical ascending for ties.
 */
const buildFrequencyTop = (tokens, limit = 30) => {
  const freq = {};
  for (const w of tokens) { freq[w] = (freq[w] || 0) + 1; }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word]) => word);
};

/**
 * analyzeKeywords — broad keyword match between resume and JD.
 * Includes role words (engineer, developer, …) in the token set.
 * Returns { score, matched, missing, totalJdKeywords }.
 */
const analyzeKeywords = (resumeText, jobDescription) => {
  if (!jobDescription) {
    return { score: 0, matched: [], missing: [], totalJdKeywords: 0 };
  }

  const jdTokens   = extractTokens(jobDescription);
  const resumeSet  = new Set(extractTokens(resumeText));
  const topJd      = buildFrequencyTop(jdTokens, 30);

  const matched = [...new Set(topJd.filter((k) => resumeSet.has(k)))];
  const missing = [...new Set(topJd.filter((k) => !resumeSet.has(k)))];

  return {
    score:           Math.min(Math.round((matched.length / (topJd.length || 1)) * 100), 100),
    matched:         matched.slice(0, 20),
    missing:         missing.slice(0, 15),
    totalJdKeywords: topJd.length,
  };
};

/**
 * analyzeSkills — TECHNICAL skill coverage of resume against JD.
 *
 * Key differences from analyzeKeywords:
 *   1. Uses extractSkillTokens (role words excluded from denominator)
 *   2. Compares resume SKILLS SECTION only (not the full resume text)
 *   3. Deduplicates matched/missing before returning
 *
 * Returns { score, matched, missing, jdSkillTokens }.
 */
const analyzeSkills = (sections, jobDescription) => {
  if (!jobDescription) {
    return { score: 0, matched: [], missing: [], jdSkillTokens: [] };
  }

  // ── Extract actual skill tokens from JD (no role words) ──────────────────
  const jdSkillTokens = buildFrequencyTop(extractSkillTokens(jobDescription), 30);

  if (jdSkillTokens.length === 0) {
    // JD contains only role words and stop words — no scoreable skills
    return { score: 100, matched: [], missing: [], jdSkillTokens: [] };
  }

  // ── Build skill token set from resume's skills section ───────────────────
  const skills = sections?.skills || {};
  const skillList = Array.isArray(skills)
    ? [...skills]
    : [
        ...(Array.isArray(skills.technical)  ? skills.technical  : []),
        ...(Array.isArray(skills.soft)        ? skills.soft        : []),
        ...(Array.isArray(skills.tools)       ? skills.tools       : []),
        ...(Array.isArray(skills.languages)   ? skills.languages   : []),
      ];

  // Also include tokens from experience bullets and summary for implicit skill coverage
  const experience = Array.isArray(sections?.experience) ? sections.experience : [];
  const expText = experience
    .flatMap((e) => Array.isArray(e.bullets) ? e.bullets : [])
    .join(' ');
  const summary = typeof sections?.summary === 'string' ? sections.summary : '';

  const fullSkillText = [skillList.join(' '), expText, summary].join(' ');
  const resumeSkillSet = new Set(extractSkillTokens(fullSkillText));

  const matched = [...new Set(jdSkillTokens.filter((k) => resumeSkillSet.has(k)))];
  const missing = [...new Set(jdSkillTokens.filter((k) => !resumeSkillSet.has(k)))];

  return {
    score:          Math.min(Math.round((matched.length / jdSkillTokens.length) * 100), 100),
    matched:        matched.slice(0, 20),
    missing:        missing.slice(0, 15),
    jdSkillTokens,
  };
};

export { normalizeText, extractTokens, extractSkillTokens, analyzeKeywords, analyzeSkills };