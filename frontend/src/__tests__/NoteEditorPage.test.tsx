import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NoteEditorPage from '../pages/NoteEditorPage';
import * as notesApi from '../services/notesApi';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({}),
}));

describe('NoteEditorPage', () => {
  test('creates a new note and navigates back to /dashboard', async () => {
    const createSpy = jest.spyOn(notesApi, 'createNote').mockResolvedValue({
      note: {
        id: 'new-1',
        title: 'Sprint Goals',
        content: '',
        tag: 'Work',
        color: '#FFFFFF',
        updatedAt: new Date().toISOString(),
      },
    });

    render(
      <MemoryRouter>
        <NoteEditorPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/note title/i), {
      target: { value: 'Sprint Goals' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save note/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith({
        title: 'Sprint Goals',
        content: '',
        tag: 'Work',
        color: '#FFFFFF',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('navigates back to /dashboard when Cancel is clicked', () => {
    render(
      <MemoryRouter>
        <NoteEditorPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
});
