/**
 * Security Middleware Tests
 * Tests for CSRF protection, input validation, and security logging
 */

const {
  createCSRFMiddleware,
  createCSRFTokenGenerator,
  createInputValidationMiddleware,
  createSecurityLoggingMiddleware,
  createRequestMonitoringMiddleware,
  csrfStore,
} = require('../securityMiddleware');

describe('Security Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      method: 'POST',
      path: '/test',
      get: jest.fn(),
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
      user: { username: 'testuser' },
      tokenInfo: { sessionId: 'session123' },
      body: {},
      query: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('CSRF Protection', () => {
    test('should allow GET requests without CSRF token', async () => {
      const csrfMiddleware = createCSRFMiddleware();
      req.method = 'GET';

      await csrfMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should allow HEAD requests without CSRF token', async () => {
      const csrfMiddleware = createCSRFMiddleware();
      req.method = 'HEAD';

      await csrfMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should allow OPTIONS requests without CSRF token', async () => {
      const csrfMiddleware = createCSRFMiddleware();
      req.method = 'OPTIONS';

      await csrfMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject POST request without CSRF token', async () => {
      const csrfMiddleware = createCSRFMiddleware();
      req.get.mockReturnValue(null);

      await csrfMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'CSRF token required',
        message: 'CSRF token must be provided in X-CSRF-Token header',
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject POST request with invalid CSRF token', async () => {
      const csrfMiddleware = createCSRFMiddleware();
      req.get.mockReturnValue('invalid-token');

      await csrfMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid CSRF token',
        message: 'Token not found',
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should accept POST request with valid CSRF token', async () => {
      const csrfMiddleware = createCSRFMiddleware();
      
      // Generate a valid token
      const token = csrfStore.generate('session123');
      req.get.mockReturnValue(token);

      await csrfMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject reused CSRF token', async () => {
      const csrfMiddleware = createCSRFMiddleware();
      
      // Generate and use a token
      const token = csrfStore.generate('session123');
      req.get.mockReturnValue(token);

      // First use should succeed
      await csrfMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();

      // Reset mocks
      jest.clearAllMocks();

      // Second use should fail
      await csrfMiddleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid CSRF token',
        message: 'Token already used',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('CSRF Token Generator', () => {
    test('should generate CSRF token for authenticated user', async () => {
      const tokenGenerator = createCSRFTokenGenerator();

      await tokenGenerator(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        csrfToken: expect.any(String),
        expiresIn: 3600,
      });
    });

    test('should generate CSRF token for anonymous user', async () => {
      const tokenGenerator = createCSRFTokenGenerator();
      req.tokenInfo = null;

      await tokenGenerator(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        csrfToken: expect.any(String),
        expiresIn: 3600,
      });
    });
  });

  describe('Input Validation', () => {
    test('should accept valid JSON content type', async () => {
      const inputValidation = createInputValidationMiddleware();
      req.get.mockImplementation((header) => {
        if (header === 'Content-Type') return 'application/json';
        if (header === 'Content-Length') return '100';
        return null;
      });

      await inputValidation(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should accept valid form content type', async () => {
      const inputValidation = createInputValidationMiddleware();
      req.get.mockImplementation((header) => {
        if (header === 'Content-Type') return 'application/x-www-form-urlencoded';
        if (header === 'Content-Length') return '100';
        return null;
      });

      await inputValidation(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject invalid content type for POST request', async () => {
      const inputValidation = createInputValidationMiddleware();
      req.get.mockImplementation((header) => {
        if (header === 'Content-Type') return 'text/plain';
        if (header === 'Content-Length') return '100';
        return null;
      });

      await inputValidation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid content type',
        message: 'Content-Type must be application/json or application/x-www-form-urlencoded',
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request body that is too large', async () => {
      const inputValidation = createInputValidationMiddleware({ maxBodySize: 1000 });
      req.get.mockImplementation((header) => {
        if (header === 'Content-Type') return 'application/json';
        if (header === 'Content-Length') return '2000';
        return null;
      });

      await inputValidation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(413);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Request body too large',
        message: 'Request body must be smaller than 1000 bytes',
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should detect suspicious content patterns', async () => {
      const inputValidation = createInputValidationMiddleware();
      req.method = 'GET'; // Skip content type validation
      req.body = { message: '<script>alert("xss")</script>' };
      req.get.mockReturnValue('0');

      await inputValidation(req, res, next);

      expect(req.securityFlags).toContain('suspicious_content');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Security Logging', () => {
    test('should log failed requests when configured', async () => {
      const securityLogging = createSecurityLoggingMiddleware({ logFailedRequests: true });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Override res.json to simulate response
      const originalJson = res.json;
      res.json = function(data) {
        res.statusCode = 400;
        return originalJson.call(this, data);
      };

      await securityLogging(req, res, next);
      
      // Simulate response
      res.json({ error: 'Test error' });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('SECURITY: Failed request - 400 POST /test - testuser from 127.0.0.1')
      );

      consoleSpy.mockRestore();
    });

    test('should log suspicious activity when configured', async () => {
      const securityLogging = createSecurityLoggingMiddleware({ logSuspiciousActivity: true });
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      req.securityFlags = ['suspicious_content'];

      // Override res.json to simulate response
      const originalJson = res.json;
      res.json = function(data) {
        res.statusCode = 200;
        return originalJson.call(this, data);
      };

      await securityLogging(req, res, next);
      
      // Simulate response
      res.json({ success: true });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('SECURITY: Suspicious activity - suspicious_content - POST /test - testuser from 127.0.0.1')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Request Monitoring', () => {
    test('should track request counts per IP', async () => {
      const requestMonitoring = createRequestMonitoringMiddleware({ suspiciousThreshold: 2 });

      // First request
      await requestMonitoring(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(req.securityFlags).toBeUndefined();

      // Second request
      await requestMonitoring(req, res, next);
      expect(next).toHaveBeenCalledTimes(2);
      expect(req.securityFlags).toBeUndefined();

      // Third request should trigger flag
      await requestMonitoring(req, res, next);
      expect(next).toHaveBeenCalledTimes(3);
      expect(req.securityFlags).toContain('high_request_rate');
    });

    test('should log high request rate warning', async () => {
      const requestMonitoring = createRequestMonitoringMiddleware({ suspiciousThreshold: 1 });
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // First request should be fine
      await requestMonitoring(req, res, next);
      expect(consoleSpy).not.toHaveBeenCalled();

      // Second request should trigger warning
      await requestMonitoring(req, res, next);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('SECURITY: High request rate detected from 127.0.0.1')
      );

      consoleSpy.mockRestore();
    });
  });
});