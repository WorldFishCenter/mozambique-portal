/**
 * Authentication Controller
 * Handles authentication-related HTTP requests
 */

const { PasswordService, ValidationService, TokenService, EmailService } = require('../services');
const { initializeModels } = require('../models');
const { 
  handleFailedLogin, 
  handleSuccessfulLogin, 
  handleFailedAttempt, 
  handleSuccessfulAttempt,
  requireCaptcha,
  clearCaptchaRequirement 
} = require('../middleware/rateLimitMiddleware');

class AuthController {
  constructor(db) {
    this.db = db;
    this.models = initializeModels(db);
    this.passwordService = new PasswordService();
    this.validationService = new ValidationService();
    this.tokenService = new TokenService();
    this.emailService = new EmailService();
  }

  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(req, res) {
    try {
      const { username, email, password, profile } = req.body;
      const clientIP = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      // Step 1: Validate input data
      const validationResult = this.validationService.validateRegistrationData({
        username,
        email,
        password,
        profile,
      });

      if (!validationResult.isValid) {
        console.error('Registration validation failed:', {
          errors: validationResult.errors,
          receivedData: { username, email, hasPassword: !!password, profile }
        });
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationResult.errors,
        });
      }

      const { sanitized } = validationResult;

      // Step 2: Check if user already exists
      const existingUserByUsername = await this.models.User.findByUsername(sanitized.username);
      if (existingUserByUsername) {
        return res.status(409).json({
          success: false,
          error: 'Registration failed',
          details: ['Username already exists'],
        });
      }

      const existingUserByEmail = await this.models.User.findByEmail(sanitized.email);
      if (existingUserByEmail) {
        return res.status(409).json({
          success: false,
          error: 'Registration failed',
          details: ['Email already exists'],
        });
      }

      // Step 3: Create user account
      const newUser = await this.models.User.create({
        username: sanitized.username,
        email: sanitized.email,
        password: sanitized.password,
        profile: sanitized.profile || {},
      });

      // Step 4: Generate authentication tokens
      const tokenPair = this.tokenService.generateTokenPair(newUser, {
        ipAddress: clientIP,
      });

      // Step 5: Create session record
      await this.models.Session.create({
        userId: newUser._id,
        refreshToken: tokenPair.refreshToken.token,
        accessToken: tokenPair.accessToken.token,
        expiresAt: tokenPair.refreshToken.expiresAt,
        ipAddress: clientIP,
        userAgent: userAgent,
      });

