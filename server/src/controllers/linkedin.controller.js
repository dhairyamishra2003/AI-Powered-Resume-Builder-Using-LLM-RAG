import * as linkedinService from '../services/linkedin.service.js';

const sendLinkedInError = (res, error) => res.status(error.statusCode || 500).json({
  success: false,
  message: error.message || 'LinkedIn integration failed.',
  code: error.code || 'LINKEDIN_ERROR',
});

export const getAuthUrl = async (req, res) => {
  try {
    const { resumeId, templateId, profileUrl } = req.query;
    if (!resumeId) {
      return res.status(400).json({ success: false, message: 'resumeId is required.' });
    }

    await linkedinService.validateResumeOwnership({ userId: req.user._id, resumeId });
    const data = linkedinService.generateAuthorizationUrl({ userId: req.user._id, resumeId, templateId, profileUrl });
    return res.json({ success: true, data });
  } catch (error) {
    return sendLinkedInError(res, error);
  }
};

export const handleCallback = async (req, res) => {
  let statePayload;
  try {
    const { code, state, error, error_description: errorDescription } = req.query;
    statePayload = linkedinService.validateOAuthState(state);

    if (error) {
      const redirectUrl = linkedinService.getClientCallbackUrl({
        resumeId: statePayload.resumeId,
        status: 'error',
        message: errorDescription || 'LinkedIn authorization was denied.',
      });
      return res.redirect(redirectUrl);
    }

    const accessToken = await linkedinService.exchangeCodeForAccessToken(code);
    const profile = await linkedinService.fetchProfile(accessToken);
    const importToken = linkedinService.createImportToken({
      userId: statePayload.userId,
      resumeId: statePayload.resumeId,
      templateId: statePayload.templateId,
      profileUrl: statePayload.profileUrl,
      profile,
    });

    return res.redirect(linkedinService.getClientCallbackUrl({ resumeId: statePayload.resumeId, importToken }));
  } catch (error) {
    const resumeId = statePayload?.resumeId || '';
    if (resumeId) {
      return res.redirect(linkedinService.getClientCallbackUrl({
        resumeId,
        status: error.code === 'LINKEDIN_NOT_CONFIGURED' ? 'not_configured' : 'error',
        message: error.message,
      }));
    }
    return res.status(error.statusCode || 400).send(error.message || 'LinkedIn authorization failed.');
  }
};

export const getProfileStatus = async (req, res) => {
  try {
    const { resumeId, importToken } = req.query;
    if (resumeId && importToken) {
      return res.json({
        success: true,
        data: {
          configured: linkedinService.isConfigured(),
          preview: linkedinService.getImportPreview({ userId: req.user._id, resumeId, importToken }),
        },
      });
    }

    return res.json({
      success: true,
      data: {
        configured: linkedinService.isConfigured(),
        scopes: ['openid', 'profile', 'email'],
      },
    });
  } catch (error) {
    return sendLinkedInError(res, error);
  }
};

export const confirmImport = async (req, res) => {
  try {
    const { resumeId, importToken, sections } = req.body;
    if (!resumeId || !importToken) {
      return res.status(400).json({ success: false, message: 'resumeId and importToken are required.' });
    }

    const resume = await linkedinService.confirmImport({
      userId: req.user._id,
      resumeId,
      importToken,
      sections,
    });

    return res.json({ success: true, data: resume });
  } catch (error) {
    return sendLinkedInError(res, error);
  }
};
