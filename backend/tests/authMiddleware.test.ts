import { Request, Response } from 'express';
import { expect } from 'chai';
import sinon, { SinonSpy } from 'sinon';
import jwt from 'jsonwebtoken';
import config from '../src/config/env';
import { authenticateToken } from '../src/middlewares/authMiddleware';
import AppError from '../src/utils/AppError';

describe('Auth Middleware', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('calls next with 401 AppError when Authorization header is missing', () => {
    const req = { headers: {} } as Request;
    const res = {} as Response;
    const next: SinonSpy = sinon.spy();

    authenticateToken(req, res, next);

    expect(next.calledOnce).to.be.true;
    const err = next.firstCall.args[0] as AppError;
    expect(err.statusCode).to.equal(401);
    expect(err.code).to.equal('UNAUTHORIZED');
  });

  it('attaches decoded user to req.user and calls next() for valid JWT', () => {
    const token = jwt.sign(
      { sub: 'user-123', email: 'alex@example.com', fullName: 'Alex Morgan' },
      config.jwt.secret
    );
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = {} as Response;
    const next: SinonSpy = sinon.spy();

    authenticateToken(req, res, next);

    expect(next.calledOnceWithExactly()).to.be.true;
    expect(req.user).to.deep.equal({
      id: 'user-123',
      email: 'alex@example.com',
      fullName: 'Alex Morgan',
    });
  });

  it('calls next with 401 INVALID_TOKEN when JWT is tampered', () => {
    const req = { headers: { authorization: 'Bearer invalid.jwt.token' } } as Request;
    const res = {} as Response;
    const next: SinonSpy = sinon.spy();

    authenticateToken(req, res, next);

    expect(next.calledOnce).to.be.true;
    const err = next.firstCall.args[0] as AppError;
    expect(err.statusCode).to.equal(401);
    expect(err.code).to.equal('INVALID_TOKEN');
  });
});
