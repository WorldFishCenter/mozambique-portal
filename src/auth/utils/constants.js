/**
 * Authentication Constants
 * Shared constants for authentication system
 */

// Authentication states
export const AUTH_STATES = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  ERROR: 'error',
};

// User roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
};

// Authentication error types
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'invalid_credentials',
  TOKEN_EXPIRED: 'token_expired',
  TOKEN_INVALID: 'token_invalid',
  NETWORK_ERROR: 'network_error',
  SERVER_ERROR: 'server_error',
  VALIDATION_ERROR: 'validation_error',
  RATE_LIMITED: 'rate_limited',
  ACCOUNT_LOCKED: 'account_locked',
  ACCOUNT_INACTIVE: 'account_inactive',
};

// Form validation rules
export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    PATTERN: /^[a-zA-Z0-9_-]+$/,
    RESERVED_NAMES: ['admin', 'root', 'system', 'api', 'www', 'mail', 'ftp'],
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MAX_LENGTH: 254,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: false,
  },
  PROFILE: {
    FIRST_NAME: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 50,
      PATTERN: /^[a-zA-Z\s'-]+$/,
    },
    LAST_NAME: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 50,
      PATTERN: /^[a-zA-Z\s'-]+$/,
    },
  },
};

// Token configuration
export const TOKEN_CONFIG = {
  STORAGE_KEY: 'auth_tokens',
  CSRF_STORAGE_KEY: 'csrf_token',
  REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes in milliseconds
  REFRESH_INTERVAL: 60 * 1000, // Check every minute
};

// API endpoints
export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  VERIFY_TOKEN: '/auth/verify-token',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_RESET_TOKEN: '/auth/verify-reset-token',
  CURRENT_USER: '/auth/me',
  SESSIONS: '/auth/sessions',
  CSRF_TOKEN: '/auth/csrf-token',
  HEALTH: '/auth/health',
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKENS: 'auth_tokens',
  CSRF_TOKEN: 'csrf_token',
  USER_PREFERENCES: 'user_preferences',
  REMEMBER_ME: 'remember_me',
};

// Session configuration
export const SESSION_CONFIG = {
  MAX_SESSIONS: 5,
  CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
  ACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30 minutes
};

// Password reset configuration
export const PASSWORD_RESET_CONFIG = {
  TOKEN_EXPIRY: 60 * 60 * 1000, // 1 hour
  MAX_ATTEMPTS: 3,
  COOLDOWN_PERIOD: 15 * 60 * 1000, // 15 minutes
};

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  LOGIN_ATTEMPTS: 5,
  REGISTRATION_ATTEMPTS: 3,
  PASSWORD_RESET_ATTEMPTS: 3,
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
};

// UI configuration
export const UI_CONFIG = {
  TOAST_DURATION: 5000, // 5 seconds
  LOADING_DELAY: 200, // Show loading after 200ms
  DEBOUNCE_DELAY: 300, // Form validation debounce
  REDIRECT_DELAY: 1000, // Delay before redirect after success
};

// Feature flags
export const FEATURES = {
  REMEMBER_ME: true,
  SOCIAL_LOGIN: false,
  TWO_FACTOR_AUTH: false,
  EMAIL_VERIFICATION: false,
  ACCOUNT_RECOVERY: true,
  SESSION_MANAGEMENT: true,
  SECURITY_NOTIFICATIONS: true,
};

// Error messages
export const ERROR_MESSAGES = {
  [AUTH_ERRORS.INVALID_CREDENTIALS]: 'Invalid username or password',
  [AUTH_ERRORS.TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
  [AUTH_ERRORS.TOKEN_INVALID]: 'Invalid authentication token',
  [AUTH_ERRORS.NETWORK_ERROR]: 'Network error. Please check your connection.',
  [AUTH_ERRORS.SERVER_ERROR]: 'Server error. Please try again later.',
  [AUTH_ERRORS.VALIDATION_ERROR]: 'Please check your input and try again',
  [AUTH_ERRORS.RATE_LIMITED]: 'Too many attempts. Please try again later.',
  [AUTH_ERRORS.ACCOUNT_LOCKED]: 'Your account has been locked. Please contact support.',
  [AUTH_ERRORS.ACCOUNT_INACTIVE]: 'Your account is inactive. Please contact support.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Successfully logged in',
  REGISTER: 'Account created successfully',
  LOGOUT: 'Successfully logged out',
  PASSWORD_RESET_REQUEST: 'Password reset email sent',
  PASSWORD_RESET_SUCCESS: 'Password reset successfully',
  PROFILE_UPDATE: 'Profile updated successfully',
  EMAIL_VERIFICATION: 'Email verification sent',
};

// Route paths
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  PROFILE: '/profile',
  DASHBOARD: '/dashboard',
  HOME: '/',
};

export default {
  AUTH_STATES,
  USER_ROLES,
  AUTH_ERRORS,
  VALIDATION_RULES,
  TOKEN_CONFIG,
  API_ENDPOINTS,
  STORAGE_KEYS,
  SESSION_CONFIG,
  PASSWORD_RESET_CONFIG,
  RATE_LIMIT_CONFIG,
  UI_CONFIG,
  FEATURES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ROUTES,
};