const { expect } = require('chai');
const sinon = require('sinon');
const NoteService = require('../src/services/noteService');

describe('NoteService', () => {
  let noteRepoStub;
  let socketSpy;
  let noteService;

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
    noteRepoStub.createNote.callsFake(async (data) => ({
      ...data,
      user_id: data.userId,
      created_at: new Date(),
      updated_at: new Date(),
    }));

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

  it('enforces ownership when updating a note owned by another user', async () => {
    noteRepoStub.findByIdAndUser.resolves(null);

    try {
      await noteService.updateNote('note-99', 'attacker-user', { title: 'Hacked' });
      expect.fail('Expected updateNote to throw');
    } catch (err) {
      expect(err.statusCode).to.equal(404);
      expect(err.code).to.equal('NOTE_NOT_FOUND');
    }
  });

  it('deletes user note and emits note:deleted socket event', async () => {
    noteRepoStub.deleteNote.resolves(true);

    const res = await noteService.deleteNote('note-1', 'user-1');

    expect(res).to.deep.equal({ id: 'note-1' });
    expect(socketSpy.calledOnceWith('user-1', 'note:deleted', { id: 'note-1' })).to.be.true;
  });
});
