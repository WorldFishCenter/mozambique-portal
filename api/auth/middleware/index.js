/**
 * Authentication Middleware Index
 * Exports all authentication middleware
 */

const createAuthMiddleware = require('./authMiddleware');

module.exports = {
  createAuthMiddleware,
  authMiddleware: createAuthMiddleware, // Alias for backward compatibility
};