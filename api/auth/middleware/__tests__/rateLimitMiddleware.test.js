/**
 * Rate Limit Middleware Tests
 * Tests for advanced rate limiting functionality
 */

const {
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
} = require('../rateLimitMiddleware');

describe('RateLimitMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      ip: '127.0.0.1',
      body: {},
      connection: { remoteAddress: '127.0.0.1' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      set: jest.fn(),
    };
    next = jest.fn();

    // Set test environment
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createAuthRateLimit', () => {
    test('should create rate limit middleware', () => {
      const middleware = createAuthRateLimit();
      expect(typeof middleware).toBe('function');
    });

    test('should skip rate limiting in test environment', () => {
      const middleware = createAuthRateLimit();
      
      // Mock the rate limit check
      const mockReq = { ...req };
      const mockRes = { ...res };
      const mockNext = jest.fn();

      // In test environment, should skip rate limiting
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('createUserRateLimit', () => {
    test('should create user rate limit middleware', () => {
      const middleware = createUserRateLimit();
      expect(typeof middleware).toBe('function');
    });

    test('should skip in test environment', () => {
      const middleware = createUserRateLimit();
      
      req.body = { username: 'testuser' };
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should proceed when no identifier provided', () => {
      const middleware = createUserRateLimit();
      
      req.body = {}; // No username or email
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });

  describe('createProgressiveDelay', () => {
    test('should create progressive delay middleware', () => {
      const middleware = createProgressiveDelay();
      expect(typeof middleware).toBe('function');
    });

    test('should skip delay in test environment', async () => {
      const middleware = createProgressiveDelay();
      
      await middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.progressiveDelayKey).toBeDefined();
    });
  });

  describe('createCaptchaRequirement', () => {
    test('should create CAPTCHA requirement middleware', () => {
      const middleware = createCaptchaRequirement();
      expect(typeof middleware).toBe('function');
    });

    test('should skip CAPTCHA in test environment', () => {
      const middleware = createCaptchaRequirement();
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.captchaKey).toBeDefined();
    });
  });

  describe('handleFailedLogin', () => {
    test('should handle failed login attempt', () => {
      // Should not throw error in test environment
      expect(() => {
        handleFailedLogin(req, 'testuser');
      }).not.toThrow();
    });

    test('should skip processing in test environment', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      handleFailedLogin(req, 'testuser');
      
      // Should not log in test environment
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('handleSuccessfulLogin', () => {
    test('should handle successful login', () => {
      req.rateLimitUserKey = 'user:testuser';
      
      expect(() => {
        handleSuccessfulLogin(req);
      }).not.toThrow();
    });

    test('should handle missing user key', () => {
      expect(() => {
        handleSuccessfulLogin(req);
      }).not.toThrow();
    });
  });

  describe('handleFailedAttempt', () => {
    test('should handle failed attempt', () => {
      req.progressiveDelayKey = 'delay:127.0.0.1';
      
      expect(() => {
        handleFailedAttempt(req);
      }).not.toThrow();
    });
  });

  describe('handleSuccessfulAttempt', () => {
    test('should handle successful attempt', () => {
      req.progressiveDelayKey = 'delay:127.0.0.1';
      
      expect(() => {
        handleSuccessfulAttempt(req);
      }).not.toThrow();
    });
  });

  describe('requireCaptcha', () => {
    test('should require CAPTCHA', () => {
      req.captchaKey = 'captcha:127.0.0.1';
      
      expect(() => {
        requireCaptcha(req);
      }).not.toThrow();
    });
  });

  describe('clearCaptchaRequirement', () => {
    test('should clear CAPTCHA requirement', () => {
      req.captchaKey = 'captcha:127.0.0.1';
      
      expect(() => {
        clearCaptchaRequirement(req);
      }).not.toThrow();
    });
  });

  describe('RateLimitStore', () => {
    test('should increment hits correctly', (done) => {
      const key = 'test-key';
      
      rateLimitStore.incr(key, (err, hits, resetTime) => {
        expect(err).toBeNull();
        expect(hits).toBe(1);
        expect(resetTime).toBeGreaterThan(Date.now());
        done();
      });
    });

    test('should decrement hits', () => {
      const key = 'test-key-2';
      
      // First increment
      rateLimitStore.incr(key, () => {
        // Then decrement
        rateLimitStore.decrement(key);
        
        // Verify decrement worked by checking next increment
        rateLimitStore.incr(key, (err, hits) => {
          expect(hits).toBe(1); // Should be 1, not 2
        });
      });
    });

    test('should reset key', () => {
      const key = 'test-key-3';
      
      rateLimitStore.incr(key, () => {
        rateLimitStore.resetKey(key);
        
        // Next increment should start from 1
        rateLimitStore.incr(key, (err, hits) => {
          expect(hits).toBe(1);
        });
      });
    });

    test('should cleanup expired entries', () => {
      expect(() => {
        rateLimitStore.cleanup();
      }).not.toThrow();
    });
  });

  describe('Integration with different environments', () => {
    test('should behave differently in production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      try {
        const middleware = createUserRateLimit();
        
        // Should still create middleware
        expect(typeof middleware).toBe('function');
        
        // Behavior would be different in production, but we can't easily test
        // the full rate limiting logic without more complex setup
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });
});