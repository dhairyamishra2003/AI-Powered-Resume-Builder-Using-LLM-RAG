// =============================================================================
// templateRegistry.js — Centralized, Immutable Template Configuration Registry
// =============================================================================
// Single source of truth for all registered resume templates.
// Locks template layout structures, section placements, margins, typography,
// and continuation rules to prevent regressions.
// =============================================================================

import { TEMPLATE_TYPOGRAPHY_BASES, BASE_TYPOGRAPHY } from './resumeTypography.js';

export const TEMPLATE_VERSION = '1.0.0';

export const A4_PAGE_SPEC = Object.freeze({
  widthMm: 210,
  heightMm: 297,
  widthPx: 794,
  heightPx: 1123,
  maxPages: 2,
  dpi: 96,
});

export const ALL_SUPPORTED_SECTIONS = Object.freeze([
  'personalInfo',
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'publications',
  'languages',
]);

export const LEGACY_TEMPLATE_ALIASES = Object.freeze({
  classic: 'modern-professional',
  modern: 'modern-professional',
  creative: 'creative-clean',
  minimal: 'minimal-ats',
  executive: 'executive-corporate',
});

/**
 * Resolves any template identifier (including legacy aliases) to its canonical ID.
 * @param {string} templateId
 * @returns {string} Canonical template ID
 */
export function resolveTemplateId(templateId) {
  if (!templateId || typeof templateId !== 'string') {
    return 'modern-professional';
  }
  const trimmed = templateId.trim();
  if (LEGACY_TEMPLATE_ALIASES[trimmed]) {
    return LEGACY_TEMPLATE_ALIASES[trimmed];
  }
  return trimmed;
}

