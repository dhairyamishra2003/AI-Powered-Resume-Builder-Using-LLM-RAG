// ============================================
// atsMetrics.js - ATS Scoring Metric Definitions
// ============================================

const ATS_METRICS = [
  {
    key: 'keywordMatch',
    label: 'Keyword Match',
    weight: 20,
    description: 'JD keywords found in resume',
  },
  {
    key: 'bulletQuality',
    label: 'Bullet Quality',
    weight: 15,
    description: 'STAR method, specificity, impact',
  },
  {
    key: 'formatting',
    label: 'Formatting',
    weight: 10,
    description: 'Standard headers, clean structure',
  },
  {
    key: 'sectionCompleteness',
    label: 'Completeness',
    weight: 10,
    description: 'All key sections present',
  },
  {
    key: 'summaryStrength',
    label: 'Summary',
    weight: 10,
    description: 'Relevance and conciseness',
  },
  {
    key: 'skillCoverage',
    label: 'Skill Coverage',
    weight: 10,
    description: 'JD skills vs resume skills',
  },
  {
    key: 'quantification',
    label: 'Metrics & Numbers',
    weight: 10,
    description: 'Bullets with quantified results',
  },
  {
    key: 'actionVerbs',
    label: 'Action Verbs',
    weight: 5,
    description: 'Strong verbs leading bullets',
  },
  {
    key: 'length',
    label: 'Length',
    weight: 5,
    description: 'Appropriate word count',
  },
  {
    key: 'contactInfo',
    label: 'Contact Info',
    weight: 5,
    description: 'Email, phone, LinkedIn',
  },
];

// Runtime validation: verify weights sum to exactly 100
const TOTAL_WEIGHT = ATS_METRICS.reduce((sum, m) => sum + m.weight, 0);
if (TOTAL_WEIGHT !== 100) {
  throw new Error(`[atsMetrics] Weights must total 100%, currently total ${TOTAL_WEIGHT}%`);
}

/**
 * calculateAtsScoreFromBreakdown
 * Calculates the exact ATS final score from breakdown values displayed in the UI.
 *
 * @param {Object} breakdown - Map of metric key to { score: number } or number.
 * @param {boolean} verbose - If true, logs the debug table.
 * @returns {number} Clamped rounded score [0, 100].
 */
export const calculateAtsScoreFromBreakdown = (breakdown = {}, verbose = true) => {
  const metricScores = {};
  const metricWeights = {};
  const weightedScores = {};
  let totalWeightedScore = 0;

  for (const m of ATS_METRICS) {
    const rawVal = breakdown[m.key];
    const scoreVal = (rawVal !== null && typeof rawVal === 'object') ? (rawVal.score ?? 0) : (rawVal ?? 0);
    const clamped = Math.max(0, Math.min(100, Math.round(Number(scoreVal) || 0)));
    const weighted = (clamped * m.weight) / 100;

    metricScores[m.key] = clamped;
    metricWeights[m.key] = `${m.weight}%`;
    weightedScores[m.key] = Number(weighted.toFixed(2));
    totalWeightedScore += weighted;
  }

  const finalScore = Math.round(totalWeightedScore);

  if (verbose) {
    console.log('[ATS UI] ════════════════════════════════════════════════════════');
    console.log('[ATS UI] metricScores:  ', metricScores);
    console.log('[ATS UI] metricWeights: ', metricWeights);
    console.log('[ATS UI] weightedScore: ', weightedScores);
    console.log('[ATS UI] raw total:     ', totalWeightedScore.toFixed(4));
    console.log('[ATS UI] final ATS score:', finalScore);
    console.log('[ATS UI] ════════════════════════════════════════════════════════');
  }

  return finalScore;
};

export default ATS_METRICS;
