/**
 * Authentication Routes
 * Defines HTTP routes for authentication endpoints with comprehensive security
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const AuthController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { 
  createAuthRateLimit, 
  createUserRateLimit, 
  createProgressiveDelay,
  createCaptchaRequirement 
} = require('../middleware/rateLimitMiddleware');
const {
  createCSRFMiddleware,
  createCSRFTokenGenerator,
  createInputValidationMiddleware,
  createSecurityLoggingMiddleware,
  createRequestMonitoringMiddleware,
} = require('../middleware/securityMiddleware');

/**
 * Create authentication routes
 * @param {Object} db - MongoDB database instance
 * @returns {express.Router} Express router with auth routes
 */
function createAuthRoutes(db) {
  const router = express.Router();
  const authController = new AuthController(db);

  // Rate limiting configurations
  const authRateLimit = createAuthRateLimit();
  const userRateLimit = createUserRateLimit();
  const progressiveDelay = createProgressiveDelay();
  const captchaRequirement = createCaptchaRequirement();

  // Security middleware configurations
  const csrfProtection = createCSRFMiddleware({
    exemptMethods: ['GET', 'HEAD', 'OPTIONS'],
    requireSession: true,
  });
  
  const inputValidation = createInputValidationMiddleware({
    maxBodySize: 1024 * 1024, // 1MB
  });
  
  const securityLogging = createSecurityLoggingMiddleware({
    logSuccessfulRequests: process.env.NODE_ENV === 'development',
    logFailedRequests: true,
    logSuspiciousActivity: true,
  });
  
  const requestMonitoring = createRequestMonitoringMiddleware({
    suspiciousThreshold: 100, // requests per minute
    windowMs: 60 * 1000, // 1 minute
  });

  const moderateRateLimit = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 attempts per window
    message: {
      success: false,
      error: 'Too many requests',
      message: 'Too many requests. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      return process.env.NODE_ENV === 'test';
    },
  });

  // Apply global security middleware
  router.use(securityLogging);
  router.use(requestMonitoring);
  router.use(inputValidation);

  // Public routes (no authentication required)
  
  /**
   * POST /api/auth/register
   * Register a new user account
   */
  router.post('/register', authRateLimit, async (req, res) => {
    await authController.register(req, res);
  });

  /**
   * POST /api/auth/login
   * Authenticate user and return tokens
   * Enhanced with progressive delays, user-specific rate limiting, and CAPTCHA
   */
  router.post('/login', 
    authRateLimit,           // IP-based rate limiting
    userRateLimit,           // User-specific rate limiting
    progressiveDelay,        // Progressive delays for repeated attempts
    captchaRequirement,      // CAPTCHA requirement after multiple failures
    async (req, res) => {
      await authController.login(req, res);
    }
  );

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token
   */
  router.post('/refresh', moderateRateLimit, async (req, res) => {
    await authController.refresh(req, res);
  });

  /**
   * GET /api/auth/verify-token
   * Verify if access token is valid
   */
  router.get('/verify-token', moderateRateLimit, async (req, res) => {
    await authController.verifyToken(req, res);
  });

  /**
   * POST /api/auth/forgot-password
   * Request password reset email
   */
  router.post('/forgot-password', moderateRateLimit, async (req, res) => {
    await authController.forgotPassword(req, res);
  });

  /**
   * POST /api/auth/reset-password
   * Reset password with token
   */
  router.post('/reset-password', moderateRateLimit, async (req, res) => {
    await authController.resetPassword(req, res);
  });

  /**
   * GET /api/auth/verify-reset-token
   * Verify reset token validity (for frontend validation)
   */
  router.get('/verify-reset-token', moderateRateLimit, async (req, res) => {
    await authController.verifyResetToken(req, res);
  });

  /**
   * GET /api/auth/csrf-token
   * Get CSRF token for authenticated requests
   */
  router.get('/csrf-token', authMiddleware(db), createCSRFTokenGenerator());

  // Protected routes (authentication required)

  /**
   * POST /api/auth/logout
   * Logout user and invalidate session
   */
  router.post('/logout', authMiddleware(db), csrfProtection, async (req, res) => {
    await authController.logout(req, res);
  });

  /**
   * GET /api/auth/me
   * Get current authenticated user information
   */
  router.get('/me', authMiddleware(db), async (req, res) => {
    await authController.getCurrentUser(req, res);
  });

  /**
   * GET /api/auth/sessions
   * Get user's active sessions
   */
  router.get('/sessions', authMiddleware(db), async (req, res) => {
    await authController.getUserSessions(req, res);
  });

  // Health check endpoint
  router.get('/health', (req, res) => {
    res.json({
      success: true,
      message: 'Authentication service is healthy',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}

module.exports = createAuthRoutes;