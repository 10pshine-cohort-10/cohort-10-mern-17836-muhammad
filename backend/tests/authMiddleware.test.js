const { expect } = require('chai');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const config = require('../src/config/env');
const { authenticateToken } = require('../src/middlewares/authMiddleware');

describe('Auth Middleware', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('calls next with 401 AppError when Authorization header is missing', () => {
    const req = { headers: {} };
    const next = sinon.spy();

    authenticateToken(req, {}, next);

    expect(next.calledOnce).to.be.true;
    const err = next.firstCall.args[0];
    expect(err.statusCode).to.equal(401);
    expect(err.code).to.equal('UNAUTHORIZED');
  });

  it('attaches decoded user to req.user and calls next() for valid JWT', () => {
    const token = jwt.sign(
      { sub: 'user-123', email: 'alex@example.com', fullName: 'Alex Morgan' },
      config.jwt.secret
    );
    const req = { headers: { authorization: `Bearer ${token}` } };
    const next = sinon.spy();

    authenticateToken(req, {}, next);

    expect(next.calledOnceWithExactly()).to.be.true;
    expect(req.user).to.deep.equal({
      id: 'user-123',
      email: 'alex@example.com',
      fullName: 'Alex Morgan',
    });
  });

  it('calls next with 401 INVALID_TOKEN when JWT is tampered', () => {
    const req = { headers: { authorization: 'Bearer invalid.jwt.token' } };
    const next = sinon.spy();

    authenticateToken(req, {}, next);

    expect(next.calledOnce).to.be.true;
    const err = next.firstCall.args[0];
    expect(err.statusCode).to.equal(401);
    expect(err.code).to.equal('INVALID_TOKEN');
  });
});
