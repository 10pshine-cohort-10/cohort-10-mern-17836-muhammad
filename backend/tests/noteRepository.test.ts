import { expect } from 'chai';
import sinon from 'sinon';
import NoteRepository, { NoteDatabasePool } from '../src/repositories/noteRepository';

describe('NoteRepository (Data Access Layer)', () => {
  it('executes parameterized SQL query scoped by user_id, tag, and search', async () => {
    const executeStub = sinon.stub().resolves([[{ id: 'n1', title: 'Weekly planning' }]]);
    const dbStub: NoteDatabasePool = {
      execute: executeStub,
    };
    const repo = new NoteRepository(dbStub);

    const rows = await repo.findAllByUser('user-1', { search: 'Weekly', tag: 'Work' });

    expect(rows).to.have.lengthOf(1);
    const [sql, params] = executeStub.firstCall.args as [string, unknown[]];
    expect(sql).to.include('WHERE user_id = ? AND tag = ? AND (title LIKE ? OR content LIKE ?)');
    expect(params).to.deep.equal(['user-1', 'Work', '%Weekly%', '%Weekly%']);
  });

  it('updates only supplied columns atomically in updateNote', async () => {
    const updatedRow = {
      id: 'n1',
      user_id: 'user-1',
      title: 'Updated title',
      content: '<p>Existing content</p>',
      tag: 'Work',
      color: '#FFFFFF',
    };
    const executeStub = sinon
      .stub()
      .onFirstCall()
      .resolves([{ affectedRows: 1 }])
      .onSecondCall()
      .resolves([[updatedRow]]);
    const dbStub: NoteDatabasePool = {
      execute: executeStub,
    };
    const repo = new NoteRepository(dbStub);

    const row = await repo.updateNote('n1', 'user-1', { title: 'Updated title' });

    expect(row).to.deep.equal(updatedRow);
    const [updateSql, updateParams] = executeStub.firstCall.args as [string, unknown[]];
    expect(updateSql).to.include('SET title = ?');
    expect(updateSql).to.not.include('content = ?');
    expect(updateSql).to.not.include('tag = ?');
    expect(updateSql).to.not.include('color = ?');
    expect(updateParams).to.deep.equal(['Updated title', 'n1', 'user-1']);
  });
});
