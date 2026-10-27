export const VALID_TEMPLATE_IDS = [
  'classic',
  'modern',
  'creative',
  'minimal',
  'executive',
  'modern-professional',
  'minimal-ats',
  'executive-corporate',
  'software-engineer',
  'aiml-engineer',
  'creative-clean',
];

export const DEFAULT_TEMPLATE_ID = 'modern-professional';

export const LEGACY_TEMPLATE_MAP = Object.freeze({
  classic: 'modern-professional',
  modern: 'modern-professional',
  creative: 'creative-clean',
  minimal: 'minimal-ats',
  executive: 'executive-corporate',
});

export const resolveTemplateId = (templateId) => {
  if (!templateId || typeof templateId !== 'string') return DEFAULT_TEMPLATE_ID;
  const trimmed = templateId.trim();
  if (LEGACY_TEMPLATE_MAP[trimmed]) return LEGACY_TEMPLATE_MAP[trimmed];
  return VALID_TEMPLATE_IDS.includes(trimmed) ? trimmed : DEFAULT_TEMPLATE_ID;
};
