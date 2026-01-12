/**
 * Token Service
 * Handles JWT token generation, validation, and refresh logic
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../utils/config');

class TokenService {
  constructor() {
    this.accessTokenSecret = config.jwt.secret;
    this.refreshTokenSecret = config.jwt.refreshSecret;
    this.accessTokenExpiry = config.jwt.expiresIn;
    this.refreshTokenExpiry = config.jwt.refreshExpiresIn;
  }

  /**
   * Generate access token for a user
   * @param {Object} user - User object
   * @param {Object} options - Token options
   * @returns {Object} Token information
   */
  generateAccessToken(user, options = {}) {
    if (!user || !user._id) {
      throw new Error('User object with _id is required');
    }

    const payload = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
    };

    // Add optional claims
    if (options.sessionId) {
      payload.sessionId = options.sessionId.toString();
    }

    if (options.ipAddress) {
      payload.ipAddress = options.ipAddress;
    }

    const tokenOptions = {
      expiresIn: options.expiresIn || this.accessTokenExpiry,
      issuer: 'mozambique-portal',
      audience: 'mozambique-portal-users',
      subject: user._id.toString(),
    };

    const token = jwt.sign(payload, this.accessTokenSecret, tokenOptions);
    const decoded = jwt.decode(token);

    return {
      token,
      expiresAt: new Date(decoded.exp * 1000),
      expiresIn: decoded.exp - decoded.iat,
      type: 'Bearer',
    };
  }

  /**
   * Generate refresh token
   * @param {Object} user - User object
   * @param {Object} options - Token options
   * @returns {Object} Token information
   */
  generateRefreshToken(user, options = {}) {
    if (!user || !user._id) {
      throw new Error('User object with _id is required');
    }

    const payload = {
      userId: user._id.toString(),
      type: 'refresh',
      tokenId: crypto.randomBytes(16).toString('hex'),
      iat: Math.floor(Date.now() / 1000),
    };

    // Add optional claims
    if (options.sessionId) {
      payload.sessionId = options.sessionId.toString();
    }

    const tokenOptions = {
      expiresIn: options.expiresIn || this.refreshTokenExpiry,
      issuer: 'mozambique-portal',
      audience: 'mozambique-portal-users',
      subject: user._id.toString(),
    };

    const token = jwt.sign(payload, this.refreshTokenSecret, tokenOptions);
    const decoded = jwt.decode(token);

    return {
      token,
      tokenId: payload.tokenId,
      expiresAt: new Date(decoded.exp * 1000),
      expiresIn: decoded.exp - decoded.iat,
      type: 'refresh',
    };
  }

  /**
   * Generate both access and refresh tokens
   * @param {Object} user - User object
   * @param {Object} options - Token options
   * @returns {Object} Token pair
   */
  generateTokenPair(user, options = {}) {
    const sessionId = options.sessionId || crypto.randomBytes(16).toString('hex');
    
    const accessToken = this.generateAccessToken(user, {
      ...options,
      sessionId,
    });

    const refreshToken = this.generateRefreshToken(user, {
      ...options,
      sessionId,
    });

    return {
      accessToken,
      refreshToken,
      sessionId,
    };
  }

  /**
   * Verify and decode access token
   * @param {string} token - JWT token
   * @returns {Object} Decoded token payload
   */
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'mozambique-portal',
        audience: 'mozambique-portal-users',
      });

      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      return {
        isValid: true,
        payload: decoded,
        error: null,
      };
    } catch (error) {
      return {
        isValid: false,
        payload: null,
        error: this.getTokenError(error),
      };
    }
  }

  /**
   * Verify and decode refresh token
   * @param {string} token - JWT refresh token
   * @returns {Object} Decoded token payload
   */
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'mozambique-portal',
        audience: 'mozambique-portal-users',
      });

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return {
        isValid: true,
        payload: decoded,
        error: null,
      };
    } catch (error) {
      return {
        isValid: false,
        payload: null,
        error: this.getTokenError(error),
      };
    }
  }

  /**
   * Decode token without verification (for expired tokens)
   * @param {string} token - JWT token
   * @returns {Object} Decoded token payload or null
   */
  decodeToken(token) {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired
   * @param {string} token - JWT token
   * @returns {boolean} True if token is expired
   */
  isTokenExpired(token) {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.payload.exp) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.payload.exp < currentTime;
  }

  /**
   * Get token expiration time
   * @param {string} token - JWT token
   * @returns {Date|null} Expiration date or null
   */
  getTokenExpiration(token) {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.payload.exp) {
      return null;
    }

    return new Date(decoded.payload.exp * 1000);
  }

  /**
   * Get time until token expires
   * @param {string} token - JWT token
   * @returns {number} Seconds until expiration, or 0 if expired
   */
  getTimeUntilExpiry(token) {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.payload.exp) {
      return 0;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const timeLeft = decoded.payload.exp - currentTime;
    return Math.max(0, timeLeft);
  }

  /**
   * Check if token needs refresh (within threshold)
   * @param {string} token - JWT token
   * @param {number} thresholdMinutes - Minutes before expiry to refresh (default: 5)
   * @returns {boolean} True if token should be refreshed
   */
  shouldRefreshToken(token, thresholdMinutes = 5) {
    const timeLeft = this.getTimeUntilExpiry(token);
    const thresholdSeconds = thresholdMinutes * 60;
    return timeLeft <= thresholdSeconds;
  }

  /**
   * Extract token from Authorization header
   * @param {string} authHeader - Authorization header value
   * @returns {string|null} Token or null
   */
  extractTokenFromHeader(authHeader) {
    if (!authHeader || typeof authHeader !== 'string') {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Create authorization header value
   * @param {string} token - JWT token
   * @returns {string} Authorization header value
   */
  createAuthHeader(token) {
    return `Bearer ${token}`;
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Valid refresh token
   * @param {Object} user - User object (for new access token)
   * @param {Object} options - Refresh options
   * @returns {Object} New token pair or error
   */
  refreshAccessToken(refreshToken, user, options = {}) {
    // Verify refresh token
    const refreshResult = this.verifyRefreshToken(refreshToken);
    if (!refreshResult.isValid) {
      return {
        success: false,
        error: refreshResult.error,
      };
    }

    // Check if refresh token belongs to the user
    if (refreshResult.payload.userId !== user._id.toString()) {
      return {
        success: false,
        error: 'Token does not belong to user',
      };
    }

    // Generate new token pair
    try {
      const tokenPair = this.generateTokenPair(user, {
        sessionId: refreshResult.payload.sessionId,
        ipAddress: options.ipAddress,
      });

      return {
        success: true,
        tokens: tokenPair,
        oldRefreshTokenId: refreshResult.payload.tokenId,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Blacklist a token (for logout)
   * Note: This would typically store the token ID in a blacklist cache/database
   * @param {string} token - Token to blacklist
   * @returns {Object} Blacklist result
   */
  blacklistToken(token) {
    const decoded = this.decodeToken(token);
    if (!decoded) {
      return {
        success: false,
        error: 'Invalid token format',
      };
    }

    // In a real implementation, you would store this in Redis or database
    // For now, we'll just return success
    return {
      success: true,
      tokenId: decoded.payload.tokenId || decoded.payload.jti,
      expiresAt: new Date(decoded.payload.exp * 1000),
    };
  }

  /**
   * Validate token claims
   * @param {Object} payload - Decoded token payload
   * @param {Object} requirements - Required claims
   * @returns {Object} Validation result
   */
  validateTokenClaims(payload, requirements = {}) {
    const errors = [];

    // Check required claims
    if (requirements.userId && payload.userId !== requirements.userId) {
      errors.push('Token userId does not match requirement');
    }

    if (requirements.sessionId && payload.sessionId !== requirements.sessionId) {
      errors.push('Token sessionId does not match requirement');
    }

    if (requirements.ipAddress && payload.ipAddress !== requirements.ipAddress) {
      errors.push('Token IP address does not match requirement');
    }

    // Check token age
    if (requirements.maxAge) {
      const tokenAge = Math.floor(Date.now() / 1000) - payload.iat;
      if (tokenAge > requirements.maxAge) {
        errors.push('Token is too old');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get user-friendly error message for token errors
   * @param {Error} error - JWT error
   * @returns {string} User-friendly error message
   */
  getTokenError(error) {
    switch (error.name) {
      case 'TokenExpiredError':
        return 'Token has expired';
      case 'JsonWebTokenError':
        return 'Invalid token';
      case 'NotBeforeError':
        return 'Token not active yet';
      default:
        return 'Token validation failed';
    }
  }

  /**
   * Generate secure random token ID
   * @param {number} length - Token length in bytes (default: 16)
   * @returns {string} Random token ID
   */
  generateTokenId(length = 16) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Get token information without verification
   * @param {string} token - JWT token
   * @returns {Object} Token information
   */
  getTokenInfo(token) {
    const decoded = this.decodeToken(token);
    if (!decoded) {
      return null;
    }

    const payload = decoded.payload;
    const currentTime = Math.floor(Date.now() / 1000);

    return {
      userId: payload.userId,
      username: payload.username,
      email: payload.email,
      type: payload.type,
      sessionId: payload.sessionId,
      issuedAt: new Date(payload.iat * 1000),
      expiresAt: new Date(payload.exp * 1000),
      isExpired: payload.exp < currentTime,
      timeUntilExpiry: Math.max(0, payload.exp - currentTime),
    };
  }

  /**
   * Validate token configuration
   * @returns {Object} Configuration validation result
   */
  validateConfiguration() {
    const errors = [];

    if (!this.accessTokenSecret || this.accessTokenSecret.length < 32) {
      errors.push('Access token secret is too short (minimum 32 characters)');
    }

    if (!this.refreshTokenSecret || this.refreshTokenSecret.length < 32) {
      errors.push('Refresh token secret is too short (minimum 32 characters)');
    }

    if (this.accessTokenSecret === this.refreshTokenSecret) {
      errors.push('Access and refresh token secrets must be different');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = TokenService;