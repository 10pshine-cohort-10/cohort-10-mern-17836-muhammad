import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthPage from '../pages/AuthPage';
import * as AuthContextModule from '../context/AuthContext';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('AuthPage', () => {
  test('renders Log in form by default and toggles to Sign up form', () => {
    jest.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      login: jest.fn(),
      register: jest.fn(),
    });

    render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /sign up/i }));
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
  });

  test('validates short password client-side and submits valid login credentials', async () => {
    const loginMock = jest.fn().mockResolvedValue({ id: 'u1', fullName: 'Alex Morgan' });
    jest.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      login: loginMock,
      register: jest.fn(),
    });

    render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'alex@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: '123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^log in$/i }));

    expect(await screen.findByText(/password must be at least 8 characters/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^log in$/i }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        email: 'alex@example.com',
        password: 'Password123!',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });
});
