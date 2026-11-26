import { fetchNotes, deleteNote } from '../services/notesApi';

describe('notesApi service', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    localStorage.setItem('noted_token', 'sample-jwt');
  });

  afterEach(() => {
    jest.resetAllMocks();
    localStorage.clear();
  });

  test('fetchNotes sends Authorization header and query parameters', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { notes: [] } }),
    });

    await fetchNotes({ search: 'meeting', tag: 'Work' });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/notes?search=meeting&tag=Work',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer sample-jwt',
        }),
      })
    );
  });

  test('deleteNote sends DELETE request to /notes/:id', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { id: 'note-42' } }),
    });

    const res = await deleteNote('note-42');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/notes/note-42',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          Authorization: 'Bearer sample-jwt',
        }),
      })
    );
    expect(res).toEqual({ id: 'note-42' });
  });
});
