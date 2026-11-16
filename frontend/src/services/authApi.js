import { apiRequest } from './apiClient';

export function registerUser(credentials) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export function loginUser(credentials) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export function fetchCurrentUser() {
  return apiRequest('/auth/me', {
    method: 'GET',
  });
}

export function logoutUser() {
  return apiRequest('/auth/logout', {
    method: 'POST',
  });
}