export const TEMPLATE_CONFIGS = Object.freeze({
  'modern-professional': Object.freeze({
    id: 'modern-professional',
    layout: 'modern-professional',
    version: TEMPLATE_VERSION,
    name: 'Modern Professional',
    category: 'professional',
    description: 'Clean two-column layout with deep slate banner & ATS-optimized structure',
    layoutType: 'two-column',
    font: "'Inter', sans-serif",
    page: A4_PAGE_SPEC,
    colors: Object.freeze({
      primary: '#0f172a',
      accent: '#2563eb',
      text: '#1e293b',
      light: '#f8fafc',
      sidebarBg: '#f8fafc',
      sidebarBorder: '1px solid #e2e8f0',
    }),
    sidebar: Object.freeze({
      width: '238px',
      lockWidth: true,
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      padding: '12px 10px',
      disablePage2Sidebar: false,
    }),
    margins: Object.freeze({
      mainPadding: '12px 16px',
      page2Padding: '16px 22px',
      twoColumnGap: '10px',
      blockGap: 8,
    }),
    sectionOrder: Object.freeze({
      page1Sidebar: ['technicalSkills', 'coreStrengths', 'languages', 'education'],
      page2Sidebar: [],
      mainContent: [
        'summary',
        'experience',
        'projects',
        'certifications',
        'publications',
        'languages',
      ],
    }),
    supportedSections: ALL_SUPPORTED_SECTIONS,
    aliases: Object.freeze(['classic', 'modern']),
    typography: TEMPLATE_TYPOGRAPHY_BASES['modern-professional'],
    continuationRules: Object.freeze({
      disablePage2Sidebar: false,
      hasRunningHeader: true,
      continuationNotice: true,
    }),
  }),

  'minimal-ats': Object.freeze({
    id: 'minimal-ats',
    layout: 'minimal-ats',
    version: TEMPLATE_VERSION,
    name: 'Minimal ATS',
    category: 'minimal',
    description: '100% single-column layout engineered specifically for Workday, Greenhouse & Taleo ATS parsers',
    layoutType: 'single-column',
    font: 'Georgia, serif',
    page: A4_PAGE_SPEC,
    colors: Object.freeze({
      primary: '#0f172a',
      accent: '#334155',
      text: '#1e293b',
      light: '#ffffff',
      sidebarBg: '#ffffff',
      sidebarBorder: 'none',
    }),
    sidebar: null,
    margins: Object.freeze({
      mainPadding: '16px 24px',
      page2Padding: '16px 24px',
      twoColumnGap: '0px',
      blockGap: 8,
    }),
    sectionOrder: Object.freeze({
      page1Sidebar: [],
      page2Sidebar: [],
      mainContent: [
        'summary',
        'technicalSkills',
        'experience',
        'education',
        'projects',
        'certifications',
        'publications',
        'coreStrengths',
        'languages',
      ],
    }),
    supportedSections: ALL_SUPPORTED_SECTIONS,
    aliases: Object.freeze(['minimal']),
    typography: TEMPLATE_TYPOGRAPHY_BASES['minimal-ats'],
    continuationRules: Object.freeze({
      disablePage2Sidebar: true,
      hasRunningHeader: true,
      continuationNotice: false,
    }),
  }),

  'executive-corporate': Object.freeze({
    id: 'executive-corporate',
    layout: 'executive-corporate',
    version: TEMPLATE_VERSION,
    name: 'Executive Corporate',
    category: 'executive',
    description: 'Deep indigo top banner with serif headers for executive leadership & VP roles',
    layoutType: 'two-column',
    font: 'Georgia, serif',
    page: A4_PAGE_SPEC,
    colors: Object.freeze({
      primary: '#1e1b4b',
      accent: '#d97706',
      text: '#1e293b',
      light: '#f8fafc',
      sidebarBg: '#f8fafc',
      sidebarBorder: '1px solid #e2e8f0',
    }),
    sidebar: Object.freeze({
      width: '238px',
      lockWidth: true,
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      padding: '12px 10px',
      disablePage2Sidebar: false,
    }),
    margins: Object.freeze({
      mainPadding: '12px 16px',
      page2Padding: '16px 22px',
      twoColumnGap: '10px',
      blockGap: 8,
    }),
    sectionOrder: Object.freeze({
      page1Sidebar: ['education', 'coreStrengths'],
      page2Sidebar: ['languages', 'coreStrengths'],
      mainContent: [
        'summary',
        'experience',
        'projects',
        'certifications',
        'publications',
        'coreStrengths',
      ],
    }),
    supportedSections: ALL_SUPPORTED_SECTIONS,
    aliases: Object.freeze(['executive']),
    typography: TEMPLATE_TYPOGRAPHY_BASES['executive-corporate'],
    continuationRules: Object.freeze({
      disablePage2Sidebar: false,
      hasRunningHeader: true,
      continuationNotice: true,
    }),
  }),

  'software-engineer': Object.freeze({
    id: 'software-engineer',
    layout: 'software-engineer',
    version: TEMPLATE_VERSION,
    name: 'Software Engineer',
    category: 'modern',
    description: 'Developer-centric design with categorized technical stack badges & project callouts',
    layoutType: 'single-column',
    font: "'Inter', sans-serif",
    page: A4_PAGE_SPEC,
    colors: Object.freeze({
      primary: '#0f172a',
      accent: '#2563eb',
      text: '#0f172a',
      light: '#eff6ff',
      sidebarBg: '#ffffff',
      sidebarBorder: 'none',
    }),
    sidebar: null,
    margins: Object.freeze({
      mainPadding: '10px 22px',
      page2Padding: '16px 22px',
      twoColumnGap: '0px',
      blockGap: 6,
    }),
    sectionOrder: Object.freeze({
      page1Sidebar: [],
      page2Sidebar: [],
      mainContent: [
        'summary',
        'technicalSkills',
        'experience',
        'projects',
        'education',
        'certifications',
        'publications',
        'languages',
      ],
    }),
    supportedSections: ALL_SUPPORTED_SECTIONS,
    aliases: Object.freeze([]),
    typography: TEMPLATE_TYPOGRAPHY_BASES['software-engineer'],
    continuationRules: Object.freeze({
      disablePage2Sidebar: true,
      hasRunningHeader: true,
      continuationNotice: false,
    }),
  }),

  'aiml-engineer': Object.freeze({
    id: 'aiml-engineer',
    layout: 'aiml-engineer',
    version: TEMPLATE_VERSION,
    name: 'AI/ML Engineer',
    category: 'modern',
    description: 'Specialized layout for AI/ML/Data Science engineers highlighting ML frameworks & model metrics',
    layoutType: 'single-column',
    font: "'Inter', sans-serif",
    page: A4_PAGE_SPEC,
    colors: Object.freeze({
      primary: '#0f766e',
      accent: '#2dd4bf',
      text: '#0f172a',
      light: '#f0fdfa',
      sidebarBg: '#ffffff',
      sidebarBorder: 'none',
    }),
    sidebar: null,
    margins: Object.freeze({
      mainPadding: '10px 22px',
      page2Padding: '16px 22px',
      twoColumnGap: '0px',
      blockGap: 6,
    }),
    sectionOrder: Object.freeze({
      page1Sidebar: [],
      page2Sidebar: [],
      mainContent: [
        'summary',
        'technicalSkills',
        'experience',
        'projects',
        'education',
        'certifications',
        'publications',
        'coreStrengths',
        'languages',
      ],
    }),
    supportedSections: ALL_SUPPORTED_SECTIONS,
    aliases: Object.freeze([]),
    typography: TEMPLATE_TYPOGRAPHY_BASES['aiml-engineer'],
    continuationRules: Object.freeze({
      disablePage2Sidebar: true,
      hasRunningHeader: true,
      continuationNotice: false,
    }),
  }),

  'creative-clean': Object.freeze({
    id: 'creative-clean',
    layout: 'creative-clean',
    version: TEMPLATE_VERSION,
    name: 'Creative Clean',
    category: 'creative',
    description: 'Contemporary design with royal violet & pink accents for designers & product managers',
    layoutType: 'two-column',
    font: "'Inter', sans-serif",
    page: A4_PAGE_SPEC,
    colors: Object.freeze({
      primary: '#6d28d9',
      accent: '#ec4899',
      text: '#1e1b4b',
      light: '#faf5ff',
      sidebarBg: '#faf5ff',
      sidebarBorder: '1px solid #e9d5ff',
    }),
    sidebar: Object.freeze({
      width: '238px',
      lockWidth: true,
      background: '#faf5ff',
      border: '1px solid #e9d5ff',
      padding: '12px 10px',
      disablePage2Sidebar: false,
    }),
    margins: Object.freeze({
      mainPadding: '12px 14px',
      page2Padding: '16px 22px',
      twoColumnGap: '10px',
      blockGap: 8,
    }),
    sectionOrder: Object.freeze({
      page1Sidebar: ['technicalSkills', 'coreStrengths'],
      page2Sidebar: ['technicalSkills', 'coreStrengths'],
      mainContent: [
        'summary',
        'education',
        'experience',
        'projects',
        'certifications',
        'publications',
        'languages',
      ],
    }),
    supportedSections: ALL_SUPPORTED_SECTIONS,
    aliases: Object.freeze(['creative']),
    typography: TEMPLATE_TYPOGRAPHY_BASES['creative-clean'],
    continuationRules: Object.freeze({
      disablePage2Sidebar: false,
      hasRunningHeader: true,
      continuationNotice: false,
    }),
  }),
});

