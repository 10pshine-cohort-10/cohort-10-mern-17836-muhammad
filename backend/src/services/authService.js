const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/env');
const AppError = require('../utils/AppError');
const { sanitizePlainText } = require('../utils/sanitizer');
const logger = require('../config/logger');

const BCRYPT_SALT_ROUNDS = 12;

class AuthService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  generateAccessToken(user) {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        fullName: user.full_name,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  formatUserResponse(user) {
    return {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      createdAt: user.created_at,
    };
  }

  async register({ fullName, email, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanedName = sanitizePlainText(fullName);

    const existingUser = await this.userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      logger.warn({ email: normalizedEmail }, 'Registration attempted with existing email');
      throw new AppError('An account with this email already exists', 409, 'EMAIL_EXISTS');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const createdUser = await this.userRepository.createUser({
      id: uuidv4(),
      fullName: cleanedName,
      email: normalizedEmail,
      passwordHash,
    });

    const token = this.generateAccessToken(createdUser);
    logger.info({ userId: createdUser.id, email: normalizedEmail }, 'User registered successfully');

    return {
      user: this.formatUserResponse(createdUser),
      token,
    };
  }

  async login({ email, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(normalizedEmail);

    if (!user) {
      logger.warn({ email: normalizedEmail }, 'Failed login attempt: user not found');
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      logger.warn({ userId: user.id }, 'Failed login attempt: incorrect password');
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const token = this.generateAccessToken(user);
    logger.info({ userId: user.id }, 'User logged in successfully');

    return {
      user: this.formatUserResponse(user),
      token,
    };
  }

  async getProfile(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User profile not found', 404, 'USER_NOT_FOUND');
    }
    return this.formatUserResponse(user);
  }
}

module.exports = AuthService;
