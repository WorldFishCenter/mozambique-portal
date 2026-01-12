/**
 * Validation Service
 * Handles input validation and sanitization for authentication
 */

const validator = require('validator');
const PasswordService = require('./passwordService');

class ValidationService {
  constructor() {
    this.passwordService = new PasswordService();
  }

  /**
   * Validate and sanitize user registration data
   * @param {Object} userData - User registration data
   * @returns {Object} Validation result
   */
  validateRegistrationData(userData) {
    const errors = [];
    const sanitized = {};

    // Username validation
    const usernameResult = this.validateUsername(userData.username);
    if (!usernameResult.isValid) {
      errors.push(...usernameResult.errors);
    } else {
      sanitized.username = usernameResult.sanitized;
    }

    // Email validation
    const emailResult = this.validateEmail(userData.email);
    if (!emailResult.isValid) {
      errors.push(...emailResult.errors);
    } else {
      sanitized.email = emailResult.sanitized;
    }

    // Password validation
    const passwordResult = this.passwordService.validatePassword(userData.password);
    if (!passwordResult.isValid) {
      errors.push(...passwordResult.errors);
    } else {
      sanitized.password = userData.password; // Don't sanitize password, just validate
    }

    // Profile validation (optional fields)
    if (userData.profile) {
      const profileResult = this.validateProfile(userData.profile);
      if (!profileResult.isValid) {
        errors.push(...profileResult.errors);
      } else {
        sanitized.profile = profileResult.sanitized;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? sanitized : null,
    };
  }

  /**
   * Validate and sanitize user login data
   * @param {Object} loginData - User login data
   * @returns {Object} Validation result
   */
  validateLoginData(loginData) {
    const errors = [];
    const sanitized = {};

    // Username or email validation
    if (!loginData.username && !loginData.email) {
      errors.push('Username or email is required');
    } else {
      if (loginData.username) {
        const usernameResult = this.validateUsername(loginData.username);
        if (!usernameResult.isValid) {
          errors.push('Invalid username format');
        } else {
          sanitized.username = usernameResult.sanitized;
        }
      }

      if (loginData.email) {
        const emailResult = this.validateEmail(loginData.email);
        if (!emailResult.isValid) {
          errors.push('Invalid email format');
        } else {
          sanitized.email = emailResult.sanitized;
        }
      }
    }

    // Password validation (basic check for login)
    if (!loginData.password) {
      errors.push('Password is required');
    } else if (typeof loginData.password !== 'string') {
      errors.push('Password must be a string');
    } else if (loginData.password.length > 128) {
      errors.push('Password is too long');
    } else {
      sanitized.password = loginData.password;
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? sanitized : null,
    };
  }

  /**
   * Validate username
   * @param {string} username - Username to validate
   * @returns {Object} Validation result
   */
  validateUsername(username) {
    const errors = [];

    if (!username) {
      errors.push('Username is required');
      return { isValid: false, errors, sanitized: null };
    }

    if (typeof username !== 'string') {
      errors.push('Username must be a string');
      return { isValid: false, errors, sanitized: null };
    }

    // Sanitize username
    const sanitized = validator.trim(username.toLowerCase());

    // Length validation
    if (sanitized.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }

    if (sanitized.length > 30) {
      errors.push('Username must be less than 30 characters long');
    }

    // Character validation
    if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
      errors.push('Username can only contain letters, numbers, hyphens, and underscores');
    }

    // Reserved usernames
    const reservedUsernames = [
      'admin', 'administrator', 'root', 'system', 'api', 'www', 'mail',
      'ftp', 'localhost', 'test', 'guest', 'anonymous', 'null', 'undefined'
    ];

    if (reservedUsernames.includes(sanitized)) {
      errors.push('This username is reserved and cannot be used');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? sanitized : null,
    };
  }

  /**
   * Validate email address
   * @param {string} email - Email to validate
   * @returns {Object} Validation result
   */
  validateEmail(email) {
    const errors = [];

    if (!email) {
      errors.push('Email is required');
      return { isValid: false, errors, sanitized: null };
    }

    if (typeof email !== 'string') {
      errors.push('Email must be a string');
      return { isValid: false, errors, sanitized: null };
    }

    // First trim and lowercase the email
    let sanitized = validator.trim(email).toLowerCase();

    // Validate the email format first
    if (!validator.isEmail(sanitized)) {
      errors.push('Invalid email format');
      return { isValid: false, errors, sanitized: null };
    }

    // Try to normalize the email
    const normalized = validator.normalizeEmail(sanitized, {
      gmail_lowercase: true,
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      outlookdotcom_lowercase: true,
      outlookdotcom_remove_subaddress: false,
      yahoo_lowercase: true,
      yahoo_remove_subaddress: false,
    });

    // Use normalized version if available, otherwise use sanitized
    sanitized = normalized || sanitized;

    if (sanitized.length > 254) {
      errors.push('Email address is too long');
    }

    // Check for disposable email domains (basic list)
    const disposableDomains = [
      '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
      'mailinator.com', 'throwaway.email'
    ];

    const domain = sanitized.split('@')[1];
    if (domain && disposableDomains.includes(domain.toLowerCase())) {
      errors.push('Disposable email addresses are not allowed');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? sanitized : null,
    };
  }

