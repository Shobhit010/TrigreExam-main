import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { ruppiConfig } from '../config/ruppi.config';

const ruppiClient: AxiosInstance = axios.create({
  baseURL: ruppiConfig.baseUrl,
  timeout: ruppiConfig.timeoutMs,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ruppiConfig.bearerToken}`,
  },
});

// Log outgoing requests in development — NEVER log the Authorization header
ruppiClient.interceptors.request.use((config) => {
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
    const data = error.response?.data as Record<string, unknown> | undefined;
    console.error('[RUPPI] Error:', status, data?.['msg'] ?? error.message);
    return Promise.reject(error);
  }
);

export { ruppiClient };
