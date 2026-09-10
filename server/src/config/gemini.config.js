import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

const getRetryDelay = (apiError, rawMessage) => {
  const retryDelay = apiError?.details
    ?.find((detail) => detail['@type']?.includes('RetryInfo'))
    ?.retryDelay;

  if (retryDelay) return retryDelay;

  const retryMatch = rawMessage.match(/"retryDelay"\s*:\s*"([^"]+)"/);
  if (retryMatch?.[1]) return retryMatch[1];

  const retryTextMatch = rawMessage.match(/Please retry in ([0-9.]+s)/i);
  return retryTextMatch?.[1] || '';
};

const formatRetryDelay = (retryDelay) => {
  if (!retryDelay) return '';

  const seconds = Number.parseFloat(retryDelay.replace('s', ''));
  if (Number.isNaN(seconds)) return retryDelay.replace('s', ' seconds');

  return `${Math.ceil(seconds)} seconds`;
};

const extractJsonPayload = (rawMessage) => {
  const jsonStart = rawMessage.indexOf('{');
  if (jsonStart === -1) return null;

  try {
    return JSON.parse(rawMessage.slice(jsonStart));
  } catch {
    return null;
  }
};

const getGeminiErrorDetails = (error, modelName = MODEL_NAME) => {
  const rawMessage = error?.message || '';
  const parsed = extractJsonPayload(rawMessage);
  const apiError = parsed?.error || parsed;
  const isQuotaError =
    apiError?.status === 'RESOURCE_EXHAUSTED' ||
    apiError?.code === 429 ||
    rawMessage.includes('[429 Too Many Requests]') ||
    rawMessage.includes('Quota exceeded');

  if (isQuotaError) {
    const retryText = formatRetryDelay(getRetryDelay(apiError, rawMessage));

    return {
      code: 'GEMINI_QUOTA_EXCEEDED',
      statusCode: 429,
      message: `Gemini quota exceeded for ${modelName}.${retryText ? ` Please retry in ${retryText}.` : ''} Check your Gemini API plan, billing, or switch GEMINI_MODEL/GEMINI_AGENT_MODEL to a model with available quota.`,
    };
  }

  if (apiError?.message) {
    return {
      code: 'GEMINI_API_ERROR',
      statusCode: apiError.code >= 400 && apiError.code < 600 ? apiError.code : 502,
      message: apiError.message,
    };
  }

  return {
    code: 'GEMINI_API_ERROR',
    statusCode: 502,
    message: rawMessage || 'Gemini request failed.',
  };
};

const toGeminiError = (error, modelName = MODEL_NAME) => {
  const details = getGeminiErrorDetails(error, modelName);
  const geminiError = new Error(details.message);
  geminiError.code = details.code;
  geminiError.statusCode = details.statusCode;
  return geminiError;
};

const parseGeminiError = (error, modelName = MODEL_NAME) => {
  return getGeminiErrorDetails(error, modelName).message;
};

const generateContent = async (prompt, customConfig = {}) => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: customConfig,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error.message);
    throw toGeminiError(error);
  }
};

export { ai, MODEL_NAME, generateContent, parseGeminiError, toGeminiError };

