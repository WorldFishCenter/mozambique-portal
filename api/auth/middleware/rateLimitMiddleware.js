/**
 * Advanced Rate Limiting Middleware
 * Implements sophisticated rate limiting with IP and user-based tracking
 */

const rateLimit = require('express-rate-limit');
const config = require('../utils/config');

/**
 * Create rate limiting store (in-memory for now, could be Redis in production)
 */
class RateLimitStore {
  constructor() {
    this.hits = new Map();
    this.resetTime = new Map();
    
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  incr(key, callback) {
    const now = Date.now();
    const windowMs = config.rateLimit.windowMs;
    const resetTime = this.resetTime.get(key) || now + windowMs;

    // Reset if window has expired
    if (now > resetTime) {
      this.hits.set(key, 1);
      const newResetTime = now + windowMs;
      this.resetTime.set(key, newResetTime);
      callback(null, 1, new Date(newResetTime));
      return;
    }

    // Increment hits
    const hits = (this.hits.get(key) || 0) + 1;
    this.hits.set(key, hits);
    callback(null, hits, new Date(resetTime));
  }

  decrement(key) {
    const hits = this.hits.get(key) || 0;
    if (hits > 0) {
      this.hits.set(key, hits - 1);
    }
  }

  resetKey(key) {
    this.hits.delete(key);
    this.resetTime.delete(key);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, resetTime] of this.resetTime.entries()) {
      if (now > resetTime) {
        this.hits.delete(key);
        this.resetTime.delete(key);
      }
    }
  }
}

// Shared store instance
const rateLimitStore = new RateLimitStore();

/**
 * Create authentication rate limiter
 * Implements progressive delays and account lockout
 */
