import { expect } from 'chai';
import sinon, { SinonStub } from 'sinon';
import bcrypt from 'bcrypt';
import AuthService, { UserRepositoryContract } from '../src/services/authService';
import AppError from '../src/utils/AppError';
import { CreateUserRecord, PublicUserRow, UserRow } from '../src/types/models';

interface UserRepoStub extends UserRepositoryContract {
  findByEmail: SinonStub;
  findById: SinonStub;
  createUser: SinonStub;
}

describe('AuthService', () => {
  let userRepoStub: UserRepoStub;
  let authService: AuthService;

  beforeEach(() => {
    userRepoStub = {
      findByEmail: sinon.stub(),
      findById: sinon.stub(),
      createUser: sinon.stub(),
    };
    authService = new AuthService(userRepoStub);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('registers a new user, hashes password, and returns user + JWT token', async () => {
    userRepoStub.findByEmail.resolves(null);
    userRepoStub.createUser.callsFake(
      async ({ id, fullName, email }: CreateUserRecord): Promise<PublicUserRow> =>
        ({
          id,
          full_name: fullName,
          email,
          created_at: new Date('2026-01-01T00:00:00Z'),
          updated_at: new Date('2026-01-01T00:00:00Z'),
        }) as PublicUserRow
    );

    const result = await authService.register({
      fullName: 'Alex Morgan',
      email: 'ALEX@EXAMPLE.COM',
      password: 'Password123!',
    });

    expect(result.user.email).to.equal('alex@example.com');
    expect(result.user.fullName).to.equal('Alex Morgan');
    expect(result.token).to.be.a('string');
    expect(userRepoStub.createUser.calledOnce).to.be.true;
  });

  it('throws 409 EMAIL_EXISTS if email is already registered', async () => {
    userRepoStub.findByEmail.resolves({
      id: 'existing-id',
      email: 'alex@example.com',
    } as UserRow);

    try {
      await authService.register({
        fullName: 'Alex Morgan',
        email: 'alex@example.com',
        password: 'Password123!',
      });
      expect.fail('Expected register to throw');
    } catch (err) {
      const appErr = err as AppError;
      expect(appErr.statusCode).to.equal(409);
      expect(appErr.code).to.equal('EMAIL_EXISTS');
    }
  });

  it('authenticates valid user credentials and returns JWT token', async () => {
    const hash = await bcrypt.hash('SecretPass123', 10);
    userRepoStub.findByEmail.resolves({
      id: 'user-1',
      full_name: 'Alex Morgan',
      email: 'alex@example.com',
      password_hash: hash,
      created_at: new Date(),
      updated_at: new Date(),
    } as UserRow);

    const result = await authService.login({
      email: 'alex@example.com',
      password: 'SecretPass123',
    });

    expect(result.user.id).to.equal('user-1');
    expect(result.token).to.be.a('string');
  });

  it('throws 401 INVALID_CREDENTIALS when password does not match', async () => {
    const hash = await bcrypt.hash('CorrectPass123', 10);
    userRepoStub.findByEmail.resolves({
      id: 'user-1',
      full_name: 'Alex Morgan',
      email: 'alex@example.com',
      password_hash: hash,
      created_at: new Date(),
      updated_at: new Date(),
    } as UserRow);

    try {
      await authService.login({ email: 'alex@example.com', password: 'WrongPassword' });
      expect.fail('Expected login to throw');
    } catch (err) {
      const appErr = err as AppError;
      expect(appErr.statusCode).to.equal(401);
      expect(appErr.code).to.equal('INVALID_CREDENTIALS');
    }
  });
});
