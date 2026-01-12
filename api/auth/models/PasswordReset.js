/**
 * PasswordReset Model
 * MongoDB schema and operations for password reset token management
 */

const { ObjectId } = require('mongodb');
const crypto = require('crypto');
const config = require('../utils/config');

class PasswordReset {
  constructor(db) {
    this.db = db;
    this.collection = db.collection(config.database.collections.passwordResets);
    this.initializeIndexes();
  }

  /**
   * Initialize database indexes for optimal performance
   */
  async initializeIndexes() {
    try {
      // Index for reset token lookups
      await this.collection.createIndex({ resetToken: 1 });
      
      // TTL index for automatic token cleanup
      await this.collection.createIndex(
        { expiresAt: 1 }, 
        { expireAfterSeconds: 0 }
      );
      
      // Index for user lookups
      await this.collection.createIndex({ userId: 1 });
      
      // Compound index for efficient queries
      await this.collection.createIndex({ userId: 1, used: 1 });
      
      console.log('PasswordReset collection indexes created successfully');
    } catch (error) {
      console.error('Error creating password reset indexes:', error);
    }
  }

  /**
   * Create a new password reset token
   * @param {Object} resetData - Reset token data
   * @param {string|ObjectId} resetData.userId - User ID
   * @param {string} resetData.ipAddress - Client IP address
   * @returns {Promise<Object>} Created reset token object with plain token
   */
  async create(resetData) {
    const { userId, ipAddress } = resetData;

    // Validate required fields
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Convert userId to ObjectId if it's a string
    const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    // Generate secure reset token
    const plainToken = this.generateToken(config.security.resetTokenLength);
    const hashedToken = this.hashToken(plainToken);

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + config.passwordReset.tokenExpiryHours);

    // Invalidate any existing unused tokens for this user
    await this.invalidateExistingTokens(userObjectId);

    // Create reset token document
    const resetDoc = {
      userId: userObjectId,
      resetToken: hashedToken,
      expiresAt,
      createdAt: new Date(),
      used: false,
      ipAddress: ipAddress || null,
    };

    const result = await this.collection.insertOne(resetDoc);
    
    return {
      _id: result.insertedId,
      ...resetDoc,
      plainToken, // Return the plain token for email sending
    };
  }

  /**
   * Find reset token by token value
   * @param {string} token - Reset token
   * @returns {Promise<Object|null>} Reset token object or null
   */
  async findByToken(token) {
    const hashedToken = this.hashToken(token);
    return await this.collection.findOne({
      resetToken: hashedToken,
      used: false,
      expiresAt: { $gt: new Date() }
    });
  }

  /**
   * Find all reset tokens for a user
   * @param {string|ObjectId} userId - User ID
   * @param {boolean} includeUsed - Include used tokens (default: false)
   * @returns {Promise<Array>} Array of reset token objects
   */
  async findByUserId(userId, includeUsed = false) {
    const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    
    const query = { userId: userObjectId };
    if (!includeUsed) {
      query.used = false;
      query.expiresAt = { $gt: new Date() };
    }

    return await this.collection.find(query)
      .sort({ createdAt: -1 })
      .toArray();
  }

  /**
   * Mark a reset token as used
   * @param {string} token - Reset token
   * @returns {Promise<Object>} Update result
   */
  async markAsUsed(token) {
    const hashedToken = this.hashToken(token);
    
    return await this.collection.updateOne(
      { 
        resetToken: hashedToken,
        used: false,
        expiresAt: { $gt: new Date() }
      },
      { 
        $set: { 
          used: true,
          usedAt: new Date()
        } 
      }
    );
  }

  /**
   * Invalidate all existing tokens for a user
   * @param {string|ObjectId} userId - User ID
   * @returns {Promise<Object>} Update result
   */
  async invalidateExistingTokens(userId) {
    const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    
    return await this.collection.updateMany(
      { 
        userId: userObjectId,
        used: false 
      },
      { 
        $set: { 
          used: true,
          usedAt: new Date()
        } 
      }
    );
  }

  /**
   * Clean up expired and used tokens
   * @returns {Promise<Object>} Delete result
   */
  async cleanupExpired() {
    return await this.collection.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { used: true }
      ]
    });
  }

  /**
   * Check if user has exceeded reset attempts
   * @param {string|ObjectId} userId - User ID
   * @param {number} timeWindowHours - Time window in hours (default: 1)
   * @returns {Promise<Object>} Rate limit check result
   */
  async checkRateLimit(userId, timeWindowHours = 1) {
    const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    
    const timeWindow = new Date();
    timeWindow.setHours(timeWindow.getHours() - timeWindowHours);

    const recentAttempts = await this.collection.countDocuments({
      userId: userObjectId,
      createdAt: { $gte: timeWindow }
    });

    const maxAttempts = config.passwordReset.maxResetAttempts;
    
    return {
      isAllowed: recentAttempts < maxAttempts,
      attemptsUsed: recentAttempts,
      maxAttempts,
      timeWindowHours,
      nextAllowedAt: recentAttempts >= maxAttempts ? 
        new Date(Date.now() + (timeWindowHours * 60 * 60 * 1000)) : null
    };
  }

  /**
   * Get reset token statistics for a user
   * @param {string|ObjectId} userId - User ID
   * @returns {Promise<Object>} Reset token statistics
   */
  async getResetStats(userId) {
    const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    
    const [activeCount, usedCount, totalCount] = await Promise.all([
      this.collection.countDocuments({
        userId: userObjectId,
        used: false,
        expiresAt: { $gt: new Date() }
      }),
      this.collection.countDocuments({
        userId: userObjectId,
        used: true
      }),
      this.collection.countDocuments({
        userId: userObjectId
      })
    ]);

    return {
      activeTokens: activeCount,
      usedTokens: usedCount,
      totalTokens: totalCount,
    };
  }

  /**
   * Validate reset token
   * @param {string} token - Reset token to validate
   * @returns {Promise<Object>} Validation result
   */
  async validateToken(token) {
    if (!token) {
      return {
        isValid: false,
        error: 'Reset token is required'
      };
    }

    const resetToken = await this.findByToken(token);
    
    if (!resetToken) {
      return {
        isValid: false,
        error: 'Invalid or expired reset token'
      };
    }

    if (resetToken.used) {
      return {
        isValid: false,
        error: 'Reset token has already been used'
      };
    }

    if (resetToken.expiresAt <= new Date()) {
      return {
        isValid: false,
        error: 'Reset token has expired'
      };
    }

    return {
      isValid: true,
      resetToken
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
   * Generate a URL-safe reset token
   * @returns {string} URL-safe reset token
   */
  generateUrlSafeToken() {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Validate reset data
   * @param {Object} resetData - Reset data to validate
   * @returns {Object} Validation result
   */
  validateResetData(resetData) {
    const errors = [];
    
    if (!resetData.userId) {
      errors.push('User ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = PasswordReset;