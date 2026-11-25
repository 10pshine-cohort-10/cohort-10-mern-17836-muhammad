import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';
import * as AuthContextModule from '../context/AuthContext';
import * as notesApi from '../services/notesApi';

jest.mock('../services/socketClient', () => ({
  createNoteSocket: () => ({
    on: jest.fn(),
    disconnect: jest.fn(),
  }),
}));

describe('DashboardPage', () => {
  test('renders user greeting and fetched notes list', async () => {
    jest.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 'u1', fullName: 'Alex Morgan', email: 'alex@example.com' },
      token: 'jwt-token',
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    });

    jest.spyOn(notesApi, 'fetchNotes').mockResolvedValue({
      notes: [
        {
          id: 'n1',
          title: 'Weekly planning',
          content: '<p>Review sprint goals</p>',
          tag: 'Work',
          color: '#FFFFFF',
          updatedAt: new Date().toISOString(),
        },
      ],
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Alex/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Weekly planning')).toBeInTheDocument();
    });
  });
});
