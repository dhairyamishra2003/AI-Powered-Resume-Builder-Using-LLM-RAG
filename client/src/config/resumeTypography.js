// =============================================================================
// resumeTypography.js ΓÇö Centralized Typography Configuration for All Templates
// =============================================================================
// Single source of truth for font sizing across all resume templates, shared
// layout components, browser previews, and PDF export.
//
// Changing RESUME_FONT_SCALE proportionally scales all typography tokens
// while maintaining visual hierarchy, template identities, and pagination safety.
// =============================================================================

/**
 * Global Font Scale Factor.
 * Default is 1.10 (as required).
 * Change this single value (e.g. 1.00, 1.10, 1.15) to proportionally scale
 * every resume template and shared layout component across the entire application.
 */
export const RESUME_FONT_SCALE = 1.15;
/**
 * Scales a base pixel font size by RESUME_FONT_SCALE and returns a CSS pixel string.
 * @param {number|string} baseSize - Base font size in pixels (e.g. 11 or '11px')
 * @returns {string} Scaled font size (e.g. '12.1px')
 */
export const getResumeFontSize = (baseSize) => {
  if (typeof baseSize !== 'number') {
    const parsed = parseFloat(baseSize);
    if (isNaN(parsed)) return baseSize;
    baseSize = parsed;
  }
  const scaled = Math.round(baseSize * RESUME_FONT_SCALE * 100) / 100;
  return `${scaled}px`;
};

/**
 * Base pixel sizes for semantic resume typography tokens.
 * These establish the relative visual hierarchy between headings, body,
 * and supporting metadata.
 */
export const BASE_TYPOGRAPHY = {
  // Headings
  name: 22,
  nameLarge: 24,
  targetRole: 11,
  targetRoleSmall: 10.5,
  targetRoleLarge: 12,
  tagline: 9,

  // Section titles
  sectionTitle: 11,
  sectionTitleDefault: 13,
  sectionTitleLarge: 15,
  subsectionTitle: 11,

  // Body & Summary
  body: 10.75,
  bodySmall: 9.5,
  summary: 9.5,
  summaryDefault: 11.25,
  summaryAts: 9.8,

  // Experience
  experience: 12,
  experienceRole: 12,
  experienceDate: 12,
  bullet: 9,

  // Projects
  projectTitle: 10,
  projectDescription: 8,
  projectMeta: 11,
  projectBadge: 11.5,

  // Skills
  technicalSkills: 10,
  technicalSkillsSmall: 9,
  technicalSkillsAts: 9.2,
  softSkills: 15.25,
  softSkillsSmall: 15,
  softSkillsAts: 15.2,

  // Contact
  contact: 15.5,
  contactDefault: 15.5,
  contactIcon: 15,
  contactExecutive: 15,
  contactAts: 15,

  // Education
  education: 15,
  educationDegree: 15,
  educationInstitution: 15.5,
  educationDate: 15,

  // Certifications & Languages
  certification: 10,
  certificationAts: 10.2,
  language: 10,
  languageAts: 10.2,

  // Pagination & Continuation Headers
  runningHeader: 8.5,
  pageNumber: 8,
};

/**
 * Semantic typography tokens scaled by RESUME_FONT_SCALE.
 * Accessible directly as `resumeTypography.name`, `resumeTypography.sectionTitle`, etc.
 */
