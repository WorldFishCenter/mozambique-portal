/**
 * Token Service Tests
 * Unit tests for JWT token generation, validation, and refresh logic
 */

const TokenService = require('../tokenService');
const { ObjectId } = require('mongodb');

describe('TokenService', () => {
  let tokenService;
  let mockUser;

  beforeEach(() => {
    tokenService = new TokenService();
    mockUser = {
      _id: new ObjectId(),
      username: 'testuser',
      email: 'test@example.com',
    };
  });

  describe('generateAccessToken', () => {
    test('should generate valid access token', () => {
      const result = tokenService.generateAccessToken(mockUser);
      
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expiresAt');
      expect(result).toHaveProperty('expiresIn');
      expect(result.type).toBe('Bearer');
      expect(typeof result.token).toBe('string');
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    test('should include user information in token', () => {
      const result = tokenService.generateAccessToken(mockUser);
      const decoded = tokenService.decodeToken(result.token);
      
      expect(decoded.payload.userId).toBe(mockUser._id.toString());
      expect(decoded.payload.username).toBe(mockUser.username);
      expect(decoded.payload.email).toBe(mockUser.email);
      expect(decoded.payload.type).toBe('access');
    });

    test('should include optional claims when provided', () => {
      const sessionId = 'test-session-id';
      const ipAddress = '192.168.1.1';
      
      const result = tokenService.generateAccessToken(mockUser, {
        sessionId,
        ipAddress,
      });
      
      const decoded = tokenService.decodeToken(result.token);
      expect(decoded.payload.sessionId).toBe(sessionId);
      expect(decoded.payload.ipAddress).toBe(ipAddress);
    });

    test('should throw error for invalid user', () => {
      expect(() => {
        tokenService.generateAccessToken(null);
      }).toThrow('User object with _id is required');

      expect(() => {
        tokenService.generateAccessToken({});
      }).toThrow('User object with _id is required');
    });
  });

  describe('generateRefreshToken', () => {
    test('should generate valid refresh token', () => {
      const result = tokenService.generateRefreshToken(mockUser);
      
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('tokenId');
      expect(result).toHaveProperty('expiresAt');
      expect(result).toHaveProperty('expiresIn');
      expect(result.type).toBe('refresh');
    });

    test('should include user ID and token ID', () => {
      const result = tokenService.generateRefreshToken(mockUser);
      const decoded = tokenService.decodeToken(result.token);
      
      expect(decoded.payload.userId).toBe(mockUser._id.toString());
      expect(decoded.payload.type).toBe('refresh');
      expect(decoded.payload.tokenId).toBe(result.tokenId);
    });

    test('should generate unique token IDs', () => {
      const result1 = tokenService.generateRefreshToken(mockUser);
      const result2 = tokenService.generateRefreshToken(mockUser);
      
      expect(result1.tokenId).not.toBe(result2.tokenId);
    });
  });

  describe('generateTokenPair', () => {
    test('should generate both access and refresh tokens', () => {
      const result = tokenService.generateTokenPair(mockUser);
      
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('sessionId');
      
      expect(result.accessToken.type).toBe('Bearer');
      expect(result.refreshToken.type).toBe('refresh');
    });

    test('should use same session ID for both tokens', () => {
      const result = tokenService.generateTokenPair(mockUser);
      
      const accessDecoded = tokenService.decodeToken(result.accessToken.token);
      const refreshDecoded = tokenService.decodeToken(result.refreshToken.token);
      
      expect(accessDecoded.payload.sessionId).toBe(result.sessionId);
      expect(refreshDecoded.payload.sessionId).toBe(result.sessionId);
      expect(accessDecoded.payload.sessionId).toBe(refreshDecoded.payload.sessionId);
    });
  });

  describe('verifyAccessToken', () => {
    test('should verify valid access token', () => {
      const tokenResult = tokenService.generateAccessToken(mockUser);
      const verifyResult = tokenService.verifyAccessToken(tokenResult.token);
      
      expect(verifyResult.isValid).toBe(true);
      expect(verifyResult.payload).toBeDefined();
      expect(verifyResult.error).toBeNull();
      expect(verifyResult.payload.userId).toBe(mockUser._id.toString());
    });

    test('should reject invalid token', () => {
      const verifyResult = tokenService.verifyAccessToken('invalid-token');
      
      expect(verifyResult.isValid).toBe(false);
      expect(verifyResult.payload).toBeNull();
      expect(verifyResult.error).toBeDefined();
    });

    test('should reject refresh token as access token', () => {
      const refreshResult = tokenService.generateRefreshToken(mockUser);
      const verifyResult = tokenService.verifyAccessToken(refreshResult.token);
      
      expect(verifyResult.isValid).toBe(false);
      expect(verifyResult.error).toBeDefined();
    });
  });

  describe('verifyRefreshToken', () => {
    test('should verify valid refresh token', () => {
      const tokenResult = tokenService.generateRefreshToken(mockUser);
      const verifyResult = tokenService.verifyRefreshToken(tokenResult.token);
      
      expect(verifyResult.isValid).toBe(true);
      expect(verifyResult.payload).toBeDefined();
      expect(verifyResult.error).toBeNull();
      expect(verifyResult.payload.userId).toBe(mockUser._id.toString());
    });

    test('should reject access token as refresh token', () => {
      const accessResult = tokenService.generateAccessToken(mockUser);
      const verifyResult = tokenService.verifyRefreshToken(accessResult.token);
      
      expect(verifyResult.isValid).toBe(false);
      expect(verifyResult.error).toBeDefined();
    });
  });

  describe('isTokenExpired', () => {
    test('should detect non-expired token', () => {
      const tokenResult = tokenService.generateAccessToken(mockUser);
      const isExpired = tokenService.isTokenExpired(tokenResult.token);
      
      expect(isExpired).toBe(false);
    });

    test('should detect expired token', () => {
      // Create a token that's already expired by using a past timestamp
      const jwt = require('jsonwebtoken');
      const config = require('../../utils/config');
      
      const payload = {
        userId: mockUser._id.toString(),
        username: mockUser.username,
        email: mockUser.email,
        type: 'access',
        iat: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        exp: Math.floor(Date.now() / 1000) - 1800, // 30 minutes ago (expired)
      };
      
      const expiredToken = jwt.sign(payload, config.jwt.secret, { noTimestamp: true });
      const isExpired = tokenService.isTokenExpired(expiredToken);
      expect(isExpired).toBe(true);
    });

    test('should handle invalid token', () => {
      const isExpired = tokenService.isTokenExpired('invalid-token');
      expect(isExpired).toBe(true);
    });
  });

  describe('getTokenExpiration', () => {
    test('should return correct expiration date', () => {
      const tokenResult = tokenService.generateAccessToken(mockUser);
      const expiration = tokenService.getTokenExpiration(tokenResult.token);
      
      expect(expiration).toBeInstanceOf(Date);
      expect(expiration.getTime()).toBeCloseTo(tokenResult.expiresAt.getTime(), -3);
    });

    test('should return null for invalid token', () => {
      const expiration = tokenService.getTokenExpiration('invalid-token');
      expect(expiration).toBeNull();
    });
  });

  describe('shouldRefreshToken', () => {
    test('should recommend refresh for token near expiry', () => {
      // Generate token with 1 minute expiry
      const tokenResult = tokenService.generateAccessToken(mockUser, { expiresIn: '1m' });
      
      // Should recommend refresh (default threshold is 5 minutes)
      const shouldRefresh = tokenService.shouldRefreshToken(tokenResult.token);
      expect(shouldRefresh).toBe(true);
    });

    test('should not recommend refresh for fresh token', () => {
      // Generate token with 1 hour expiry
      const tokenResult = tokenService.generateAccessToken(mockUser, { expiresIn: '1h' });
      
      // Should not recommend refresh
      const shouldRefresh = tokenService.shouldRefreshToken(tokenResult.token);
      expect(shouldRefresh).toBe(false);
    });
  });

  describe('extractTokenFromHeader', () => {
    test('should extract token from valid Bearer header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const header = `Bearer ${token}`;
      
      const extracted = tokenService.extractTokenFromHeader(header);
      expect(extracted).toBe(token);
    });

    test('should return null for invalid header format', () => {
      expect(tokenService.extractTokenFromHeader('InvalidHeader')).toBeNull();
      expect(tokenService.extractTokenFromHeader('Basic token')).toBeNull();
      expect(tokenService.extractTokenFromHeader('')).toBeNull();
      expect(tokenService.extractTokenFromHeader(null)).toBeNull();
    });
  });

  describe('createAuthHeader', () => {
    test('should create valid authorization header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const header = tokenService.createAuthHeader(token);
      
      expect(header).toBe(`Bearer ${token}`);
    });
  });

  describe('refreshAccessToken', () => {
    test('should refresh access token with valid refresh token', () => {
      const tokenPair = tokenService.generateTokenPair(mockUser);
      
      const refreshResult = tokenService.refreshAccessToken(
        tokenPair.refreshToken.token,
        mockUser
      );
      
      expect(refreshResult.success).toBe(true);
      expect(refreshResult.tokens).toBeDefined();
      expect(refreshResult.tokens.accessToken).toBeDefined();
      expect(refreshResult.tokens.refreshToken).toBeDefined();
      expect(refreshResult.oldRefreshTokenId).toBe(tokenPair.refreshToken.tokenId);
    });

    test('should reject refresh with invalid token', () => {
      const refreshResult = tokenService.refreshAccessToken('invalid-token', mockUser);
      
      expect(refreshResult.success).toBe(false);
      expect(refreshResult.error).toBeDefined();
    });

    test('should reject refresh token for different user', () => {
      const tokenPair = tokenService.generateTokenPair(mockUser);
      const differentUser = {
        _id: new ObjectId(),
        username: 'different',
        email: 'different@example.com',
      };
      
      const refreshResult = tokenService.refreshAccessToken(
        tokenPair.refreshToken.token,
        differentUser
      );
      
      expect(refreshResult.success).toBe(false);
      expect(refreshResult.error).toBe('Token does not belong to user');
    });
  });

  describe('validateTokenClaims', () => {
    test('should validate matching claims', () => {
      const payload = {
        userId: 'user123',
        sessionId: 'session123',
        ipAddress: '192.168.1.1',
        iat: Math.floor(Date.now() / 1000),
      };
      
      const requirements = {
        userId: 'user123',
        sessionId: 'session123',
        ipAddress: '192.168.1.1',
      };
      
      const result = tokenService.validateTokenClaims(payload, requirements);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject mismatched claims', () => {
      const payload = {
        userId: 'user123',
        sessionId: 'session123',
        ipAddress: '192.168.1.1',
        iat: Math.floor(Date.now() / 1000),
      };
      
      const requirements = {
        userId: 'user456',
        sessionId: 'session456',
      };
      
      const result = tokenService.validateTokenClaims(payload, requirements);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getTokenInfo', () => {
    test('should return token information', () => {
      const tokenResult = tokenService.generateAccessToken(mockUser);
      const info = tokenService.getTokenInfo(tokenResult.token);
      
      expect(info).toBeDefined();
      expect(info.userId).toBe(mockUser._id.toString());
      expect(info.username).toBe(mockUser.username);
      expect(info.email).toBe(mockUser.email);
      expect(info.type).toBe('access');
      expect(info.issuedAt).toBeInstanceOf(Date);
      expect(info.expiresAt).toBeInstanceOf(Date);
      expect(info.isExpired).toBe(false);
    });

    test('should return null for invalid token', () => {
      const info = tokenService.getTokenInfo('invalid-token');
      expect(info).toBeNull();
    });
  });

  describe('validateConfiguration', () => {
    test('should validate proper configuration', () => {
      const result = tokenService.validateConfiguration();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('generateTokenId', () => {
    test('should generate unique token IDs', () => {
      const id1 = tokenService.generateTokenId();
      const id2 = tokenService.generateTokenId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBe(32); // 16 bytes = 32 hex chars
    });

    test('should respect custom length', () => {
      const id = tokenService.generateTokenId(8);
      expect(id.length).toBe(16); // 8 bytes = 16 hex chars
    });
  });
});