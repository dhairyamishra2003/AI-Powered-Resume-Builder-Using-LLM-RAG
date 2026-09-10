import API from './api.js';

const getLinkedInStatus = async () => {
  const response = await API.get('/linkedin/profile');
  return response.data;
};

const startLinkedInAuth = async ({ resumeId, templateId, profileUrl }) => {
  const params = new URLSearchParams({
    resumeId,
    templateId: templateId || '',
    profileUrl,
  });
  const response = await API.get(`/linkedin/auth?${params.toString()}`);
  return response.data;
};

const getLinkedInPreview = async ({ resumeId, importToken }) => {
  const response = await API.get(`/linkedin/profile?resumeId=${encodeURIComponent(resumeId)}&importToken=${encodeURIComponent(importToken)}`);
  return response.data;
};

const confirmLinkedInImport = async ({ resumeId, importToken, sections }) => {
  const response = await API.post('/linkedin/import', { resumeId, importToken, sections });
  return response.data;
};

export {
  confirmLinkedInImport,
  getLinkedInPreview,
  getLinkedInStatus,
  startLinkedInAuth,
};
