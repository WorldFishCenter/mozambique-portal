/**
 * Authentication Middleware Tests
 * Tests for JWT authentication middleware functionality
 */

const createAuthMiddleware = require('../authMiddleware');
const { TokenService } = require('../../services');
const { initializeModels } = require('../../models');

// Mock dependencies
jest.mock('../../services');
jest.mock('../../models');

describe('Authentication Middleware', () => {
  let mockDb;
  let mockModels;
  let mockTokenService;
  let authMiddleware;
  let req;
  let res;
  let next;

  beforeEach(() => {
    // Mock database and models
    mockDb = {};
    mockModels = {
      User: {
        findById: jest.fn(),
      },
      Session: {
        collection: {
          findOne: jest.fn(),
          updateOne: jest.fn(),
        },
        hashToken: jest.fn(),
        ObjectId: jest.fn(),
      },
    };

    // Mock token service
    mockTokenService = {
      extractTokenFromHeader: jest.fn(),
      verifyAccessToken: jest.fn(),
      shouldRefreshToken: jest.fn(),
    };

    // Setup mocks
    initializeModels.mockReturnValue(mockModels);
    TokenService.mockImplementation(() => mockTokenService);

    // Create middleware
    authMiddleware = createAuthMiddleware(mockDb);

    // Mock request, response, and next
    req = {
      get: jest.fn(),
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
      path: '/test',
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

  describe('Token Extraction and Validation', () => {
    test('should reject request with missing authorization header', async () => {
      req.get.mockReturnValue(null);
      mockTokenService.extractTokenFromHeader.mockReturnValue(null);

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Missing authorization token',
        message: 'Authorization header with Bearer token is required',
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request with invalid token', async () => {
      const mockToken = 'invalid-token';
      req.get.mockReturnValue(`Bearer ${mockToken}`);
      mockTokenService.extractTokenFromHeader.mockReturnValue(mockToken);
      mockTokenService.verifyAccessToken.mockReturnValue({
        isValid: false,
        error: 'Token expired',
      });

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token',
        message: 'Token expired',
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request when user not found', async () => {
      const mockToken = 'valid-token';
      const mockUserId = 'user123';

      req.get.mockReturnValue(`Bearer ${mockToken}`);
      mockTokenService.extractTokenFromHeader.mockReturnValue(mockToken);
      mockTokenService.verifyAccessToken.mockReturnValue({
        isValid: true,
        payload: { userId: mockUserId, sessionId: 'session123', iat: 1234567890, exp: 9999999999 },
      });
      mockModels.User.findById.mockResolvedValue(null);

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
        message: 'User associated with token not found',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Session Validation', () => {
    test('should reject request with expired session', async () => {
      const mockToken = 'valid-token';
      const mockUserId = 'user123';
      const mockSessionId = 'session123';
      const mockUser = { _id: mockUserId, username: 'testuser' };

      req.get.mockReturnValue(`Bearer ${mockToken}`);
      mockTokenService.extractTokenFromHeader.mockReturnValue(mockToken);
      mockTokenService.verifyAccessToken.mockReturnValue({
        isValid: true,
        payload: { userId: mockUserId, sessionId: mockSessionId, iat: 1234567890, exp: 9999999999 },
      });
      mockModels.User.findById.mockResolvedValue(mockUser);
      mockModels.Session.collection.findOne.mockResolvedValue(null);

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Session expired',
        message: 'User session has expired or been invalidated',
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request with token hash mismatch', async () => {
      const mockToken = 'valid-token';
      const mockUserId = 'user123';
      const mockSessionId = 'session123';
      const mockUser = { _id: mockUserId, username: 'testuser' };
      const mockSession = {
        _id: mockSessionId,
        isActive: true,
        expiresAt: new Date(Date.now() + 3600000),
        accessToken: 'different-hash',
      };

      req.get.mockReturnValue(`Bearer ${mockToken}`);
      mockTokenService.extractTokenFromHeader.mockReturnValue(mockToken);
      mockTokenService.verifyAccessToken.mockReturnValue({
        isValid: true,
        payload: { userId: mockUserId, sessionId: mockSessionId, iat: 1234567890, exp: 9999999999 },
      });
      mockModels.User.findById.mockResolvedValue(mockUser);
      mockModels.Session.collection.findOne.mockResolvedValue(mockSession);
      mockModels.Session.hashToken.mockReturnValue('expected-hash');

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token mismatch',
        message: 'Token does not match session record',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Successful Authentication', () => {
    test('should authenticate valid request and attach user info', async () => {
      const mockToken = 'valid-token';
      const mockUserId = 'user123';
      const mockSessionId = 'session123';
      const mockUser = { _id: mockUserId, username: 'testuser' };
      const mockSession = {
        _id: mockSessionId,
        isActive: true,
        expiresAt: new Date(Date.now() + 3600000),
        accessToken: 'expected-hash',
      };

      req.get.mockImplementation((header) => {
        if (header === 'Authorization') return `Bearer ${mockToken}`;
        if (header === 'User-Agent') return 'Mozilla/5.0';
        return null;
      });
      mockTokenService.extractTokenFromHeader.mockReturnValue(mockToken);
      mockTokenService.verifyAccessToken.mockReturnValue({
        isValid: true,
        payload: { userId: mockUserId, sessionId: mockSessionId, iat: 1234567890, exp: 9999999999 },
      });
      mockModels.User.findById.mockResolvedValue(mockUser);
      mockModels.Session.collection.findOne.mockResolvedValue(mockSession);
      mockModels.Session.hashToken.mockReturnValue('expected-hash');
      mockModels.Session.collection.updateOne.mockResolvedValue({});
      mockTokenService.shouldRefreshToken.mockReturnValue(false);

      await authMiddleware(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(req.tokenInfo).toMatchObject({
        userId: mockUserId,
        sessionId: mockSessionId,
        token: mockToken,
      });
      expect(req.securityContext).toMatchObject({
        clientIP: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should suggest token refresh when token expires soon', async () => {
      const mockToken = 'valid-token';
      const mockUserId = 'user123';
      const mockSessionId = 'session123';
      const mockUser = { _id: mockUserId, username: 'testuser' };
      const mockSession = {
        _id: mockSessionId,
        isActive: true,
        expiresAt: new Date(Date.now() + 3600000),
        accessToken: 'expected-hash',
      };

      req.get.mockReturnValue(`Bearer ${mockToken}`);
      mockTokenService.extractTokenFromHeader.mockReturnValue(mockToken);
      mockTokenService.verifyAccessToken.mockReturnValue({
        isValid: true,
        payload: { userId: mockUserId, sessionId: mockSessionId, iat: 1234567890, exp: Math.floor(Date.now() / 1000) + 300 },
      });
      mockModels.User.findById.mockResolvedValue(mockUser);
      mockModels.Session.collection.findOne.mockResolvedValue(mockSession);
      mockModels.Session.hashToken.mockReturnValue('expected-hash');
      mockModels.Session.collection.updateOne.mockResolvedValue({});
      mockTokenService.shouldRefreshToken.mockReturnValue(true);

      await authMiddleware(req, res, next);

      expect(res.set).toHaveBeenCalledWith('X-Token-Refresh-Suggested', 'true');
      expect(res.set).toHaveBeenCalledWith('X-Token-Expires-In', expect.any(String));
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Security Features', () => {
    test('should reject token with future issue time', async () => {
      const mockToken = 'valid-token';
      const mockUserId = 'user123';
      const mockUser = { _id: mockUserId, username: 'testuser' };
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour in future

      req.get.mockReturnValue(`Bearer ${mockToken}`);
      mockTokenService.extractTokenFromHeader.mockReturnValue(mockToken);
      mockTokenService.verifyAccessToken.mockReturnValue({
        isValid: true,
        payload: { userId: mockUserId, sessionId: null, iat: futureTime, exp: 9999999999 },
      });
      mockModels.User.findById.mockResolvedValue(mockUser);

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token timing',
        message: 'Token has invalid issue time',
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject inactive user when requireActive is true', async () => {
      const mockToken = 'valid-token';
      const mockUserId = 'user123';
      const mockUser = { _id: mockUserId, username: 'testuser', status: 'inactive' };

      // Create middleware with requireActive option
      const authMiddlewareWithOptions = createAuthMiddleware(mockDb, { requireActive: true });

      req.get.mockReturnValue(`Bearer ${mockToken}`);
      mockTokenService.extractTokenFromHeader.mockReturnValue(mockToken);
      mockTokenService.verifyAccessToken.mockReturnValue({
        isValid: true,
        payload: { userId: mockUserId, sessionId: 'session123', iat: 1234567890, exp: 9999999999 },
      });
      mockModels.User.findById.mockResolvedValue(mockUser);

      await authMiddlewareWithOptions(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Account inactive',
        message: 'User account is not active',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      const mockToken = 'valid-token';
      const mockUserId = 'user123';

      req.get.mockReturnValue(`Bearer ${mockToken}`);
      mockTokenService.extractTokenFromHeader.mockReturnValue(mockToken);
      mockTokenService.verifyAccessToken.mockReturnValue({
        isValid: true,
        payload: { userId: mockUserId, sessionId: 'session123', iat: 1234567890, exp: 9999999999 },
      });
      mockModels.User.findById.mockRejectedValue(new Error('Database connection failed'));

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication error',
        message: 'Failed to authenticate request',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});