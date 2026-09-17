import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

/**
 * Base URL resolution:
 *   - `VITE_API_URL` when the backend is deployed on a separate origin;
 *   - otherwise the relative `/api` path, which works in local dev through the
 *     Vite proxy and in production through the Vercel rewrite to the API
 *     function. Localhost is never hardcoded here.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

// Request interceptor to attach tokens securely from localStorage
api.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem('gdgoc_admin_token');
  const studentToken = localStorage.getItem('gdgoc_student_token');

  // Inject admin token for all /admin routes, else inject student token
  if (config.url?.startsWith('/admin')) {
    if (adminToken && config.headers) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
  } else {
    if (studentToken && config.headers) {
      config.headers.Authorization = `Bearer ${studentToken}`;
    }
  }
  return config;
});

// Response interceptor to handle unauthenticated sessions silently
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Optional: We can dispatch a custom event or let AuthContext handle the redirect.
      // We don't want to force redirect every 401 because it interrupts the UX of checking if logged in.
    }
    return Promise.reject(error);
  }
);

export interface ApiError {
  success: boolean;
  message: string;
  errors?: Record<string, string>;
}

const FRIENDLY_DB = 'Database service temporarily unavailable. Please try again later.';
const FRIENDLY_NETWORK = 'Cannot reach the server. Check your connection and try again.';
const FRIENDLY_TIMEOUT = 'The request timed out. Please try again.';
const FRIENDLY_GENERIC = 'Something went wrong. Please try again.';

// Anything matching these must never reach the user verbatim.
const INTERNAL_PATTERNS: RegExp[] = [
  /mongo/i,
  /mongoose/i,
  /econnrefused/i,
  /enotfound/i,
  /eai_again/i,
  /querysrv/i,
  /getaddrinfo/i,
  /buffering/i,
  /serverselection/i,
  /etimedout/i,
  /mongodb_uri/i,
  /before initial connection/i,
  /\bat\s+\S+\.(ts|js):\d+/,
];

function looksInternal(message: string): boolean {
  return INTERNAL_PATTERNS.some((re) => re.test(message));
}

/** True when the request failed because the database is unreachable. */
export function isDatabaseUnavailable(err: unknown): boolean {
  if (!axios.isAxiosError(err)) return false;
  const msg = String((err.response?.data as ApiError | undefined)?.message || err.message || '');
  // A 503 can also mean "email provider not configured" — only treat responses
  // that actually mention the database as a database outage.
  return /database (service temporarily )?unavailable|database connection unavailable/i.test(msg);
}

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = (err as AxiosError<ApiError>).response?.data;
    if (data?.errors && typeof data.errors === 'object') {
      const details = Object.entries(data.errors)
        .filter(([, msg]) => typeof msg === 'string' && msg.trim())
        .map(([, msg]) => msg.trim());
      if (details.length > 0) return details.join(' ');
    }
    if (isDatabaseUnavailable(err)) return FRIENDLY_DB;
    if (data?.message && !looksInternal(data.message)) return data.message;
    if (err.code === 'ECONNABORTED') return FRIENDLY_TIMEOUT;
    if (!err.response) return FRIENDLY_NETWORK;
    return FRIENDLY_GENERIC;
  }
  if (err instanceof Error && err.message && !looksInternal(err.message)) return err.message;
  return FRIENDLY_GENERIC;
}

/**
 * Single entry point for surfacing API errors.
 *
 * react-hot-toast replaces a toast when it receives the same `id`, so several
 * simultaneous failures with the same message (for example multiple API calls
 * all failing while the database is down) collapse into ONE notification
 * instead of stacking up. Distinct messages still each get their own toast.
 */
export function showApiError(err: unknown): void {
  const message = getErrorMessage(err);
  toast.error(message, { id: message });
}

/**
 * Extract per-field validation errors from a 4xx API response so forms can
 * render them beside the exact invalid field (e.g. `socialLinks.github`).
 */
export function getFieldErrors(err: unknown): Record<string, string> {
  if (!axios.isAxiosError(err)) return {};
  const data = err.response?.data as ApiError | undefined;
  if (!data || !data.errors || typeof data.errors !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [key, msg] of Object.entries(data.errors)) {
    if (typeof msg === 'string' && msg.trim()) out[key] = msg.trim();
  }
  return out;
}

export function isAuthError(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 401;
}
