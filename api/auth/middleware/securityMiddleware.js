/**
 * Security Middleware
 * Provides CSRF protection, input validation, and security logging
 */

const crypto = require('crypto');
const { ValidationService } = require('../services');

/**
 * CSRF Token Store (in production, use Redis or database)
 * This is a simple in-memory store for demonstration
 */
class CSRFTokenStore {
  constructor() {
    this.tokens = new Map();
    this.maxAge = 60 * 60 * 1000; // 1 hour
    
    // Clean up expired tokens every 10 minutes
    setInterval(() => this.cleanup(), 10 * 60 * 1000);
  }

  generate(sessionId) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + this.maxAge;
    
    this.tokens.set(token, {
      sessionId,
      expiresAt,
      used: false,
    });
    
    return token;
  }

  validate(token, sessionId) {
    const tokenData = this.tokens.get(token);
    
    if (!tokenData) {
      return { isValid: false, error: 'Token not found' };
    }
    
    if (tokenData.used) {
      return { isValid: false, error: 'Token already used' };
    }
    
    if (tokenData.expiresAt < Date.now()) {
      this.tokens.delete(token);
      return { isValid: false, error: 'Token expired' };
    }
    
    if (tokenData.sessionId !== sessionId) {
      return { isValid: false, error: 'Token session mismatch' };
    }
    
    // Mark token as used (one-time use)
    tokenData.used = true;
    
    return { isValid: true };
  }

  cleanup() {
    const now = Date.now();
    for (const [token, data] of this.tokens.entries()) {
      if (data.expiresAt < now || data.used) {
        this.tokens.delete(token);
      }
    }
  }

  getStats() {
    return {
      totalTokens: this.tokens.size,
      activeTokens: Array.from(this.tokens.values()).filter(t => !t.used && t.expiresAt > Date.now()).length,
    };
  }
}

// Global CSRF token store
const csrfStore = new CSRFTokenStore();

/**
 * Create CSRF protection middleware
 * @param {Object} options - CSRF options
 * @param {Array<string>} options.exemptMethods - HTTP methods exempt from CSRF (default: ['GET', 'HEAD', 'OPTIONS'])
 * @param {string} options.headerName - CSRF header name (default: 'X-CSRF-Token')
 * @param {boolean} options.requireSession - Require authenticated session (default: true)
 * @returns {Function} Express middleware function
 */
function createCSRFMiddleware(options = {}) {
  const {
    exemptMethods = ['GET', 'HEAD', 'OPTIONS'],
    headerName = 'X-CSRF-Token',
    requireSession = true,
  } = options;

  return (req, res, next) => {
    const method = req.method.toUpperCase();
    
    // Skip CSRF check for exempt methods
    if (exemptMethods.includes(method)) {
      return next();
    }

    // Skip CSRF check if session not required and user not authenticated
    if (!requireSession && !req.user) {
      return next();
    }

    // Require authentication for CSRF protection
    if (requireSession && !req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'CSRF protection requires authentication',
      });
    }

    const sessionId = req.tokenInfo?.sessionId || 'anonymous';
    const csrfToken = req.get(headerName);

    if (!csrfToken) {
      console.log(`CSRF validation failed - Missing token: ${req.user?.username || 'anonymous'} ${method} ${req.path}`);
      
      return res.status(403).json({
        success: false,
        error: 'CSRF token required',
        message: `CSRF token must be provided in ${headerName} header`,
      });
    }

    const validation = csrfStore.validate(csrfToken, sessionId);
    if (!validation.isValid) {
      console.log(`CSRF validation failed - ${validation.error}: ${req.user?.username || 'anonymous'} ${method} ${req.path}`);
      
      return res.status(403).json({
        success: false,
        error: 'Invalid CSRF token',
        message: validation.error,
      });
    }

    console.log(`CSRF validation successful: ${req.user?.username || 'anonymous'} ${method} ${req.path}`);
    next();
  };
}

/**
 * Create CSRF token generation endpoint middleware
 * @returns {Function} Express middleware function
 */
function createCSRFTokenGenerator() {
  return (req, res) => {
    const sessionId = req.tokenInfo?.sessionId || 'anonymous';
    const token = csrfStore.generate(sessionId);
    
    res.json({
      success: true,
      csrfToken: token,
      expiresIn: 3600, // 1 hour in seconds
    });
  };
}

/**
 * Create comprehensive input validation middleware
 * @param {Object} validationRules - Validation rules for different content types
 * @returns {Function} Express middleware function
 */
