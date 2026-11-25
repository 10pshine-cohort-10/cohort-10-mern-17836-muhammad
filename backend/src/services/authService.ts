import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import config from '../config/env';
import AppError from '../utils/AppError';
import { sanitizePlainText } from '../utils/sanitizer';
import logger from '../config/logger';
import {
  AuthResult,
  CreateUserRecord,
  LoginInput,
  PublicUserResponse,
  PublicUserRow,
  RegisterInput,
  UserRow,
} from '../types/models';

const BCRYPT_SALT_ROUNDS = 12;

export interface UserRepositoryContract {
  findByEmail(email: string): Promise<UserRow | null>;
  findById(id: string): Promise<PublicUserRow | null>;
  createUser(record: CreateUserRecord): Promise<PublicUserRow | null>;
}

export default class AuthService {
  private readonly userRepository: UserRepositoryContract;

  constructor(userRepository: UserRepositoryContract) {
    this.userRepository = userRepository;
  }

  generateAccessToken(user: Pick<PublicUserRow, 'id' | 'email' | 'full_name'>): string {
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

  formatUserResponse(user: PublicUserRow | UserRow): PublicUserResponse {
    return {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      createdAt: user.created_at,
    };
  }

  async register({ fullName, email, password }: RegisterInput): Promise<AuthResult> {
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

    if (!createdUser) {
      throw new AppError('Failed to create user account', 500, 'USER_CREATION_FAILED');
    }

    const token = this.generateAccessToken(createdUser);
    logger.info({ userId: createdUser.id, email: normalizedEmail }, 'User registered successfully');

    return {
      user: this.formatUserResponse(createdUser),
      token,
    };
  }

  async login({ email, password }: LoginInput): Promise<AuthResult> {
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

  async getProfile(userId: string): Promise<PublicUserResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User profile not found', 404, 'USER_NOT_FOUND');
    }
    return this.formatUserResponse(user);
  }
}
