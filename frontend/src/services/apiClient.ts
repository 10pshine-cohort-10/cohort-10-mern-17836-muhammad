import { ApiEnvelope, ApiRequestError } from '../types/models';

const API_BASE_URL: string = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export function getStoredToken(): string | null {
  return localStorage.getItem('noted_token');
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string> | undefined) || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<T>;

  if (!response.ok || payload.success === false) {
    const message =
      (payload.error && payload.error.message) || `Request failed with status ${response.status}`;
    const error = new Error(message) as ApiRequestError;
    error.status = response.status;
    error.code = payload.error?.code || 'API_ERROR';
    throw error;
  }

  return payload.data as T;
}
