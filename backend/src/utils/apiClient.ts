import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { ruppiConfig } from '../config/ruppi.config';

const ruppiClient: AxiosInstance = axios.create({
  baseURL: ruppiConfig.baseUrl,
  timeout: ruppiConfig.timeoutMs,
});

// Apply the static app-level bearer token ONLY when no per-request Authorization is set.
// This ensures user-specific tokens (e.g. in update-profile, get-profile) always take priority.
ruppiClient.interceptors.request.use((config) => {
  // Use config.headers.get() for case-insensitive lookup (Axios 1.x)
  const hasAuth = config.headers.get('Authorization');

  if (!hasAuth) {
    config.headers.set('Authorization', `Bearer ${ruppiConfig.bearerToken}`);
  }

  if (process.env['NODE_ENV'] === 'development') {
    console.log('[RUPPI] Request:', config.method?.toUpperCase(), config.url);
  }
  return config;
});

// Normalize RUPPI error responses for logging
ruppiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status ?? 0;
    const data = error.response?.data as any;
    console.error('[RUPPI] Error:', status, JSON.stringify(data) || error.message);
    return Promise.reject(error);
  }
);

export { ruppiClient };

