/**
 * Session Model
 * MongoDB schema and operations for user session management
 */

const { ObjectId } = require('mongodb');
const crypto = require('crypto');
const config = require('../utils/config');

class Session {
  constructor(db) {
    this.db = db;
    this.collection = db.collection(config.database.collections.sessions);
    this.initializeIndexes();
  }

  /**
   * Initialize database indexes for optimal performance
   */
  async initializeIndexes() {
    try {
      // Index for user sessions
      await this.collection.createIndex({ userId: 1 });
      
      // Index for refresh token lookups
      await this.collection.createIndex({ refreshToken: 1 });
      
      // TTL index for automatic session cleanup
      await this.collection.createIndex(
        { expiresAt: 1 }, 
        { expireAfterSeconds: 0 }
      );
      
      // Index for active sessions
      await this.collection.createIndex({ isActive: 1 });
      
      // Compound index for efficient queries
      await this.collection.createIndex({ userId: 1, isActive: 1 });
      
      console.log('Session collection indexes created successfully');
    } catch (error) {
      console.error('Error creating session indexes:', error);
    }
  }

  /**
   * Create a new session
   * @param {Object} sessionData - Session data
   * @param {string|ObjectId} sessionData.userId - User ID
   * @param {string} sessionData.refreshToken - Hashed refresh token
   * @param {string} sessionData.accessToken - Hashed access token
   * @param {Date} sessionData.expiresAt - Session expiration date
   * @param {string} sessionData.ipAddress - Client IP address
   * @param {string} sessionData.userAgent - Client user agent
   * @returns {Promise<Object>} Created session object
   */
  async create(sessionData) {
    const { userId, refreshToken, accessToken, expiresAt, ipAddress, userAgent } = sessionData;

    // Validate required fields
    if (!userId || !refreshToken || !accessToken || !expiresAt) {
      throw new Error('userId, refreshToken, accessToken, and expiresAt are required');
    }

    // Convert userId to ObjectId if it's a string
    const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    // Create session document
    const sessionDoc = {
      userId: userObjectId,
      refreshToken: this.hashToken(refreshToken),
      accessToken: this.hashToken(accessToken),
      expiresAt: new Date(expiresAt),
      createdAt: new Date(),
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      isActive: true,
    };

    const result = await this.collection.insertOne(sessionDoc);
    
    return {
      _id: result.insertedId,
      ...sessionDoc,
    };
  }

  /**
   * Find session by refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object|null>} Session object or null
   */
  async findByRefreshToken(refreshToken) {
    const hashedToken = this.hashToken(refreshToken);
    return await this.collection.findOne({
      refreshToken: hashedToken,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });
  }

  /**
   * Find session by access token
   * @param {string} accessToken - Access token
   * @returns {Promise<Object|null>} Session object or null
   */
  async findByAccessToken(accessToken) {
    const hashedToken = this.hashToken(accessToken);
    return await this.collection.findOne({
      accessToken: hashedToken,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });
  }

  /**
   * Find all active sessions for a user
   * @param {string|ObjectId} userId - User ID
   * @returns {Promise<Array>} Array of session objects
   */
  async findByUserId(userId) {
    const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    return await this.collection.find({
      userId: userObjectId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 }).toArray();
  }

  /**
   * Update session tokens
   * @param {string|ObjectId} sessionId - Session ID
   * @param {string} newRefreshToken - New refresh token
   * @param {string} newAccessToken - New access token
   * @param {Date} newExpiresAt - New expiration date
   * @returns {Promise<Object>} Update result
   */
  async updateTokens(sessionId, newRefreshToken, newAccessToken, newExpiresAt) {
    const sessionObjectId = typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId;
    
    return await this.collection.updateOne(
      { _id: sessionObjectId, isActive: true },
      {
        $set: {
          refreshToken: this.hashToken(newRefreshToken),
          accessToken: this.hashToken(newAccessToken),
          expiresAt: new Date(newExpiresAt),
        }
      }
    );
  }

  /**
   * Invalidate a specific session
   * @param {string|ObjectId} sessionId - Session ID
   * @returns {Promise<Object>} Update result
   */
  async invalidate(sessionId) {
    const sessionObjectId = typeof sessionId === 'string' ? new ObjectId(sessionId) : sessionId;
    
    return await this.collection.updateOne(
      { _id: sessionObjectId },
      { $set: { isActive: false } }
    );
  }

  /**
   * Invalidate session by refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} Update result
   */
  async invalidateByRefreshToken(refreshToken) {
    const hashedToken = this.hashToken(refreshToken);
    
    return await this.collection.updateOne(
      { refreshToken: hashedToken },
      { $set: { isActive: false } }
    );
  }

  /**
   * Invalidate all sessions for a user
   * @param {string|ObjectId} userId - User ID
   * @returns {Promise<Object>} Update result
   */
  async invalidateAllForUser(userId) {
    const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    
    return await this.collection.updateMany(
      { userId: userObjectId, isActive: true },
      { $set: { isActive: false } }
    );
  }

  /**
   * Clean up expired sessions
   * @returns {Promise<Object>} Delete result
   */
  async cleanupExpired() {
    return await this.collection.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { isActive: false }
      ]
    });
  }

  /**
   * Enforce maximum sessions per user
   * @param {string|ObjectId} userId - User ID
   * @returns {Promise<void>}
   */
  async enforceMaxSessions(userId) {
    const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    const maxSessions = config.session.maxActiveSessions;
    
    // Get all active sessions for user, sorted by creation date (newest first)
    const sessions = await this.collection.find({
      userId: userObjectId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 }).toArray();

    // If we have more than the maximum, invalidate the oldest ones
    if (sessions.length > maxSessions) {
      const sessionsToInvalidate = sessions.slice(maxSessions);
      const sessionIds = sessionsToInvalidate.map(session => session._id);
      
      await this.collection.updateMany(
        { _id: { $in: sessionIds } },
        { $set: { isActive: false } }
      );
    }
  }

  /**
   * Get session statistics for a user
   * @param {string|ObjectId} userId - User ID
   * @returns {Promise<Object>} Session statistics
   */
  async getSessionStats(userId) {
    const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    
    const [activeCount, totalCount] = await Promise.all([
      this.collection.countDocuments({
        userId: userObjectId,
        isActive: true,
        expiresAt: { $gt: new Date() }
      }),
      this.collection.countDocuments({
        userId: userObjectId
      })
    ]);

    return {
      activeSessions: activeCount,
      totalSessions: totalCount,
    };
  }

  /**
   * Hash a token for secure storage
   * @param {string} token - Token to hash
   * @returns {string} Hashed token
   */
  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generate a secure random token
   * @param {number} length - Token length in bytes (default: 32)
   * @returns {string} Random token
   */
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Validate session data
   * @param {Object} sessionData - Session data to validate
   * @returns {Object} Validation result
   */
  validateSessionData(sessionData) {
    const errors = [];
    
    if (!sessionData.userId) {
      errors.push('User ID is required');
    }
    
    if (!sessionData.refreshToken) {
      errors.push('Refresh token is required');
    }
    
    if (!sessionData.accessToken) {
      errors.push('Access token is required');
    }
    
    if (!sessionData.expiresAt) {
      errors.push('Expiration date is required');
    } else if (new Date(sessionData.expiresAt) <= new Date()) {
      errors.push('Expiration date must be in the future');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = Session;