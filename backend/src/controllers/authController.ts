import { Request, Response, RequestHandler } from 'express';
import asyncHandler from '../utils/asyncHandler';
import logger from '../config/logger';
import AppError from '../utils/AppError';
import { AuthResult, LoginInput, PublicUserResponse, RegisterInput } from '../types/models';

export interface AuthServiceContract {
  register(input: RegisterInput): Promise<AuthResult>;
  login(input: LoginInput): Promise<AuthResult>;
  getProfile(userId: string): Promise<PublicUserResponse>;
}

export default class AuthController {
  private readonly authService: AuthServiceContract;

  public readonly register: RequestHandler;
  public readonly login: RequestHandler;
  public readonly getProfile: RequestHandler;
  public readonly logout: RequestHandler;

  constructor(authService: AuthServiceContract) {
    this.authService = authService;

    this.register = asyncHandler(async (req: Request, res: Response) => {
      const result = await this.authService.register(req.body as RegisterInput);
      res.status(201).json({
        success: true,
        data: result,
      });
    });

    this.login = asyncHandler(async (req: Request, res: Response) => {
      const result = await this.authService.login(req.body as LoginInput);
      res.status(200).json({
        success: true,
        data: result,
      });
    });

    this.getProfile = asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        throw new AppError('Authentication token is required', 401, 'UNAUTHORIZED');
      }
      const user = await this.authService.getProfile(req.user.id);
      res.status(200).json({
        success: true,
        data: { user },
      });
    });

    this.logout = asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        throw new AppError('Authentication token is required', 401, 'UNAUTHORIZED');
      }
      logger.info({ userId: req.user.id }, 'User logged out');
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    });
  }
}
