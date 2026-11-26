
import { PoolConnection } from 'mysql2/promise';
import { expect } from 'chai';
import sinon from 'sinon';
import NoteRepository, { NoteDatabasePool } from '../src/repositories/noteRepository';

describe('NoteRepository (Data Access Layer)', () => {
  it('executes parameterized SQL query scoped by user_id, tag, and search', async () => {
    const executeStub = sinon.stub().resolves([[{ id: 'n1', title: 'Weekly planning' }]]);
    const dbStub: NoteDatabasePool = {
      execute: executeStub as NoteDatabasePool['execute'],
    };
    const repo = new NoteRepository(dbStub);

    const rows = await repo.findAllByUser('user-1', { search: 'Weekly', tag: 'Work' });

    expect(rows).to.have.lengthOf(1);
    const [sql, params] = executeStub.firstCall.args as [string, string[]];
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
      execute: executeStub as NoteDatabasePool['execute'],
    };

    const repo = new NoteRepository(dbStub);

    const row = await repo.updateNote('n1', 'user-1', { title: 'Updated title' });

    expect(row).to.deep.equal(updatedRow);

    const [updateSql, updateParams] = executeStub.firstCall.args as [string, string[]];
    expect(updateSql).to.include('SET title = ?');
    expect(updateSql).to.not.include('content = ?');
    expect(updateSql).to.not.include('tag = ?');
    expect(updateSql).to.not.include('color = ?');
    expect(updateParams).to.deep.equal(['Updated title', 'n1', 'user-1']);
  });

  it('reads imported notes on the transaction connection before committing', async () => {
    const fetchedRows = [
      {
        id: 'n1',
        user_id: 'user-1',
        title: 'Imported note',
      },
    ];

    const connExecuteStub = sinon
      .stub()
      .onFirstCall()
      .resolves([{ affectedRows: 1 }])
      .onSecondCall()
      .resolves([fetchedRows]);

    const beginTransactionStub = sinon.stub().resolves();
    const commitStub = sinon.stub().resolves();
    const rollbackStub = sinon.stub().resolves();
    const releaseStub = sinon.stub();

    const connectionStub = {
      execute: connExecuteStub,
      beginTransaction: beginTransactionStub,
      commit: commitStub,
      rollback: rollbackStub,
      release: releaseStub,
    } as unknown as PoolConnection;

    const poolExecuteStub = sinon.stub();

    const dbStub: NoteDatabasePool = {
      execute: poolExecuteStub as NoteDatabasePool['execute'],
      getConnection: sinon.stub().resolves(connectionStub),
    };

    const repo = new NoteRepository(dbStub);

    const result = await repo.bulkInsertNotes('user-1', [
      {
        id: 'n1',
        title: 'Imported note',
        content: '<p>Body</p>',
        tag: 'Personal',
        color: '#FFFFFF',
      },
    ]);

    expect(result).to.deep.equal(fetchedRows);
    expect(poolExecuteStub.called).to.be.false;
    expect(connExecuteStub.calledTwice).to.be.true;

    // second execute call must happen before commit
    expect(connExecuteStub.secondCall.calledBefore(commitStub.firstCall)).to.be.true;

    expect(commitStub.calledOnce).to.be.true;
    expect(releaseStub.calledOnce).to.be.true;
  });

  it('rolls back transaction if reading imported notes fails before commit', async () => {
    const connExecuteStub = sinon
      .stub()
      .onFirstCall()
      .resolves([{ affectedRows: 1 }])
      .onSecondCall()
      .rejects(new Error('SELECT failure'));

    const commitStub = sinon.stub().resolves();
    const rollbackStub = sinon.stub().resolves();
    const releaseStub = sinon.stub();

    const connectionStub = {
      execute: connExecuteStub,
      beginTransaction: sinon.stub().resolves(),
      commit: commitStub,
      rollback: rollbackStub,
      release: releaseStub,
    } as unknown as PoolConnection;

    const dbStub: NoteDatabasePool = {
      execute: sinon.stub() as unknown as NoteDatabasePool['execute'],
      getConnection: sinon.stub().resolves(connectionStub),
    };

    const repo = new NoteRepository(dbStub);

    try {
      await repo.bulkInsertNotes('user-1', [
        {
          id: 'n1',
          title: 'Imported note',
          content: '<p>Body</p>',
          tag: 'Personal',
          color: '#FFFFFF',
        },
      ]);

      expect.fail('Expected bulkInsertNotes to throw');
    } catch (err) {
      expect((err as Error).message).to.equal('SELECT failure');
      expect(commitStub.called).to.be.false;
      expect(rollbackStub.calledOnce).to.be.true;
      expect(releaseStub.calledOnce).to.be.true;
    }
  });
});
