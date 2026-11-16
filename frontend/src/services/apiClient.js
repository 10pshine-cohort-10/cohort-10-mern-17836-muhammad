const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export function getStoredToken() {
  return localStorage.getItem('noted_token');
}

export async function apiRequest(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.success === false) {
    const message =
      (payload.error && payload.error.message) || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.code = payload.error ? payload.error.code : 'API_ERROR';
    throw error;
  }

  return payload.data;
}
