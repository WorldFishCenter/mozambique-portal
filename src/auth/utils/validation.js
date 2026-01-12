/**
 * Authentication Validation Utilities
 * Client-side validation functions for authentication forms
 */

import { VALIDATION_RULES } from './constants';

/**
 * Validate username
 * @param {string} username - Username to validate
 * @returns {Object} Validation result
 */
export const validateUsername = (username) => {
  const errors = [];
  
  if (!username) {
    errors.push('Username is required');
    return { isValid: false, errors };
  }
  
  if (username.length < VALIDATION_RULES.USERNAME.MIN_LENGTH) {
    errors.push(`Username must be at least ${VALIDATION_RULES.USERNAME.MIN_LENGTH} characters`);
  }
  
  if (username.length > VALIDATION_RULES.USERNAME.MAX_LENGTH) {
    errors.push(`Username must be no more than ${VALIDATION_RULES.USERNAME.MAX_LENGTH} characters`);
  }
  
  if (!VALIDATION_RULES.USERNAME.PATTERN.test(username)) {
    errors.push('Username can only contain letters, numbers, underscores, and hyphens');
  }
  
  if (VALIDATION_RULES.USERNAME.RESERVED_NAMES.includes(username.toLowerCase())) {
    errors.push('This username is reserved and cannot be used');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {Object} Validation result
 */
export const validateEmail = (email) => {
  const errors = [];
  
  if (!email) {
    errors.push('Email is required');
    return { isValid: false, errors };
  }
  
  if (email.length > VALIDATION_RULES.EMAIL.MAX_LENGTH) {
    errors.push(`Email must be no more than ${VALIDATION_RULES.EMAIL.MAX_LENGTH} characters`);
  }
  
  if (!VALIDATION_RULES.EMAIL.PATTERN.test(email)) {
    errors.push('Please enter a valid email address');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with strength score
 */
export const validatePassword = (password) => {
  const errors = [];
  let score = 0;
  
  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors, score: 0, strength: 'none' };
  }
  
  // Length check
  if (password.length < VALIDATION_RULES.PASSWORD.MIN_LENGTH) {
    errors.push(`Password must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters`);
  } else {
    score += 1;
  }
  
  if (password.length > VALIDATION_RULES.PASSWORD.MAX_LENGTH) {
    errors.push(`Password must be no more than ${VALIDATION_RULES.PASSWORD.MAX_LENGTH} characters`);
  }
  
  // Character type checks
  if (VALIDATION_RULES.PASSWORD.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (VALIDATION_RULES.PASSWORD.REQUIRE_UPPERCASE) {
    score += 1;
  }
  
  if (VALIDATION_RULES.PASSWORD.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (VALIDATION_RULES.PASSWORD.REQUIRE_LOWERCASE) {
    score += 1;
  }
  
  if (VALIDATION_RULES.PASSWORD.REQUIRE_NUMBERS && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else if (VALIDATION_RULES.PASSWORD.REQUIRE_NUMBERS) {
    score += 1;
  }
  
  if (VALIDATION_RULES.PASSWORD.REQUIRE_SPECIAL_CHARS && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else if (VALIDATION_RULES.PASSWORD.REQUIRE_SPECIAL_CHARS) {
    score += 1;
  }
  
  // Additional strength checks
  if (password.length >= 12) {
    score += 1; // Bonus for longer passwords
  }
  
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1; // Bonus for special characters even if not required
  }
  
  // Check for common patterns
  if (hasSequentialCharacters(password)) {
    score -= 1;
  }
  
  if (hasRepeatingCharacters(password)) {
    score -= 1;
  }
  
  // Determine strength level
  let strength = 'weak';
  if (score >= 5) {
    strength = 'strong';
  } else if (score >= 3) {
    strength = 'medium';
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    score: Math.max(0, score),
    strength,
  };
};

/**
 * Validate password confirmation
 * @param {string} password - Original password
 * @param {string} confirmPassword - Password confirmation
 * @returns {Object} Validation result
 */
export const validatePasswordConfirmation = (password, confirmPassword) => {
  const errors = [];
  
  if (!confirmPassword) {
    errors.push('Password confirmation is required');
    return { isValid: false, errors };
  }
  
  if (password !== confirmPassword) {
    errors.push('Passwords do not match');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate profile name
 * @param {string} name - Name to validate
 * @param {string} fieldName - Field name for error messages
 * @returns {Object} Validation result
 */
export const validateProfileName = (name, fieldName = 'Name') => {
  const errors = [];
  
  if (!name) {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors };
  }
  
  const rules = VALIDATION_RULES.PROFILE.FIRST_NAME; // Same rules for first/last name
  
  if (name.length < rules.MIN_LENGTH) {
    errors.push(`${fieldName} must be at least ${rules.MIN_LENGTH} character`);
  }
  
  if (name.length > rules.MAX_LENGTH) {
    errors.push(`${fieldName} must be no more than ${rules.MAX_LENGTH} characters`);
  }
  
  if (!rules.PATTERN.test(name)) {
    errors.push(`${fieldName} can only contain letters, spaces, hyphens, and apostrophes`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate login form data
 * @param {Object} data - Login form data
 * @returns {Object} Validation result
 */
export const validateLoginForm = (data) => {
  const errors = {};
  let isValid = true;
  
  // Validate username or email
  if (!data.username && !data.email) {
    errors.identifier = ['Username or email is required'];
    isValid = false;
  } else if (data.username) {
    const usernameValidation = validateUsername(data.username);
    if (!usernameValidation.isValid) {
      errors.username = usernameValidation.errors;
      isValid = false;
    }
  } else if (data.email) {
    const emailValidation = validateEmail(data.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.errors;
      isValid = false;
    }
  }
  
  // Validate password
  if (!data.password) {
    errors.password = ['Password is required'];
    isValid = false;
  }
  
  return { isValid, errors };
};

/**
 * Validate registration form data
 * @param {Object} data - Registration form data
 * @returns {Object} Validation result
 */
export const validateRegistrationForm = (data) => {
  const errors = {};
  let isValid = true;
  
  // Validate username
  const usernameValidation = validateUsername(data.username);
  if (!usernameValidation.isValid) {
    errors.username = usernameValidation.errors;
    isValid = false;
  }
  
  // Validate email
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.errors;
    isValid = false;
  }
  
  // Validate password
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.errors;
    isValid = false;
  }
  
  // Validate password confirmation
  const confirmValidation = validatePasswordConfirmation(data.password, data.confirmPassword);
  if (!confirmValidation.isValid) {
    errors.confirmPassword = confirmValidation.errors;
    isValid = false;
  }
  
  // Validate profile fields if provided
  if (data.profile) {
    if (data.profile.firstName) {
      const firstNameValidation = validateProfileName(data.profile.firstName, 'First name');
      if (!firstNameValidation.isValid) {
        errors.firstName = firstNameValidation.errors;
        isValid = false;
      }
    }
    
    if (data.profile.lastName) {
      const lastNameValidation = validateProfileName(data.profile.lastName, 'Last name');
      if (!lastNameValidation.isValid) {
        errors.lastName = lastNameValidation.errors;
        isValid = false;
      }
    }
  }
  
  return { isValid, errors };
};

/**
 * Validate password reset form data
 * @param {Object} data - Password reset form data
 * @returns {Object} Validation result
 */
export const validatePasswordResetForm = (data) => {
  const errors = {};
  let isValid = true;
  
  // Validate new password
  const passwordValidation = validatePassword(data.newPassword);
  if (!passwordValidation.isValid) {
    errors.newPassword = passwordValidation.errors;
    isValid = false;
  }
  
  // Validate password confirmation
  const confirmValidation = validatePasswordConfirmation(data.newPassword, data.confirmPassword);
  if (!confirmValidation.isValid) {
    errors.confirmPassword = confirmValidation.errors;
    isValid = false;
  }
  
  return { isValid, errors };
};

/**
 * Check for sequential characters in password
 * @param {string} password - Password to check
 * @returns {boolean} True if sequential characters found
 */
const hasSequentialCharacters = (password) => {
  const sequences = ['abc', '123', 'qwe', 'asd', 'zxc'];
  const lowerPassword = password.toLowerCase();
  
  return sequences.some(seq => {
    for (let i = 0; i <= lowerPassword.length - 3; i++) {
      const substring = lowerPassword.substring(i, i + 3);
      if (substring === seq || substring === seq.split('').reverse().join('')) {
        return true;
      }
    }
    return false;
  });
};

/**
 * Check for repeating characters in password
 * @param {string} password - Password to check
 * @returns {boolean} True if repeating characters found
 */
const hasRepeatingCharacters = (password) => {
  let repeatCount = 1;
  
  for (let i = 1; i < password.length; i++) {
    if (password[i] === password[i - 1]) {
      repeatCount++;
      if (repeatCount >= 3) {
        return true;
      }
    } else {
      repeatCount = 1;
    }
  }
  
  return false;
};

/**
 * Sanitize input string
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\0/g, ''); // Remove null bytes
};

/**
 * Format validation errors for display
 * @param {Object} errors - Validation errors object
 * @returns {Array} Array of error messages
 */
export const formatValidationErrors = (errors) => {
  const messages = [];
  
  Object.keys(errors).forEach(field => {
    if (Array.isArray(errors[field])) {
      messages.push(...errors[field]);
    } else {
      messages.push(errors[field]);
    }
  });
  
  return messages;
};

export default {
  validateUsername,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateProfileName,
  validateLoginForm,
  validateRegistrationForm,
  validatePasswordResetForm,
  sanitizeInput,
  formatValidationErrors,
};