  /**
   * Validate user profile data
   * @param {Object} profile - Profile data to validate
   * @returns {Object} Validation result
   */
  validateProfile(profile) {
    const errors = [];
    const sanitized = {};

    if (typeof profile !== 'object' || profile === null) {
      errors.push('Profile must be an object');
      return { isValid: false, errors, sanitized: null };
    }

    // First name validation (optional)
    if (profile.firstName !== undefined) {
      if (typeof profile.firstName !== 'string') {
        errors.push('First name must be a string');
      } else {
        const firstName = validator.trim(profile.firstName);
        if (firstName.length > 50) {
          errors.push('First name must be less than 50 characters');
        } else if (firstName.length > 0 && !/^[a-zA-ZÀ-ÿ\s'-]+$/.test(firstName)) {
          errors.push('First name contains invalid characters');
        } else {
          sanitized.firstName = firstName;
        }
      }
    }

    // Last name validation (optional)
    if (profile.lastName !== undefined) {
      if (typeof profile.lastName !== 'string') {
        errors.push('Last name must be a string');
      } else {
        const lastName = validator.trim(profile.lastName);
        if (lastName.length > 50) {
          errors.push('Last name must be less than 50 characters');
        } else if (lastName.length > 0 && !/^[a-zA-ZÀ-ÿ\s'-]+$/.test(lastName)) {
          errors.push('Last name contains invalid characters');
        } else {
          sanitized.lastName = lastName;
        }
      }
    }

    // Organization validation (optional)
    if (profile.organization !== undefined) {
      if (typeof profile.organization !== 'string') {
        errors.push('Organization must be a string');
      } else {
        const organization = validator.trim(profile.organization);
        if (organization.length > 100) {
          errors.push('Organization name must be less than 100 characters');
        } else {
          sanitized.organization = organization;
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? sanitized : null,
    };
  }

  /**
   * Validate password reset request data
   * @param {Object} resetData - Password reset request data
   * @returns {Object} Validation result
   */
  validatePasswordResetRequest(resetData) {
    const errors = [];
    const sanitized = {};

    // Email validation
    const emailResult = this.validateEmail(resetData.email);
    if (!emailResult.isValid) {
      errors.push(...emailResult.errors);
    } else {
      sanitized.email = emailResult.sanitized;
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? sanitized : null,
    };
  }

  /**
   * Validate password reset data
   * @param {Object} resetData - Password reset data
   * @returns {Object} Validation result
   */
  validatePasswordReset(resetData) {
    const errors = [];
    const sanitized = {};

    // Token validation
    if (!resetData.token) {
      errors.push('Reset token is required');
    } else if (typeof resetData.token !== 'string') {
      errors.push('Reset token must be a string');
    } else if (resetData.token.length < 10) {
      errors.push('Invalid reset token format');
    } else {
      sanitized.token = validator.trim(resetData.token);
    }

    // New password validation
    const passwordResult = this.passwordService.validatePassword(resetData.newPassword);
    if (!passwordResult.isValid) {
      errors.push(...passwordResult.errors);
    } else {
      sanitized.newPassword = resetData.newPassword;
    }

    // Confirm password validation
    if (resetData.newPassword !== resetData.confirmPassword) {
      errors.push('Passwords do not match');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? sanitized : null,
    };
  }

  /**
   * Sanitize and validate general input
   * @param {string} input - Input to sanitize
   * @param {Object} options - Sanitization options
   * @returns {string} Sanitized input
   */
  sanitizeInput(input, options = {}) {
    if (typeof input !== 'string') {
      return '';
    }

    let sanitized = input;

    // Trim whitespace
    if (options.trim !== false) {
      sanitized = validator.trim(sanitized);
    }

    // Escape HTML
    if (options.escapeHtml) {
      sanitized = validator.escape(sanitized);
    }

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Limit length
    if (options.maxLength && sanitized.length > options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }

    return sanitized;
  }

  /**
   * Validate IP address
   * @param {string} ip - IP address to validate
   * @returns {boolean} True if valid IP address
   */
  isValidIP(ip) {
    return validator.isIP(ip);
  }

  /**
   * Validate user agent string
   * @param {string} userAgent - User agent string
   * @returns {boolean} True if valid user agent
   */
  isValidUserAgent(userAgent) {
    if (!userAgent || typeof userAgent !== 'string') {
      return false;
    }

    // Basic user agent validation
    return userAgent.length > 0 && userAgent.length < 1000;
  }

  /**
   * Get validation rules for client-side validation
   * @returns {Object} Validation rules
   */
  getValidationRules() {
    return {
      username: {
        minLength: 3,
        maxLength: 30,
        pattern: '^[a-zA-Z0-9_-]+$',
        required: true,
      },
      email: {
        maxLength: 254,
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
        required: true,
      },
      password: this.passwordService.getPasswordRequirements(),
      profile: {
        firstName: {
          maxLength: 50,
          pattern: '^[a-zA-ZÀ-ÿ\\s\'-]+$',
          required: false,
        },
        lastName: {
          maxLength: 50,
          pattern: '^[a-zA-ZÀ-ÿ\\s\'-]+$',
          required: false,
        },
        organization: {
          maxLength: 100,
          required: false,
        },
      },
    };
  }

  /**
   * Sanitize object recursively
   * @param {Object} obj - Object to sanitize
   * @param {number} depth - Current recursion depth (prevent infinite loops)
   * @returns {Object} Sanitized object
   */
  sanitizeObject(obj, depth = 0) {
    // Prevent deep recursion attacks
    if (depth > 10) {
      return {};
    }

    if (obj === null || obj === undefined) {
      return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => {
        if (typeof item === 'object') {
          return this.sanitizeObject(item, depth + 1);
        }
        return item;
      });
    }

    // Handle objects
    if (typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];

          if (typeof value === 'object' && value !== null) {
            sanitized[key] = this.sanitizeObject(value, depth + 1);
          } else {
            sanitized[key] = value;
          }
        }
      }
      return sanitized;
    }

    return obj;
  }
}

module.exports = ValidationService;