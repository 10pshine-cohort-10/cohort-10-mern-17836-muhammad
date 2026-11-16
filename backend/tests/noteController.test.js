const { expect } = require('chai');
const sinon = require('sinon');
const NoteController = require('../src/controllers/noteController');

describe('NoteController', () => {
  let noteServiceStub;
  let controller;

  beforeEach(() => {
    noteServiceStub = {
      listNotes: sinon.stub(),
      createNote: sinon.stub(),
      updateNote: sinon.stub(),
      deleteNote: sinon.stub(),
    };
    controller = new NoteController(noteServiceStub);
  });

  it('listNotes passes authenticated user id and query filters to service', async () => {
    const mockNotes = [{ id: 'n1', title: 'Weekly planning' }];
    noteServiceStub.listNotes.resolves(mockNotes);

    const req = {
      user: { id: 'user-1' },
      query: { search: 'Weekly', tag: 'Work' },
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
    };

    await controller.listNotes(req, res, sinon.spy());

    expect(noteServiceStub.listNotes.calledOnceWith('user-1', {
      search: 'Weekly',
      tag: 'Work',
      dateFrom: '',
      dateTo: '',
    })).to.be.true;
    expect(res.status.calledOnceWith(200)).to.be.true;
    expect(res.json.calledOnceWith({ success: true, data: { notes: mockNotes } })).to.be.true;
  });
});
