// ============================================
// TEMPLATES — 6 Premium ATS Resume Templates
// ============================================
// Single source of truth exported from centralized templateRegistry.js.
// Preserves all existing properties and adds canonical resolution.
// ============================================

import {
  TEMPLATE_CONFIGS,
  resolveTemplateId,
  getTemplateConfig,
  isTemplateRegistered,
  LEGACY_TEMPLATE_ALIASES,
} from '../config/templateRegistry.js';

const TEMPLATES = Object.values(TEMPLATE_CONFIGS).map((cfg) => ({
  id: cfg.id,
  layout: cfg.layout,
  name: cfg.name,
  category: cfg.category,
  description: cfg.description,
  colors: cfg.colors,
  font: cfg.font,
  version: cfg.version,
  layoutType: cfg.layoutType,
  supportedSections: cfg.supportedSections,
  aliases: cfg.aliases,
}));

export {
  resolveTemplateId,
  getTemplateConfig,
  isTemplateRegistered,
  LEGACY_TEMPLATE_ALIASES,
};

export default TEMPLATES;
