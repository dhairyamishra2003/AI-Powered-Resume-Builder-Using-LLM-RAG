// ============================================
// google.config.js - Google OAuth Configuration
// ============================================

import { OAuth2Client } from 'google-auth-library';

const rawClientId = process.env.GOOGLE_CLIENT_ID || '';
const clientId = rawClientId.trim();

const googleClient = new OAuth2Client(clientId);

const getClientId = () => (process.env.GOOGLE_CLIENT_ID || rawClientId || '').trim();

const verifyGoogleToken = async (credential) => {
  if (!credential) {
    const error = new Error('Google credential is required.');
    error.statusCode = 400;
    error.code = 'MISSING_CREDENTIAL';
    throw error;
  }

  const configuredClientId = getClientId();
  if (!configuredClientId || configuredClientId.startsWith('your-google-')) {
    const error = new Error('Google OAuth is not configured on the server. Please set GOOGLE_CLIENT_ID in server/.env.');
    error.statusCode = 500;
    error.code = 'OAUTH_NOT_CONFIGURED';
    throw error;
  }

  try {
    const client = new OAuth2Client(configuredClientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: configuredClientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      const error = new Error('Google profile does not contain a valid email address.');
      error.statusCode = 400;
      error.code = 'INVALID_GOOGLE_PAYLOAD';
      throw error;
    }

    return {
      googleId: payload.sub,
      email: payload.email.toLowerCase().trim(),
      name: payload.name || payload.email.split('@')[0],
      picture: payload.picture || '',
    };
  } catch (error) {
    if (error.statusCode) throw error;
    console.error('Google token verification failed:', error.message);
    const authError = new Error('Invalid or expired Google authentication token. Please sign in again.');
    authError.statusCode = 401;
    authError.code = 'INVALID_GOOGLE_TOKEN';
    throw authError;
  }
};

export { googleClient, verifyGoogleToken };