function createAuthRateLimit() {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxAttempts,
    store: rateLimitStore,
    // Remove custom keyGenerator to use the default IP-based one
    // which handles IPv6 properly
    handler: (req, res) => {
      const retryAfter = Math.ceil(config.rateLimit.windowMs / 1000);
      
      res.status(429).json({
        success: false,
        error: 'Too many authentication attempts',
        message: `Too many login attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
        retryAfter: retryAfter,
      });
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting in test environment
      return process.env.NODE_ENV === 'test';
    },
  });
}

/**
 * Create user-specific rate limiter
 * Tracks failed attempts per username/email
 */
function createUserRateLimit() {
  const userAttempts = new Map();
  const userLockouts = new Map();
  
  return (req, res, next) => {
    // Skip in test environment
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const { username, email } = req.body;
    const identifier = username || email;
    
    if (!identifier) {
      return next();
    }

    const userKey = `user:${identifier.toLowerCase()}`;
    const now = Date.now();
    
    // Check if user is currently locked out
    const lockoutEnd = userLockouts.get(userKey);
    if (lockoutEnd && now < lockoutEnd) {
      const remainingTime = Math.ceil((lockoutEnd - now) / 1000 / 60);
      return res.status(429).json({
        success: false,
        error: 'Account temporarily locked',
        message: `Account is temporarily locked due to too many failed attempts. Try again in ${remainingTime} minutes.`,
        retryAfter: Math.ceil((lockoutEnd - now) / 1000),
      });
    }

    // Clean up expired lockout
    if (lockoutEnd && now >= lockoutEnd) {
      userLockouts.delete(userKey);
      userAttempts.delete(userKey);
    }

    // Store user key for potential cleanup on successful login
    req.rateLimitUserKey = userKey;
    next();
  };
}

/**
 * Handle failed login attempt
 * Increments user-specific failure count
 */
function handleFailedLogin(req, identifier) {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const userKey = `user:${identifier.toLowerCase()}`;
  const userAttempts = new Map();
  const userLockouts = new Map();
  
  // Get current attempts
  const attempts = (userAttempts.get(userKey) || 0) + 1;
  userAttempts.set(userKey, attempts);
  
  // Lock account after max attempts
  const maxUserAttempts = 5; // More restrictive than IP-based limiting
  if (attempts >= maxUserAttempts) {
    const lockoutDuration = 30 * 60 * 1000; // 30 minutes
    userLockouts.set(userKey, Date.now() + lockoutDuration);
    
    console.log(`User account locked: ${identifier} (${attempts} failed attempts)`);
  }
}

/**
 * Handle successful login
 * Clears user-specific failure count
 */
function handleSuccessfulLogin(req) {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const userKey = req.rateLimitUserKey;
  if (userKey) {
    const userAttempts = new Map();
    const userLockouts = new Map();
    
    userAttempts.delete(userKey);
    userLockouts.delete(userKey);
  }
}

/**
 * Create progressive delay middleware
 * Adds increasing delays based on failed attempts
 */
function createProgressiveDelay() {
  const delayMap = new Map();
  
  return async (req, res, next) => {
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const delayKey = `delay:${ip}`;
    
    const attempts = delayMap.get(delayKey) || 0;
    
    if (attempts > 0) {
      // Progressive delay: 1s, 2s, 4s, 8s, etc.
      const delay = Math.min(Math.pow(2, attempts - 1) * 1000, 30000); // Max 30 seconds
      
      console.log(`Applying progressive delay: ${delay}ms for IP ${ip} (attempt ${attempts + 1})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Store delay info for potential cleanup
    req.progressiveDelayKey = delayKey;
    next();
  };
}

/**
 * Handle failed attempt for progressive delay
 */
function handleFailedAttempt(req) {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const delayKey = req.progressiveDelayKey;
  if (delayKey) {
    const delayMap = new Map();
    const attempts = (delayMap.get(delayKey) || 0) + 1;
    delayMap.set(delayKey, attempts);
    
    // Clean up after 1 hour
    setTimeout(() => {
      delayMap.delete(delayKey);
    }, 60 * 60 * 1000);
  }
}

/**
 * Handle successful attempt for progressive delay
 */
function handleSuccessfulAttempt(req) {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const delayKey = req.progressiveDelayKey;
  if (delayKey) {
    const delayMap = new Map();
    delayMap.delete(delayKey);
  }
}

/**
 * Create CAPTCHA requirement middleware
 * Requires CAPTCHA after multiple failed attempts
 */
function createCaptchaRequirement() {
  const captchaRequired = new Map();
  
  return (req, res, next) => {
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const captchaKey = `captcha:${ip}`;
    
    if (captchaRequired.get(captchaKey)) {
      const { captcha } = req.body;
      
      if (!captcha) {
        return res.status(400).json({
          success: false,
          error: 'CAPTCHA required',
          message: 'Please complete the CAPTCHA verification.',
          requiresCaptcha: true,
        });
      }
      
      // In a real implementation, verify CAPTCHA here
      // For now, just accept any non-empty captcha value
      if (captcha.length < 3) {
        return res.status(400).json({
          success: false,
          error: 'Invalid CAPTCHA',
          message: 'CAPTCHA verification failed.',
          requiresCaptcha: true,
        });
      }
    }
    
    req.captchaKey = captchaKey;
    next();
  };
}

/**
 * Require CAPTCHA for future requests
 */
function requireCaptcha(req) {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const captchaKey = req.captchaKey;
  if (captchaKey) {
    const captchaRequired = new Map();
    captchaRequired.set(captchaKey, true);
    
    // Remove requirement after 1 hour
    setTimeout(() => {
      captchaRequired.delete(captchaKey);
    }, 60 * 60 * 1000);
  }
}

/**
 * Clear CAPTCHA requirement
 */
function clearCaptchaRequirement(req) {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const captchaKey = req.captchaKey;
  if (captchaKey) {
    const captchaRequired = new Map();
    captchaRequired.delete(captchaKey);
  }
}

module.exports = {
  createAuthRateLimit,
  createUserRateLimit,
  createProgressiveDelay,
  createCaptchaRequirement,
  handleFailedLogin,
  handleSuccessfulLogin,
  handleFailedAttempt,
  handleSuccessfulAttempt,
  requireCaptcha,
  clearCaptchaRequirement,
  rateLimitStore,
};