function createInputValidationMiddleware(validationRules = {}) {
  const validationService = new ValidationService();

  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const contentType = req.get('Content-Type') || '';
    
    try {
      // Validate content type for POST/PUT requests
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        if (!contentType.includes('application/json') && !contentType.includes('application/x-www-form-urlencoded')) {
          console.log(`Invalid content type from ${clientIP}: ${contentType}`);
          
          return res.status(400).json({
            success: false,
            error: 'Invalid content type',
            message: 'Content-Type must be application/json or application/x-www-form-urlencoded',
          });
        }
      }

      // Validate request body size (Express should handle this, but double-check)
      const contentLength = parseInt(req.get('Content-Length') || '0');
      const maxBodySize = validationRules.maxBodySize || 1024 * 1024; // 1MB default
      
      if (contentLength > maxBodySize) {
        console.log(`Request body too large from ${clientIP}: ${contentLength} bytes`);
        
        return res.status(413).json({
          success: false,
          error: 'Request body too large',
          message: `Request body must be smaller than ${maxBodySize} bytes`,
        });
      }

      // Sanitize and validate request body
      if (req.body && typeof req.body === 'object') {
        const sanitizedBody = validationService.sanitizeObject(req.body);
        req.body = sanitizedBody;
      }

      // Validate query parameters
      if (req.query && typeof req.query === 'object') {
        const sanitizedQuery = validationService.sanitizeObject(req.query);
        req.query = sanitizedQuery;
      }

      // Check for suspicious patterns in request
      const suspiciousPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /eval\s*\(/gi,
        /expression\s*\(/gi,
      ];

      const requestString = JSON.stringify(req.body) + JSON.stringify(req.query);
      const hasSuspiciousContent = suspiciousPatterns.some(pattern => pattern.test(requestString));

      if (hasSuspiciousContent) {
        console.warn(`Suspicious content detected from ${clientIP}: ${req.method} ${req.path}`);
        
        // Log security event but don't block (could be false positive)
        req.securityFlags = req.securityFlags || [];
        req.securityFlags.push('suspicious_content');
      }

      next();

    } catch (error) {
      console.error('Input validation error:', error);
      
      res.status(400).json({
        success: false,
        error: 'Input validation failed',
        message: 'Request contains invalid data',
      });
    }
  };
}

/**
 * Create security logging middleware
 * @param {Object} options - Logging options
 * @returns {Function} Express middleware function
 */
function createSecurityLoggingMiddleware(options = {}) {
  const {
    logSuccessfulRequests = false,
    logFailedRequests = true,
    logSuspiciousActivity = true,
  } = options;

  return (req, res, next) => {
    const startTime = Date.now();
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    const method = req.method;
    const path = req.path;
    const username = req.user?.username || 'anonymous';

    // Override res.json to capture response
    const originalJson = res.json;
    res.json = function(data) {
      const responseTime = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Log based on response status and configuration
      if (statusCode >= 400 && logFailedRequests) {
        console.log(`SECURITY: Failed request - ${statusCode} ${method} ${path} - ${username} from ${clientIP} (${responseTime}ms)`);
      } else if (statusCode < 400 && logSuccessfulRequests) {
        console.log(`SECURITY: Successful request - ${statusCode} ${method} ${path} - ${username} from ${clientIP} (${responseTime}ms)`);
      }

      // Log suspicious activity
      if (logSuspiciousActivity && req.securityFlags && req.securityFlags.length > 0) {
        console.warn(`SECURITY: Suspicious activity - ${req.securityFlags.join(', ')} - ${method} ${path} - ${username} from ${clientIP}`);
      }

      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Create request rate monitoring middleware (different from rate limiting)
 * @param {Object} options - Monitoring options
 * @returns {Function} Express middleware function
 */
function createRequestMonitoringMiddleware(options = {}) {
  const {
    suspiciousThreshold = 100, // requests per minute
    windowMs = 60 * 1000, // 1 minute
  } = options;

  const requestCounts = new Map();

  // Clean up old entries every minute
  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, data] of requestCounts.entries()) {
      data.requests = data.requests.filter(time => time > cutoff);
      if (data.requests.length === 0) {
        requestCounts.delete(key);
      }
    }
  }, windowMs);

  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const cutoff = now - windowMs;

    // Get or create request data for this IP
    let requestData = requestCounts.get(clientIP);
    if (!requestData) {
      requestData = { requests: [], flagged: false };
      requestCounts.set(clientIP, requestData);
    }

    // Remove old requests and add current request
    requestData.requests = requestData.requests.filter(time => time > cutoff);
    requestData.requests.push(now);

    // Check if this IP is making suspicious number of requests
    if (requestData.requests.length > suspiciousThreshold && !requestData.flagged) {
      console.warn(`SECURITY: High request rate detected from ${clientIP}: ${requestData.requests.length} requests in last minute`);
      requestData.flagged = true;
      
      req.securityFlags = req.securityFlags || [];
      req.securityFlags.push('high_request_rate');
    }

    // Reset flag if request rate drops
    if (requestData.requests.length <= suspiciousThreshold / 2) {
      requestData.flagged = false;
    }

    next();
  };
}

module.exports = {
  createCSRFMiddleware,
  createCSRFTokenGenerator,
  createInputValidationMiddleware,
  createSecurityLoggingMiddleware,
  createRequestMonitoringMiddleware,
  csrfStore, // Export for testing/monitoring
};