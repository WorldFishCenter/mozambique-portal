/**
 * User Model
 * MongoDB schema and operations for user management
 */

const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const config = require('../utils/config');

class User {
  constructor(db) {
    this.db = db;
    this.collection = db.collection(config.database.collections.users);
    this.initializeIndexes();
  }

  /**
   * Initialize database indexes for optimal performance
   */
  async initializeIndexes() {
    try {
      // Unique indexes for username and email
      await this.collection.createIndex({ username: 1 }, { unique: true });
      await this.collection.createIndex({ email: 1 }, { unique: true });
      
      // Compound index for efficient lookups
      await this.collection.createIndex({ username: 1, email: 1 });
      
      // Index for active users
      await this.collection.createIndex({ isActive: 1 });
      
      console.log('User collection indexes created successfully');
    } catch (error) {
      console.error('Error creating user indexes:', error);
    }
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @param {string} userData.username - Username
   * @param {string} userData.email - Email address
   * @param {string} userData.password - Plain text password
   * @param {Object} userData.profile - Optional profile data
   * @returns {Promise<Object>} Created user object
   */
  async create(userData) {
    const { username, email, password, profile = {} } = userData;

    // Validate required fields
    if (!username || !email || !password) {
      throw new Error('Username, email, and password are required');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, config.password.saltRounds);

    // Create user document
    const userDoc = {
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      createdAt: new Date(),
      lastLoginAt: null,
      isActive: true,
      emailVerified: false,
      profile: {
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        organization: profile.organization || '',
      },
    };

    try {
      const result = await this.collection.insertOne(userDoc);
      
      // Return user without password hash
      const { passwordHash: _, ...userWithoutPassword } = userDoc;
      return {
        _id: result.insertedId,
        ...userWithoutPassword,
      };
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key error
        const field = error.keyPattern.username ? 'username' : 'email';
        throw new Error(`${field} already exists`);
      }
      throw error;
    }
  }

  /**
   * Find user by username
   * @param {string} username - Username to search for
   * @returns {Promise<Object|null>} User object or null
   */
  async findByUsername(username) {
    return await this.collection.findOne({ 
      username: username.toLowerCase().trim(),
      isActive: true 
    });
  }

  /**
   * Find user by email
   * @param {string} email - Email to search for
   * @returns {Promise<Object|null>} User object or null
   */
  async findByEmail(email) {
    return await this.collection.findOne({ 
      email: email.toLowerCase().trim(),
      isActive: true 
    });
  }

  /**
   * Find user by ID
   * @param {string|ObjectId} userId - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  async findById(userId) {
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    return await this.collection.findOne({ 
      _id: objectId,
      isActive: true 
    });
  }

  /**
   * Verify user password
   * @param {string} password - Plain text password
   * @param {string} passwordHash - Stored password hash
   * @returns {Promise<boolean>} True if password matches
   */
  async verifyPassword(password, passwordHash) {
    return await bcrypt.compare(password, passwordHash);
  }

  /**
   * Update user's last login timestamp
   * @param {string|ObjectId} userId - User ID
   * @returns {Promise<Object>} Update result
   */
  async updateLastLogin(userId) {
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    return await this.collection.updateOne(
      { _id: objectId },
      { $set: { lastLoginAt: new Date() } }
    );
  }

  /**
   * Update user password
   * @param {string|ObjectId} userId - User ID
   * @param {string} newPassword - New plain text password
   * @returns {Promise<Object>} Update result
   */
  async updatePassword(userId, newPassword) {
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    const passwordHash = await bcrypt.hash(newPassword, config.password.saltRounds);
    
    return await this.collection.updateOne(
      { _id: objectId },
      { $set: { passwordHash } }
    );
  }

  /**
   * Update user profile
   * @param {string|ObjectId} userId - User ID
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Update result
   */
  async updateProfile(userId, profileData) {
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    
    const updateData = {};
    if (profileData.firstName !== undefined) updateData['profile.firstName'] = profileData.firstName;
    if (profileData.lastName !== undefined) updateData['profile.lastName'] = profileData.lastName;
    if (profileData.organization !== undefined) updateData['profile.organization'] = profileData.organization;
    if (profileData.emailVerified !== undefined) updateData.emailVerified = profileData.emailVerified;

    return await this.collection.updateOne(
      { _id: objectId },
      { $set: updateData }
    );
  }

  /**
   * Deactivate user account
   * @param {string|ObjectId} userId - User ID
   * @returns {Promise<Object>} Update result
   */
  async deactivate(userId) {
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    return await this.collection.updateOne(
      { _id: objectId },
      { $set: { isActive: false } }
    );
  }

  /**
   * Get user without password hash
   * @param {Object} user - User object from database
   * @returns {Object} User object without password hash
   */
  sanitizeUser(user) {
    if (!user) return null;
    
    const { passwordHash, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  /**
   * Validate user data
   * @param {Object} userData - User data to validate
   * @returns {Object} Validation result
   */
  validateUserData(userData) {
    const errors = [];
    
    // Username validation
    if (!userData.username) {
      errors.push('Username is required');
    } else if (userData.username.length < 3) {
      errors.push('Username must be at least 3 characters');
    } else if (userData.username.length > 30) {
      errors.push('Username must be less than 30 characters');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(userData.username)) {
      errors.push('Username can only contain letters, numbers, hyphens, and underscores');
    }

    // Email validation
    if (!userData.email) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.push('Please enter a valid email address');
    }

    // Password validation
    if (!userData.password) {
      errors.push('Password is required');
    } else {
      if (userData.password.length < config.password.minLength) {
        errors.push(`Password must be at least ${config.password.minLength} characters`);
      }
      if (config.password.requireUppercase && !/[A-Z]/.test(userData.password)) {
        errors.push('Password must contain at least one uppercase letter');
      }
      if (config.password.requireLowercase && !/[a-z]/.test(userData.password)) {
        errors.push('Password must contain at least one lowercase letter');
      }
      if (config.password.requireNumbers && !/\d/.test(userData.password)) {
        errors.push('Password must contain at least one number');
      }
      if (config.password.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(userData.password)) {
        errors.push('Password must contain at least one special character');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = User;