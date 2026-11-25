import { Request, Response } from 'express';
import { expect } from 'chai';
import sinon, { SinonStub } from 'sinon';
import NoteController, { NoteServiceContract } from '../src/controllers/noteController';
import { NoteResponse } from '../src/types/models';

interface NoteServiceStub extends NoteServiceContract {
  listNotes: SinonStub;
  getNoteById: SinonStub;
  createNote: SinonStub;
  updateNote: SinonStub;
  deleteNote: SinonStub;
  importNotes: SinonStub;
}

describe('NoteController', () => {
  let noteServiceStub: NoteServiceStub;
  let controller: NoteController;

  beforeEach(() => {
    noteServiceStub = {
      listNotes: sinon.stub(),
      getNoteById: sinon.stub(),
      createNote: sinon.stub(),
      updateNote: sinon.stub(),
      deleteNote: sinon.stub(),
      importNotes: sinon.stub(),
    };
    controller = new NoteController(noteServiceStub);
  });

  it('listNotes passes authenticated user id and query filters to service', async () => {
    const mockNotes: Partial<NoteResponse>[] = [{ id: 'n1', title: 'Weekly planning' }];
    noteServiceStub.listNotes.resolves(mockNotes);

    const req = {
      user: { id: 'user-1', email: 'alex@example.com', fullName: 'Alex Morgan' },
      query: { search: 'Weekly', tag: 'Work' },
    } as unknown as Request;

    const statusStub = sinon.stub().returnsThis();
    const jsonSpy = sinon.spy();
    const res = {
      status: statusStub,
      json: jsonSpy,
    } as unknown as Response;

    await controller.listNotes(req, res, sinon.spy());

    expect(
      noteServiceStub.listNotes.calledOnceWith('user-1', {
        search: 'Weekly',
        tag: 'Work',
        dateFrom: '',
        dateTo: '',
      })
    ).to.be.true;
    expect(statusStub.calledOnceWith(200)).to.be.true;
    expect(jsonSpy.calledOnceWith({ success: true, data: { notes: mockNotes } })).to.be.true;
  });
});
