import API from './api.js';

const getDigiLockerStatus = async () => {
  const response = await API.get('/digilocker/academic');
  return response.data;
};

const startDigiLockerAuth = async ({ resumeId, templateId }) => {
  const params = new URLSearchParams({
    resumeId,
    templateId: templateId || '',
  });
  const response = await API.get(`/digilocker/auth?${params.toString()}`);
  return response.data;
};

const getDigiLockerPreview = async ({ resumeId, importToken }) => {
  const response = await API.get(`/digilocker/academic?resumeId=${encodeURIComponent(resumeId)}&importToken=${encodeURIComponent(importToken)}`);
  return response.data;
};

const confirmDigiLockerImport = async ({ resumeId, importToken, education }) => {
  const response = await API.post('/digilocker/import', { resumeId, importToken, education });
  return response.data;
};

export {
  confirmDigiLockerImport,
  getDigiLockerPreview,
  getDigiLockerStatus,
  startDigiLockerAuth,
};
