import { apiRequest } from './apiClient';
import {
  AuthResponseData,
  CurrentUserResponseData,
  LoginCredentials,
  RegisterCredentials,
} from '../types/models';

export function registerUser(credentials: RegisterCredentials): Promise<AuthResponseData> {
  return apiRequest<AuthResponseData>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export function loginUser(credentials: LoginCredentials): Promise<AuthResponseData> {
  return apiRequest<AuthResponseData>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export function fetchCurrentUser(): Promise<CurrentUserResponseData> {
  return apiRequest<CurrentUserResponseData>('/auth/me', {
    method: 'GET',
  });
}

export function logoutUser(): Promise<void> {
  return apiRequest<void>('/auth/logout', {
    method: 'POST',
  });
}
