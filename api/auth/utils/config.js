/**
 * Authentication Configuration
 * Centralized configuration for authentication system
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const config = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Password Configuration
  password: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
  },

  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxAttempts: parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS) || 5,
    skipSuccessfulRequests: true,
    skipFailedRequests: false,
  },

  // AWS SES Configuration
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sesFromEmail: process.env.AWS_SES_FROM_EMAIL || 'noreply@example.com',
  },

  // Session Configuration
  session: {
    maxActiveSessions: 5, // Maximum concurrent sessions per user
    cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  },

  // Password Reset Configuration
  passwordReset: {
    tokenExpiryHours: 1, // Password reset tokens expire in 1 hour
    maxResetAttempts: 3, // Maximum reset attempts per hour
  },

  // Database Configuration
  database: {
    collections: {
      users: 'users',
      sessions: 'user_sessions',
      passwordResets: 'password_resets',
    },
  },

  // Security Configuration
  security: {
    csrfTokenLength: 32,
    sessionTokenLength: 64,
    resetTokenLength: 32,
  },
};

// Validation function to ensure required environment variables are set
const validateConfig = () => {
  const requiredEnvVars = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missingVars.join(', ')}`);
    console.warn('Using fallback values. Please set these in production.');
  }

  // Validate AWS configuration if email features are needed
  if (!config.aws.accessKeyId || !config.aws.secretAccessKey) {
    console.warn('Warning: AWS credentials not configured. Email features will not work.');
  }
};

// Run validation on module load
validateConfig();

module.exports = config;