const { expect } = require('chai');
const sinon = require('sinon');
const NoteRepository = require('../src/repositories/noteRepository');

describe('NoteRepository (Data Access Layer)', () => {
  it('executes parameterized SQL query scoped by user_id, tag, and search', async () => {
    const dbStub = {
      execute: sinon.stub().resolves([[{ id: 'n1', title: 'Weekly planning' }]]),
    };
    const repo = new NoteRepository(dbStub);

    const rows = await repo.findAllByUser('user-1', { search: 'Weekly', tag: 'Work' });

    expect(rows).to.have.lengthOf(1);
    const [sql, params] = dbStub.execute.firstCall.args;
    expect(sql).to.include('WHERE user_id = ? AND tag = ? AND (title LIKE ? OR content LIKE ?)');
    expect(params).to.deep.equal(['user-1', 'Work', '%Weekly%', '%Weekly%']);
  });
});
