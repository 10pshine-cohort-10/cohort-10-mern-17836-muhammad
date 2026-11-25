import { expect } from 'chai';
import sinon, { SinonSpy, SinonStub } from 'sinon';
import NoteService, { NoteRepositoryContract } from '../src/services/noteService';
import AppError from '../src/utils/AppError';
import { CreateNoteRecord, NoteRow } from '../src/types/models';

interface NoteRepoStub extends NoteRepositoryContract {
  findAllByUser: SinonStub;
  findByIdAndUser: SinonStub;
  createNote: SinonStub;
  updateNote: SinonStub;
  deleteNote: SinonStub;
  bulkInsertNotes: SinonStub;
}

describe('NoteService', () => {
  let noteRepoStub: NoteRepoStub;
  let socketSpy: SinonSpy;
  let noteService: NoteService;

  beforeEach(() => {
    noteRepoStub = {
      findAllByUser: sinon.stub(),
      findByIdAndUser: sinon.stub(),
      createNote: sinon.stub(),
      updateNote: sinon.stub(),
      deleteNote: sinon.stub(),
      bulkInsertNotes: sinon.stub(),
    };
    socketSpy = sinon.spy();
    noteService = new NoteService(noteRepoStub, socketSpy);
  });

  it('sanitizes XSS script tags when creating a note and emits socket event', async () => {
    noteRepoStub.createNote.callsFake(
      async (data: CreateNoteRecord): Promise<NoteRow> =>
        ({
          id: data.id,
          user_id: data.userId,
          title: data.title,
          content: data.content,
          tag: data.tag,
          color: data.color,
          created_at: new Date(),
          updated_at: new Date(),
        }) as NoteRow
    );

    const note = await noteService.createNote('user-1', {
      title: '<b>Weekly planning</b><script>alert(1)</script>',
      content: '<p>Priorities</p><img src=x onerror=alert(1)>',
      tag: 'Work',
      color: '#d1f3e0',
    });

    expect(note.title).to.equal('Weekly planning');
    expect(note.content).to.equal('<p>Priorities</p>');
    expect(note.color).to.equal('#D1F3E0');
    expect(socketSpy.calledOnceWith('user-1', 'note:created')).to.be.true;
  });

  it('applies partial updates without overwriting omitted fields from stale reads', async () => {
    noteRepoStub.updateNote.resolves({
      id: 'note-1',
      user_id: 'user-1',
      title: 'Updated title',
      content: '<p>Concurrent content</p>',
      tag: 'Work',
      color: '#FFFFFF',
      created_at: new Date(),
      updated_at: new Date(),
    } as NoteRow);

    const updated = await noteService.updateNote('note-1', 'user-1', {
      title: '<b>Updated title</b><script>alert(1)</script>',
    });

    expect(noteRepoStub.findByIdAndUser.called).to.be.false;
    expect(
      noteRepoStub.updateNote.calledOnceWithExactly('note-1', 'user-1', {
        title: 'Updated title',
      })
    ).to.be.true;
    expect(updated.title).to.equal('Updated title');
    expect(updated.content).to.equal('<p>Concurrent content</p>');
    expect(socketSpy.calledOnceWith('user-1', 'note:updated')).to.be.true;
  });

  it('enforces ownership when updating a note owned by another user', async () => {
    noteRepoStub.updateNote.resolves(null);

    try {
      await noteService.updateNote('note-99', 'attacker-user', { title: 'Hacked' });
      expect.fail('Expected updateNote to throw');
    } catch (err) {
      const appErr = err as AppError;
      expect(appErr.statusCode).to.equal(404);
      expect(appErr.code).to.equal('NOTE_NOT_FOUND');
    }
  });

  it('deletes user note and emits note:deleted socket event', async () => {
    noteRepoStub.deleteNote.resolves(true);

    const res = await noteService.deleteNote('note-1', 'user-1');

    expect(res).to.deep.equal({ id: 'note-1' });
    expect(socketSpy.calledOnceWith('user-1', 'note:deleted', { id: 'note-1' })).to.be.true;
  });
});