export const LOCKED_TEMPLATE_IDS = Object.freeze([
  'modern-professional',
  'minimal-ats',
  'executive-corporate',
  'software-engineer',
  'aiml-engineer',
  'creative-clean',
]);

export const TEMPLATE_LOCK_METADATA = Object.freeze({
  version: '1.0.0-LOCKED',
  lockedAt: '2026-11-02T14:15:00+05:30',
  status: 'PERMANENTLY_LOCKED',
  protectedTemplates: LOCKED_TEMPLATE_IDS,
  enforceImmutableLayout: true,
});

/**
 * Returns true if the template is one of the 6 locked templates.
 * @param {string} templateId
 * @returns {boolean}
 */
export function isTemplateLocked(templateId) {
  const canonicalId = resolveTemplateId(templateId);
  return LOCKED_TEMPLATE_IDS.includes(canonicalId);
}

/**
 * Validates that a template's runtime configuration has not been mutated or corrupted.
 * Throws an Error if an unauthorized mutation is detected.
 * @param {string} templateId
 * @returns {object} Validated immutable template config
 */
export function validateTemplateConfig(templateId) {
  const canonicalId = resolveTemplateId(templateId);
  const config = TEMPLATE_CONFIGS[canonicalId];
  if (!config) {
    throw new Error(`[TemplateSecurityError] Template "${templateId}" is not a recognized locked template.`);
  }
  if (!Object.isFrozen(config)) {
    throw new Error(`[TemplateSecurityError] Template "${canonicalId}" configuration has been mutated! Object must be frozen.`);
  }
  return config;
}

/**
 * Returns the immutable configuration object for a template.
 * @param {string} templateId
 * @returns {object} Frozen template configuration
 */
export function getTemplateConfig(templateId) {
  const canonicalId = resolveTemplateId(templateId);
  return TEMPLATE_CONFIGS[canonicalId] || TEMPLATE_CONFIGS['modern-professional'];
}

/**
 * Returns true if the templateId is registered or maps to a registered template.
 * @param {string} templateId
 * @returns {boolean}
 */
export function isTemplateRegistered(templateId) {
  if (!templateId) return false;
  const canonicalId = resolveTemplateId(templateId);
  return Boolean(TEMPLATE_CONFIGS[canonicalId]);
}
