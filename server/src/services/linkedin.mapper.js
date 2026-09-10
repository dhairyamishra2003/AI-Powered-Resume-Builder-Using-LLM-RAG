const pickFirstString = (...values) => values.find((value) => typeof value === 'string' && value.trim())?.trim() || '';

export const LINKEDIN_IMPORT_FIELDS = [
  { key: 'fullName', label: 'Name', section: 'personalInfo', field: 'fullName' },
  { key: 'email', label: 'Email', section: 'personalInfo', field: 'email' },
  { key: 'phone', label: 'Phone', section: 'personalInfo', field: 'phone' },
  { key: 'location', label: 'Location', section: 'personalInfo', field: 'location' },
  { key: 'linkedIn', label: 'LinkedIn URL', section: 'personalInfo', field: 'linkedIn' },
  { key: 'portfolio', label: 'Portfolio', section: 'personalInfo', field: 'portfolio' },
  { key: 'summary', label: 'Headline/About', section: 'summary', field: null },
  { key: 'experience', label: 'Experience', section: 'experience', field: null },
  { key: 'education', label: 'Education', section: 'education', field: null },
  { key: 'skills', label: 'Skills', section: 'skills', field: null },
  { key: 'projects', label: 'Projects', section: 'projects', field: null },
  { key: 'certifications', label: 'Certifications', section: 'certifications', field: null },
];

const normalizeProfileUrl = (url = '') => {
  const value = pickFirstString(url);
  if (!value) return '';
  return value.startsWith('http') ? value : `https://${value}`;
};

export const normalizeLinkedInProfile = (profile = {}) => {
  const givenName = pickFirstString(profile.given_name, profile.localizedFirstName);
  const familyName = pickFirstString(profile.family_name, profile.localizedLastName);
  const fullName = pickFirstString(profile.name, `${givenName} ${familyName}`.trim());
  const email = pickFirstString(profile.email);
  const linkedinId = pickFirstString(profile.sub, profile.id);
  const picture = pickFirstString(profile.picture);
  const locale = profile.locale || null;
  const profileUrl = pickFirstString(profile.profile, profile.vanityName ? `https://www.linkedin.com/in/${profile.vanityName}` : '');
  const headline = pickFirstString(profile.headline, profile.about, profile.summary);

  return {
    linkedinId,
    fullName,
    email,
    profileUrl,
    headline,
    picture,
    locale,
    rawAvailableFields: Object.keys(profile),
  };
};

export const mapLinkedInProfileToResumeSections = (profile = {}, options = {}) => {
  const sections = {};
  const personalInfo = {};
  const profileUrl = profile.profileUrl || normalizeProfileUrl(options.profileUrl);

  if (profile.fullName) personalInfo.fullName = profile.fullName;
  if (profile.email) personalInfo.email = profile.email;
  if (profile.phone) personalInfo.phone = profile.phone;
  if (profile.location) personalInfo.location = profile.location;
  if (profileUrl) personalInfo.linkedIn = profileUrl;
  if (profile.portfolio) personalInfo.portfolio = profile.portfolio;

  if (Object.keys(personalInfo).length) {
    sections.personalInfo = personalInfo;
  }

  if (profile.headline) sections.summary = profile.headline;
  if (Array.isArray(profile.experience) && profile.experience.length) sections.experience = profile.experience;
  if (Array.isArray(profile.education) && profile.education.length) sections.education = profile.education;
  if (profile.skills) sections.skills = profile.skills;
  if (Array.isArray(profile.projects) && profile.projects.length) sections.projects = profile.projects;
  if (Array.isArray(profile.certifications) && profile.certifications.length) sections.certifications = profile.certifications;

  return sections;
};

export const mergeLinkedInSections = (currentSections = {}, importedSections = {}) => ({
  ...currentSections,
  personalInfo: importedSections.personalInfo
    ? {
      ...(currentSections.personalInfo || {}),
      ...importedSections.personalInfo,
    }
    : currentSections.personalInfo,
  summary: importedSections.summary ?? currentSections.summary,
  experience: importedSections.experience ?? currentSections.experience,
  education: importedSections.education ?? currentSections.education,
  skills: importedSections.skills
    ? {
      ...(currentSections.skills || {}),
      ...importedSections.skills,
    }
    : currentSections.skills,
  projects: importedSections.projects ?? currentSections.projects,
  certifications: importedSections.certifications ?? currentSections.certifications,
});

export const describeImportAvailability = (sections = {}) => LINKEDIN_IMPORT_FIELDS.map((item) => {
  let value;
  if (item.section === 'personalInfo') {
    value = sections.personalInfo?.[item.field];
  } else {
    value = sections[item.section];
  }

  const hasValue = Array.isArray(value)
    ? value.length > 0
    : Boolean(value && (typeof value !== 'object' || Object.keys(value).length));

  return {
    ...item,
    available: hasValue,
    value: hasValue ? value : null,
    reason: hasValue ? '' : 'Not available from LinkedIn API - please enter manually.',
  };
});
