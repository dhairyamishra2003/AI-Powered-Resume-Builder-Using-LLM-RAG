import * as digilockerService from '../services/digilocker.service.js';

const sendDigiLockerError = (res, error) => res.status(error.statusCode || 500).json({
  success: false,
  message: error.message || 'DigiLocker/APAAR integration failed.',
  code: error.code || 'DIGILOCKER_ERROR',
});

export const getAuthUrl = async (req, res) => {
  try {
    const { resumeId, templateId } = req.query;
    if (!resumeId) {
      return res.status(400).json({ success: false, message: 'resumeId is required.' });
    }

    await digilockerService.validateResumeOwnership({ userId: req.user._id, resumeId });
    const data = digilockerService.generateAuthorizationUrl({ userId: req.user._id, resumeId, templateId });
    return res.json({ success: true, data });
  } catch (error) {
    return sendDigiLockerError(res, error);
  }
};

export const handleCallback = async (req, res) => {
  let statePayload;
  try {
    const { code, state, error, error_description: errorDescription } = req.query;
    statePayload = digilockerService.validateOAuthState(state);

    if (error) {
      return res.redirect(digilockerService.getClientCallbackUrl({
        resumeId: statePayload.resumeId,
        status: 'error',
        message: errorDescription || 'DigiLocker authorization was denied.',
      }));
    }

    const accessToken = await digilockerService.exchangeCodeForAccessToken(code);
    const academicRecords = await digilockerService.fetchAcademicRecords(accessToken);
    const importToken = digilockerService.createImportToken({
      userId: statePayload.userId,
      resumeId: statePayload.resumeId,
      templateId: statePayload.templateId,
      academicRecords,
    });

    return res.redirect(digilockerService.getClientCallbackUrl({ resumeId: statePayload.resumeId, importToken }));
  } catch (error) {
    const resumeId = statePayload?.resumeId || '';
    if (resumeId) {
      return res.redirect(digilockerService.getClientCallbackUrl({
        resumeId,
        status: error.code === 'DIGILOCKER_NOT_CONFIGURED' ? 'not_configured' : 'error',
        message: error.message,
      }));
    }
    return res.status(error.statusCode || 400).send(error.message || 'DigiLocker authorization failed.');
  }
};

export const getStatusOrPreview = async (req, res) => {
  try {
    const { resumeId, importToken } = req.query;
    if (resumeId && importToken) {
      return res.json({
        success: true,
        data: {
          configured: digilockerService.isConfigured(),
          preview: digilockerService.getImportPreview({ userId: req.user._id, resumeId, importToken }),
        },
      });
    }

    return res.json({
      success: true,
      data: {
        configured: digilockerService.isConfigured(),
        scopes: ['openid', 'profile', 'documents'],
      },
    });
  } catch (error) {
    return sendDigiLockerError(res, error);
  }
};

export const confirmImport = async (req, res) => {
  try {
    const { resumeId, importToken, education } = req.body;
    if (!resumeId || !importToken) {
      return res.status(400).json({ success: false, message: 'resumeId and importToken are required.' });
    }

    const resume = await digilockerService.confirmImport({
      userId: req.user._id,
      resumeId,
      importToken,
      selectedEducation: education,
    });

    return res.json({ success: true, data: resume });
  } catch (error) {
    return sendDigiLockerError(res, error);
  }
};
