
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';
import * as AuthContextModule from '../context/AuthContext';
import * as notesApi from '../services/notesApi';
import { NotesListResponseData } from '../types/models';

jest.mock('../services/socketClient', () => ({
  createNoteSocket: () => ({
    on: jest.fn(),
    disconnect: jest.fn(),
  }),
}));

describe('DashboardPage', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders user greeting and fetched notes list', async () => {
    try {
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
    } catch (err) {
      throw err;
    }
  });

  test('ignores stale API response when a newer request resolves first', async () => {
    try {
      jest.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        user: { id: 'u1', fullName: 'Alex Morgan', email: 'alex@example.com' },
        token: 'jwt-token',
        loading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
      });

      let resolveFirstRequest!: (value: NotesListResponseData) => void;
      const firstPromise = new Promise<NotesListResponseData>((resolve) => {
        resolveFirstRequest = resolve;
      });

      const fetchSpy = jest
        .spyOn(notesApi, 'fetchNotes')
        .mockReturnValueOnce(firstPromise)
        .mockResolvedValueOnce({
          notes: [
            {
              id: 'n-new',
              title: 'Latest search result',
              content: '<p>Fresh note</p>',
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

      fireEvent.change(screen.getByLabelText(/search notes/i), {
        target: { value: 'Latest' },
      });

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(2);
        expect(screen.getByText('Latest search result')).toBeInTheDocument();
      });

      await act(async () => {
        resolveFirstRequest({
          notes: [
            {
              id: 'n-stale',
              title: 'Stale initial note',
              content: '<p>Outdated</p>',
              tag: 'Personal',
              color: '#FFFFFF',
              updatedAt: new Date().toISOString(),
            },
          ],
        });
      });

      expect(screen.getByText('Latest search result')).toBeInTheDocument();
      expect(screen.queryByText('Stale initial note')).not.toBeInTheDocument();
    } catch (err) {
      throw err;
    }
  });
});