      // Step 6: Return success response (without sensitive data)
      const sanitizedUser = this.models.User.sanitizeUser(newUser);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: sanitizedUser,
        tokens: {
          accessToken: tokenPair.accessToken.token,
          refreshToken: tokenPair.refreshToken.token,
          expiresAt: tokenPair.accessToken.expiresAt,
          tokenType: 'Bearer',
        },
      });

      // Log successful registration
      console.log(`User registered successfully: ${sanitized.username} (${sanitized.email})`);

    } catch (error) {
      console.error('Registration error:', error);

      // Handle specific database errors
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: 'Registration failed',
          details: [error.message],
        });
      }

      // Generic error response
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Registration failed due to server error',
      });
    }
  }

  /**
   * User login
   * POST /api/auth/login
   */
  async login(req, res) {
    try {
      const { username, email, password } = req.body;
      const clientIP = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      // Step 1: Validate input data
      const validationResult = this.validationService.validateLoginData({
        username,
        email,
        password,
      });

      if (!validationResult.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input',
          details: validationResult.errors,
        });
      }

      const { sanitized } = validationResult;

      // Step 2: Find user by username or email
      let user = null;
      if (sanitized.username) {
        user = await this.models.User.findByUsername(sanitized.username);
      } else if (sanitized.email) {
        user = await this.models.User.findByEmail(sanitized.email);
      }

      if (!user) {
        // Handle failed login attempt
        const identifier = sanitized.username || sanitized.email;
        handleFailedLogin(req, identifier);
        handleFailedAttempt(req);
        requireCaptcha(req);
        
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          message: 'Username or password is incorrect',
        });
      }

      // Step 3: Verify password
      const passwordValid = await this.passwordService.verifyPassword(
        sanitized.password,
        user.passwordHash
      );

      if (!passwordValid) {
        // Handle failed login attempt
        const identifier = sanitized.username || sanitized.email;
        handleFailedLogin(req, identifier);
        handleFailedAttempt(req);
        requireCaptcha(req);
        
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          message: 'Username or password is incorrect',
        });
      }

      // Clear rate limiting on successful login
      handleSuccessfulLogin(req);
      handleSuccessfulAttempt(req);
      clearCaptchaRequirement(req);

      // Step 4: Update last login timestamp
      await this.models.User.updateLastLogin(user._id);

      // Step 5: Clean up old sessions and enforce session limits
      await this.models.Session.enforceMaxSessions(user._id);

      // Step 6: Generate authentication tokens
      const tokenPair = this.tokenService.generateTokenPair(user, {
        ipAddress: clientIP,
      });

      // Step 7: Create session record
      await this.models.Session.create({
        userId: user._id,
        refreshToken: tokenPair.refreshToken.token,
        accessToken: tokenPair.accessToken.token,
        expiresAt: tokenPair.refreshToken.expiresAt,
        ipAddress: clientIP,
        userAgent: userAgent,
      });

      // Step 8: Return success response
      const sanitizedUser = this.models.User.sanitizeUser(user);

      res.json({
        success: true,
        message: 'Login successful',
        user: sanitizedUser,
        tokens: {
          accessToken: tokenPair.accessToken.token,
          refreshToken: tokenPair.refreshToken.token,
          expiresAt: tokenPair.accessToken.expiresAt,
          tokenType: 'Bearer',
        },
      });

      // Log successful login
      console.log(`User logged in successfully: ${user.username} from ${clientIP}`);

    } catch (error) {
      console.error('Login error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Login failed due to server error',
      });
    }
  }

  /**
   * User logout
   * POST /api/auth/logout
   */
  async logout(req, res) {
    try {
      const authHeader = req.get('Authorization');
      const accessToken = this.tokenService.extractTokenFromHeader(authHeader);

      if (!accessToken) {
        return res.status(400).json({
          success: false,
          error: 'Missing token',
          message: 'Authorization token is required',
        });
      }

      // Verify and decode the access token
      const tokenVerification = this.tokenService.verifyAccessToken(accessToken);
      if (!tokenVerification.isValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token',
          message: 'Authorization token is invalid',
        });
      }

      const { userId, sessionId } = tokenVerification.payload;

      // Invalidate the specific session
      if (sessionId) {
        // Find session by session ID and invalidate it
        const sessions = await this.models.Session.findByUserId(userId);
        const currentSession = sessions.find(s => 
          s.accessToken === this.models.Session.hashToken(accessToken)
        );
        
        if (currentSession) {
          await this.models.Session.invalidate(currentSession._id);
        }
      } else {
        // Fallback: invalidate by access token hash
        const hashedToken = this.models.Session.hashToken(accessToken);
        await this.models.Session.collection.updateOne(
          { accessToken: hashedToken },
          { $set: { isActive: false } }
        );
      }

      res.json({
        success: true,
        message: 'Logout successful',
      });

      console.log(`User logged out: ${userId}`);

    } catch (error) {
      console.error('Logout error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Logout failed due to server error',
      });
    }
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  async refresh(req, res) {
    try {
      const { refreshToken } = req.body;
      const clientIP = req.ip || req.connection.remoteAddress;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Missing refresh token',
          message: 'Refresh token is required',
        });
      }

      // Step 1: Verify refresh token
      const tokenVerification = this.tokenService.verifyRefreshToken(refreshToken);
      if (!tokenVerification.isValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token',
          message: 'Refresh token is invalid or expired',
        });
      }

      const { userId } = tokenVerification.payload;

      // Step 2: Find user
      const user = await this.models.User.findById(userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found',
          message: 'User associated with token not found',
        });
      }

      // Step 3: Find and validate session
      const session = await this.models.Session.findByRefreshToken(refreshToken);
      if (!session || !session.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Invalid session',
          message: 'Session is invalid or expired',
        });
      }

      // Step 4: Generate new token pair
      const newTokenPair = this.tokenService.generateTokenPair(user, {
        sessionId: session._id.toString(),
        ipAddress: clientIP,
      });

      // Step 5: Update session with new tokens
      await this.models.Session.updateTokens(
        session._id,
        newTokenPair.refreshToken.token,
        newTokenPair.accessToken.token,
        newTokenPair.refreshToken.expiresAt
      );

      // Step 6: Return new tokens
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        tokens: {
          accessToken: newTokenPair.accessToken.token,
          refreshToken: newTokenPair.refreshToken.token,
          expiresAt: newTokenPair.accessToken.expiresAt,
          tokenType: 'Bearer',
        },
      });

      console.log(`Token refreshed for user: ${userId}`);

    } catch (error) {
      console.error('Token refresh error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Token refresh failed due to server error',
      });
    }
  }

  /**
   * Verify token
   * GET /api/auth/verify-token
   */
  async verifyToken(req, res) {
    try {
      const authHeader = req.get('Authorization');
      const accessToken = this.tokenService.extractTokenFromHeader(authHeader);

      if (!accessToken) {
        return res.status(400).json({
          success: false,
          error: 'Missing token',
          message: 'Authorization token is required',
        });
      }

      // Verify the access token
      const tokenVerification = this.tokenService.verifyAccessToken(accessToken);
      if (!tokenVerification.isValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token',
          message: tokenVerification.error,
        });
      }

      const { userId } = tokenVerification.payload;

      // Verify user still exists and is active
      const user = await this.models.User.findById(userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found',
          message: 'User associated with token not found',
        });
      }

      // Return token information
      const tokenInfo = this.tokenService.getTokenInfo(accessToken);
      const sanitizedUser = this.models.User.sanitizeUser(user);

      res.json({
        success: true,
        message: 'Token is valid',
        user: sanitizedUser,
        tokenInfo: {
          issuedAt: tokenInfo.issuedAt,
          expiresAt: tokenInfo.expiresAt,
          timeUntilExpiry: tokenInfo.timeUntilExpiry,
        },
      });

    } catch (error) {
      console.error('Token verification error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Token verification failed due to server error',
      });
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  async getCurrentUser(req, res) {
    try {
      // User should be attached to request by auth middleware
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      const sanitizedUser = this.models.User.sanitizeUser(user);

      res.json({
        success: true,
        user: sanitizedUser,
      });

    } catch (error) {
      console.error('Get current user error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to get user information',
      });
    }
  }

  /**
   * Get user's active sessions
   * GET /api/auth/sessions
   */
  async getUserSessions(req, res) {
    try {
      // User should be attached to request by auth middleware
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      // Get all active sessions for the user
      const sessions = await this.models.Session.findByUserId(user._id);
      
      // Filter only active sessions and sanitize sensitive data
      const activeSessions = sessions
        .filter(session => session.isActive && session.expiresAt > new Date())
        .map(session => ({
          id: session._id,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          isCurrent: session.accessToken === this.models.Session.hashToken(
            this.tokenService.extractTokenFromHeader(req.get('Authorization'))
          ),
        }));

      res.json({
        success: true,
        sessions: activeSessions,
        totalSessions: activeSessions.length,
      });

    } catch (error) {
      console.error('Get user sessions error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to get user sessions',
      });
    }
  }

  /**
   * Request password reset
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const clientIP = req.ip || req.connection.remoteAddress;

      // Step 1: Validate input data
      const validationResult = this.validationService.validatePasswordResetRequest({ email });

      if (!validationResult.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationResult.errors,
        });
      }

      const { sanitized } = validationResult;

      // Step 2: Find user by email
      const user = await this.models.User.findByEmail(sanitized.email);

      // Always return success to prevent email enumeration attacks
      const successResponse = {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      };

      if (!user) {
        // Don't reveal that the email doesn't exist
        console.log(`Password reset requested for non-existent email: ${sanitized.email}`);
        return res.json(successResponse);
      }

      // Step 3: Check rate limiting for password reset requests
      const rateLimitCheck = await this.models.PasswordReset.checkRateLimit(user._id);
      if (!rateLimitCheck.isAllowed) {
        console.log(`Password reset rate limit exceeded for user: ${user.username}`);
        
        // Still return success to prevent enumeration, but don't send email
        return res.json({
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.',
          // Optionally include rate limit info in development
          ...(process.env.NODE_ENV === 'development' && {
            rateLimitInfo: {
              attemptsUsed: rateLimitCheck.attemptsUsed,
              maxAttempts: rateLimitCheck.maxAttempts,
              nextAllowedAt: rateLimitCheck.nextAllowedAt,
            }
          })
        });
      }

      // Step 4: Create password reset token
      const resetTokenData = await this.models.PasswordReset.create({
        userId: user._id,
        ipAddress: clientIP,
      });

      // Step 5: Send password reset email
      try {
        const emailResult = await this.emailService.sendPasswordResetEmail({
          to: user.email,
          resetToken: resetTokenData.plainToken,
          username: user.username,
          resetUrl: process.env.VITE_API_URL ? 
            `${process.env.VITE_API_URL}/reset-password` : 
            'http://localhost:3000/reset-password',
        });

        if (!emailResult.success) {
          console.error('Failed to send password reset email:', emailResult.error);
          
          // Invalidate the reset token if email failed
          await this.models.PasswordReset.markAsUsed(resetTokenData.plainToken);
          
          return res.status(500).json({
            success: false,
            error: 'Email delivery failed',
            message: 'Unable to send password reset email. Please try again later.',
          });
        }

        console.log(`Password reset email sent successfully to ${user.email} (${user.username})`);
        
      } catch (emailError) {
        console.error('Email service error:', emailError);
        
        // Invalidate the reset token if email failed
        await this.models.PasswordReset.markAsUsed(resetTokenData.plainToken);
        
        return res.status(500).json({
          success: false,
          error: 'Email service error',
          message: 'Unable to send password reset email. Please try again later.',
        });
      }

      // Step 6: Return success response
      res.json(successResponse);

    } catch (error) {
      console.error('Forgot password error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Password reset request failed due to server error',
      });
    }
  }

  /**
   * Reset password with token
   * POST /api/auth/reset-password
   */
  async resetPassword(req, res) {
    try {
      const { token, newPassword, confirmPassword } = req.body;
      const clientIP = req.ip || req.connection.remoteAddress;

      // Step 1: Validate input data
      const validationResult = this.validationService.validatePasswordReset({
        token,
        newPassword,
        confirmPassword,
      });

      if (!validationResult.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationResult.errors,
        });
      }

      const { sanitized } = validationResult;

      // Step 2: Validate reset token
      const tokenValidation = await this.models.PasswordReset.validateToken(sanitized.token);
      
      if (!tokenValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid reset token',
          message: tokenValidation.error,
        });
      }

      const { resetToken } = tokenValidation;

      // Step 3: Find user
      const user = await this.models.User.findById(resetToken.userId);
      if (!user) {
        return res.status(400).json({
          success: false,
          error: 'User not found',
          message: 'User associated with reset token not found',
        });
      }

      // Step 4: Update user password
      await this.models.User.updatePassword(user._id, sanitized.newPassword);

      // Step 5: Mark reset token as used
      await this.models.PasswordReset.markAsUsed(sanitized.token);

      // Step 6: Invalidate all existing sessions for security
      await this.models.Session.invalidateAllForUser(user._id);

      // Step 7: Send security alert email (optional)
      try {
        await this.emailService.sendSecurityAlertEmail({
          to: user.email,
          username: user.username,
          alertType: 'Password Reset Completed',
          ipAddress: clientIP,
          userAgent: req.get('User-Agent'),
        });
      } catch (emailError) {
        // Don't fail the password reset if security email fails
        console.error('Failed to send security alert email:', emailError);
      }

      // Step 8: Return success response
      res.json({
        success: true,
        message: 'Password reset successfully. Please log in with your new password.',
      });

      console.log(`Password reset completed for user: ${user.username} from ${clientIP}`);

    } catch (error) {
      console.error('Reset password error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Password reset failed due to server error',
      });
    }
  }

  /**
   * Verify reset token (for frontend validation)
   * GET /api/auth/verify-reset-token
   */
  async verifyResetToken(req, res) {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Missing token',
          message: 'Reset token is required',
        });
      }

      // Validate reset token
      const tokenValidation = await this.models.PasswordReset.validateToken(token);
      
      if (!tokenValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid reset token',
          message: tokenValidation.error,
        });
      }

      const { resetToken } = tokenValidation;

      // Find user to get username for display
      const user = await this.models.User.findById(resetToken.userId);
      if (!user) {
        return res.status(400).json({
          success: false,
          error: 'User not found',
          message: 'User associated with reset token not found',
        });
      }

      // Return token validation success
      res.json({
        success: true,
        message: 'Reset token is valid',
        tokenInfo: {
          username: user.username,
          email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Partially mask email
          expiresAt: resetToken.expiresAt,
          createdAt: resetToken.createdAt,
        },
      });

    } catch (error) {
      console.error('Verify reset token error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Token verification failed due to server error',
      });
    }
  }
}

module.exports = AuthController;