export const resumeTypography = {
  get name() { return getResumeFontSize(BASE_TYPOGRAPHY.name); },
  get nameLarge() { return getResumeFontSize(BASE_TYPOGRAPHY.nameLarge); },
  get targetRole() { return getResumeFontSize(BASE_TYPOGRAPHY.targetRole); },
  get targetRoleSmall() { return getResumeFontSize(BASE_TYPOGRAPHY.targetRoleSmall); },
  get targetRoleLarge() { return getResumeFontSize(BASE_TYPOGRAPHY.targetRoleLarge); },
  get tagline() { return getResumeFontSize(BASE_TYPOGRAPHY.tagline); },

  get sectionTitle() { return getResumeFontSize(BASE_TYPOGRAPHY.sectionTitle); },
  get sectionTitleDefault() { return getResumeFontSize(BASE_TYPOGRAPHY.sectionTitleDefault); },
  get sectionTitleLarge() { return getResumeFontSize(BASE_TYPOGRAPHY.sectionTitleLarge); },
  get subsectionTitle() { return getResumeFontSize(BASE_TYPOGRAPHY.subsectionTitle); },

  get body() { return getResumeFontSize(BASE_TYPOGRAPHY.body); },
  get bodySmall() { return getResumeFontSize(BASE_TYPOGRAPHY.bodySmall); },
  get summary() { return getResumeFontSize(BASE_TYPOGRAPHY.summary); },
  get summaryDefault() { return getResumeFontSize(BASE_TYPOGRAPHY.summaryDefault); },
  get summaryAts() { return getResumeFontSize(BASE_TYPOGRAPHY.summaryAts); },

  get experience() { return getResumeFontSize(BASE_TYPOGRAPHY.experience); },
  get experienceRole() { return getResumeFontSize(BASE_TYPOGRAPHY.experienceRole); },
  get experienceDate() { return getResumeFontSize(BASE_TYPOGRAPHY.experienceDate); },
  get bullet() { return getResumeFontSize(BASE_TYPOGRAPHY.bullet); },

  get projectTitle() { return getResumeFontSize(BASE_TYPOGRAPHY.projectTitle); },
  get projectDescription() { return getResumeFontSize(BASE_TYPOGRAPHY.projectDescription); },
  get projectMeta() { return getResumeFontSize(BASE_TYPOGRAPHY.projectMeta); },
  get projectBadge() { return getResumeFontSize(BASE_TYPOGRAPHY.projectBadge); },

  get technicalSkills() { return getResumeFontSize(BASE_TYPOGRAPHY.technicalSkills); },
  get technicalSkillsSmall() { return getResumeFontSize(BASE_TYPOGRAPHY.technicalSkillsSmall); },
  get technicalSkillsAts() { return getResumeFontSize(BASE_TYPOGRAPHY.technicalSkillsAts); },
  get softSkills() { return getResumeFontSize(BASE_TYPOGRAPHY.softSkills); },
  get softSkillsSmall() { return getResumeFontSize(BASE_TYPOGRAPHY.softSkillsSmall); },
  get softSkillsAts() { return getResumeFontSize(BASE_TYPOGRAPHY.softSkillsAts); },

  get contact() { return getResumeFontSize(BASE_TYPOGRAPHY.contact); },
  get contactDefault() { return getResumeFontSize(BASE_TYPOGRAPHY.contactDefault); },
  get contactIcon() { return getResumeFontSize(BASE_TYPOGRAPHY.contactIcon); },
  get contactExecutive() { return getResumeFontSize(BASE_TYPOGRAPHY.contactExecutive); },
  get contactAts() { return getResumeFontSize(BASE_TYPOGRAPHY.contactAts); },

  get education() { return getResumeFontSize(BASE_TYPOGRAPHY.education); },
  get educationDegree() { return getResumeFontSize(BASE_TYPOGRAPHY.educationDegree); },
  get educationInstitution() { return getResumeFontSize(BASE_TYPOGRAPHY.educationInstitution); },
  get educationDate() { return getResumeFontSize(BASE_TYPOGRAPHY.educationDate); },

  get certification() { return getResumeFontSize(BASE_TYPOGRAPHY.certification); },
  get certificationAts() { return getResumeFontSize(BASE_TYPOGRAPHY.certificationAts); },
  get language() { return getResumeFontSize(BASE_TYPOGRAPHY.language); },
  get languageAts() { return getResumeFontSize(BASE_TYPOGRAPHY.languageAts); },

  get runningHeader() { return getResumeFontSize(BASE_TYPOGRAPHY.runningHeader); },
  get pageNumber() { return getResumeFontSize(BASE_TYPOGRAPHY.pageNumber); },
};

