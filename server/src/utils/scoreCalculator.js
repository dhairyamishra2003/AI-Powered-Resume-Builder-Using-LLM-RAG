// ============================================
// scoreCalculator.js — Single source of truth for ATS final score
// ============================================
// finalScore = Math.round( Σ( clamp(metricScore_i) × weight_i ) )
// Weights are defined ONCE here and imported everywhere else.
// LLM NEVER contributes to this calculation.
// ============================================

// ── Weights (must sum to exactly 1.0 / 100%) ─────────────────────────────────
// Source of truth: atsMetrics.js on the client uses the same values as integers.
export const WEIGHTS = {
  keywordMatch:        0.20,  // 20%
  bulletQuality:       0.15,  // 15%
  formatting:          0.10,  // 10%
  sectionCompleteness: 0.10,  // 10%
  summaryStrength:     0.10,  // 10%
  skillCoverage:       0.10,  // 10%
  quantification:      0.10,  // 10%
  actionVerbs:         0.05,  //  5%
  length:              0.05,  //  5%
  contactInfo:         0.05,  //  5%
  // TOTAL:             1.00  // 100%
};

// Runtime assertion — catches any future accidental weight edit immediately
const WEIGHT_SUM = Object.values(WEIGHTS).reduce((s, w) => s + w, 0);
if (Math.abs(WEIGHT_SUM - 1.0) > 0.0001) {
  throw new Error(`[scoreCalculator] WEIGHTS must sum to 1.0, got ${WEIGHT_SUM}`);
}

/** Clamp a raw metric score to an integer in [0, 100]. */
export const clamp = (score) => Math.max(0, Math.min(100, Math.round(Number(score) || 0)));

/**
 * calculateOverallScore
 *
 * THE ONLY ATS FINAL-SCORE FUNCTION in the backend.
 *
 * @param {Object} metrics  Flat map: { keywordMatch: N, bulletQuality: N, … }
 *                          Values may also be { score: N } objects (backwards-compat).
 * @param {boolean} verbose If true (default), logs debug table showing metricScores, metricWeights,
 *                          weightedScore for every metric, and final ATS score.
 * @returns {number}        Integer in [0, 100].
 */
export const calculateOverallScore = (metrics, verbose = true) => {
  const metricScores = {};
  const metricWeights = {};
  const weightedScores = {};
  let totalWeightedScore = 0;

  for (const [metric, weight] of Object.entries(WEIGHTS)) {
    let raw = metrics[metric] ?? 0;
    // Support { score: N } objects (from breakdown entries)
    if (raw !== null && typeof raw === 'object') raw = raw.score ?? 0;
    const clamped = clamp(raw);
    const weightPct = Math.round(weight * 100);
    const weightedScore = clamped * weight;

    metricScores[metric] = clamped;
    metricWeights[metric] = `${weightPct}%`;
    weightedScores[metric] = Number(weightedScore.toFixed(2));
    totalWeightedScore += weightedScore;
  }

  const finalScore = Math.round(totalWeightedScore);

  if (verbose) {
    console.log('[ATS] ════════════════════════════════════════════════════════');
    console.log('[ATS] metricScores:  ', JSON.stringify(metricScores));
    console.log('[ATS] metricWeights: ', JSON.stringify(metricWeights));
    console.log('[ATS] weightedScore: ', JSON.stringify(weightedScores));
    console.log('[ATS] raw total:     ', totalWeightedScore.toFixed(4));
    console.log('[ATS] final ATS score:', finalScore);
    console.log('[ATS] ════════════════════════════════════════════════════════');
  }

  return finalScore;
};

export const getScoreCategory = (score) => {
  if (score >= 80) return 'strong';
  if (score >= 60) return 'good';
  if (score >= 40) return 'needs-work';
  return 'weak';
};