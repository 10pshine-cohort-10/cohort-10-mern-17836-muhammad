const asyncHandler = require('../utils/asyncHandler');
const logger = require('../config/logger');

class AuthController {
  constructor(authService) {
    this.authService = authService;

    this.register = asyncHandler(async (req, res) => {
      const result = await this.authService.register(req.body);
      res.status(201).json({
        success: true,
        data: result,
      });
    });

    this.login = asyncHandler(async (req, res) => {
      const result = await this.authService.login(req.body);
      res.status(200).json({
        success: true,
        data: result,
      });
    });

    this.getProfile = asyncHandler(async (req, res) => {
      const user = await this.authService.getProfile(req.user.id);
      res.status(200).json({
        success: true,
        data: { user },
      });
    });

    this.logout = asyncHandler(async (req, res) => {
      logger.info({ userId: req.user.id }, 'User logged out');
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    });
  }
}

module.exports = AuthController;
