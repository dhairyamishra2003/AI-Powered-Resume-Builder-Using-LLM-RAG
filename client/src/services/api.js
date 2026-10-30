// ============================================
// api.js - Fetch Wrapper with Auth Token & Resilient Fallback
// ============================================
// Reference: fetch(), async/await - reference-javascript.md

const rawBaseUrl = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api');
const PRIMARY_BASE_URL = String(rawBaseUrl).trim().replace(/\/+$/, '');

// Direct fallback URL for development mode when Vite proxy is restarting or unavailable
const DIRECT_BACKEND_URL = import.meta.env.DEV
  ? 'http://127.0.0.1:5000/api'
  : null;

const DEFAULT_TIMEOUT_MS = 90000;

// A request may reach the server even when the proxy/client loses its response.
// Only retry methods that are safe to repeat; in particular, never resend a
// resume-upload POST automatically because it could create a duplicate resume.
const canRetryDirectly = (options = {}) => ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE']
  .includes((options.method || 'GET').toUpperCase());

const executeRequest = async (baseUrl, endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), options.timeoutMs || DEFAULT_TIMEOUT_MS);
  let response;

  try {
    response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      const text = await response.text();
      data = text ? { message: text } : null;
    } catch {
      data = null;
    }
  }

  return { response, data };
};

const fetchApi = async (endpoint, options = {}) => {
  let primaryError = null;

  try {
    const { response, data } = await executeRequest(PRIMARY_BASE_URL, endpoint, options);

    // If proxy returned a temporary 502/503/504 and direct backend fallback is configured, retry directly
    if (!response.ok && (response.status === 502 || response.status === 503 || response.status === 504) && canRetryDirectly(options) && DIRECT_BACKEND_URL && PRIMARY_BASE_URL !== DIRECT_BACKEND_URL) {
      console.warn(`[API] Proxy returned ${response.status} for ${endpoint}. Retrying directly against backend...`);
      try {
        const directResult = await executeRequest(DIRECT_BACKEND_URL, endpoint, options);
        if (directResult.response.ok) {
          return directResult.data;
        }
      } catch (directErr) {
        console.warn('[API] Direct backend fallback also failed:', directErr.message);
      }
    }

    if (!response.ok) {
      const message = data?.message || data?.error || (
        response.status === 502 || response.status === 503 || response.status === 504
          ? 'Server is starting up or temporarily unavailable. Please try again.'
          : `Request failed with status ${response.status}`
      );
      const error = new Error(message);
      error.response = { data, status: response.status };
      throw error;
    }

    return data;
  } catch (error) {
    primaryError = error;

    // If fetch failed due to network / proxy abort and direct fallback is available, retry directly
    if (canRetryDirectly(options) && DIRECT_BACKEND_URL && PRIMARY_BASE_URL !== DIRECT_BACKEND_URL && error.name !== 'AbortError') {
      console.warn(`[API] Primary request to ${endpoint} failed (${error.message}). Retrying directly against backend...`);
      try {
        const directResult = await executeRequest(DIRECT_BACKEND_URL, endpoint, options);
        if (directResult.response.ok) {
          return directResult.data;
        }
        const message = directResult.data?.message || directResult.data?.error || `Request failed with status ${directResult.response.status}`;
        const err = new Error(message);
        err.response = { data: directResult.data, status: directResult.response.status };
        throw err;
      } catch (fallbackError) {
        console.warn('[API] Direct retry also failed:', fallbackError.message);
      }
    }

    const message = primaryError?.name === 'AbortError'
      ? `The ${endpoint} request took too long to respond. Please try again.`
      : (primaryError?.message || 'Unable to reach the server. Check your connection and try again.');

    const finalError = new Error(message);
    finalError.response = primaryError?.response;
    finalError.cause = primaryError;
    throw finalError;
  }
};

export const uploadWithProgress = (endpoint, formData, onProgress, options = {}) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const token = localStorage.getItem('token');
    const baseUrl = PRIMARY_BASE_URL;

    xhr.open('POST', `${baseUrl}${endpoint}`, true);
    xhr.withCredentials = true;
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    if (xhr.upload && typeof onProgress === 'function') {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      let data = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        data = xhr.responseText ? { message: xhr.responseText } : null;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data);
      } else {
        const message = data?.message || data?.error || `Upload failed with status ${xhr.status}`;
        const error = new Error(message);
        error.response = { data, status: xhr.status };
        reject(error);
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during upload. Please check your connection.'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Upload timed out. The server took too long to process the document.'));
    };

    xhr.timeout = options.timeoutMs || 120000;
    xhr.send(formData);
  });
};

const API = {
  get: (endpoint) => fetchApi(endpoint),

  post: (endpoint, body, requestOptions = {}) => fetchApi(endpoint, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
    ...requestOptions,
  }),

  put: (endpoint, body) => fetchApi(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  }),

  delete: (endpoint) => fetchApi(endpoint, {
    method: 'DELETE',
  }),
};

export default API;