/**
 * Template-specific base font size hierarchies.
 * Preserves each template's distinctive visual identity while scaling
 * proportionately under the central RESUME_FONT_SCALE control.
 */
export const TEMPLATE_TYPOGRAPHY_BASES = {
'aiml-engineer': {
  name: 24,
  targetRole: 12,
  sectionTitle: 15,
  contact: 9.5,
  summary: 8.5,
  technicalSkills: 10.5,
  certification: 15.5,
  headerIcon: 22,
},
  'software-engineer': {
    name: 22,
    targetRole: 10.5,
    sectionTitle: 15,
    contact: 10.5,
    summary: 9.5,
    technicalSkills: 10,
    certification: 15,
  },
  'executive-corporate': {
    tagline: 9,
    name: 24,
    targetRole: 12,
    sectionTitle: 16,
    contact: 10,
    summary: 10.5,
    technicalSkills: 11.5,
    softSkills: 15.5,
    certification: 15,
    language: 15,
  },
  'modern-professional': {
    name: 22,
    targetRole: 11,
    sectionTitle: 20,
    contact: 10.5,
    summary: 11.5,
    technicalSkills: 12,
    softSkills: 10.25,
    certification: 16,
    language: 15,
  },
  'creative-clean': {
    name: 22,
    targetRole: 11,
    sectionTitle: 15,
    contact: 10.5,
    summary: 11.5,
    technicalSkills: 19,
    softSkills: 10.25,
    certification: 15,
    language: 15,
    headerIcon: 22,
  },
  'minimal-ats': {
    name: 24,
    targetRole: 12,
    sectionTitle: 18,
    contact: 9.5,
    summary: 14.8,
    technicalSkills: 16,
    softSkills: 11.5,
    certification: 12.5,
    language: 15.5,
  },
};

/**
 * Returns scaled typography tokens tailored to a specific template layout.
 * Falls back to default semantic tokens if an attribute is not customized.
 * @param {string} templateId - Identifier (e.g. 'aiml-engineer', 'minimal-ats')
 * @returns {Record<string, string>} Scaled CSS font-size values
 */
export const getTemplateTypography = (templateId) => {
  const base = TEMPLATE_TYPOGRAPHY_BASES[templateId] || {};
  return {
    name: getResumeFontSize(base.name ?? BASE_TYPOGRAPHY.name),
    targetRole: getResumeFontSize(base.targetRole ?? BASE_TYPOGRAPHY.targetRole),
    sectionTitle: getResumeFontSize(base.sectionTitle ?? BASE_TYPOGRAPHY.sectionTitle),
    contact: getResumeFontSize(base.contact ?? BASE_TYPOGRAPHY.contact),
    summary: getResumeFontSize(base.summary ?? BASE_TYPOGRAPHY.summary),
    technicalSkills: getResumeFontSize(base.technicalSkills ?? BASE_TYPOGRAPHY.technicalSkills),
    softSkills: getResumeFontSize(base.softSkills ?? BASE_TYPOGRAPHY.softSkills),
    certification: getResumeFontSize(base.certification ?? BASE_TYPOGRAPHY.certification),
    language: getResumeFontSize(base.language ?? BASE_TYPOGRAPHY.language),
    tagline: getResumeFontSize(base.tagline ?? BASE_TYPOGRAPHY.tagline),
    headerIcon: getResumeFontSize(base.headerIcon ?? 20),
    bullet: getResumeFontSize(BASE_TYPOGRAPHY.bullet),
    experience: getResumeFontSize(BASE_TYPOGRAPHY.experience),
    projectTitle: getResumeFontSize(BASE_TYPOGRAPHY.projectTitle),
    projectDescription: getResumeFontSize(BASE_TYPOGRAPHY.projectDescription),
    education: getResumeFontSize(BASE_TYPOGRAPHY.education),
    pageNumber: getResumeFontSize(BASE_TYPOGRAPHY.pageNumber),
    runningHeader: getResumeFontSize(BASE_TYPOGRAPHY.runningHeader),
  };
};

export default resumeTypography;
