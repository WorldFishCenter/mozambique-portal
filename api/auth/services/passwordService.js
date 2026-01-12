/**
 * Password Service
 * Handles password hashing, validation, and strength checking
 */

const bcrypt = require('bcrypt');
const config = require('../utils/config');

class PasswordService {
  constructor() {
    this.saltRounds = config.password.saltRounds;
    this.minLength = config.password.minLength;
    this.requireUppercase = config.password.requireUppercase;
    this.requireLowercase = config.password.requireLowercase;
    this.requireNumbers = config.password.requireNumbers;
    this.requireSpecialChars = config.password.requireSpecialChars;
  }

  /**
   * Hash a password using bcrypt
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  async hashPassword(password) {
    if (!password) {
      throw new Error('Password is required for hashing');
    }

    try {
      const hash = await bcrypt.hash(password, this.saltRounds);
      return hash;
    } catch (error) {
      throw new Error(`Password hashing failed: ${error.message}`);
    }
  }

  /**
   * Verify a password against its hash
   * @param {string} password - Plain text password
   * @param {string} hash - Stored password hash
   * @returns {Promise<boolean>} True if password matches
   */
  async verifyPassword(password, hash) {
    if (!password || !hash) {
      return false;
    }

    try {
      const isMatch = await bcrypt.compare(password, hash);
      return isMatch;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  /**
   * Validate password strength and format
   * @param {string} password - Password to validate
   * @returns {Object} Validation result with errors and strength score
   */
  validatePassword(password) {
    const errors = [];
    let strengthScore = 0;
    const feedback = [];

    // Check if password exists
    if (!password) {
      return {
        isValid: false,
        errors: ['Password is required'],
        strengthScore: 0,
        strength: 'invalid',
        feedback: []
      };
    }

    // Length validation
    if (password.length < this.minLength) {
      errors.push(`Password must be at least ${this.minLength} characters long`);
    } else {
      strengthScore += 1;
      if (password.length >= 12) {
        strengthScore += 1;
        feedback.push('Good length');
      }
    }

    // Maximum length check (prevent DoS attacks)
    if (password.length > 128) {
      errors.push('Password must be less than 128 characters long');
    }

    // Uppercase letter requirement
    if (this.requireUppercase) {
      if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      } else {
        strengthScore += 1;
      }
    }

    // Lowercase letter requirement
    if (this.requireLowercase) {
      if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
      } else {
        strengthScore += 1;
      }
    }

    // Number requirement
    if (this.requireNumbers) {
      if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
      } else {
        strengthScore += 1;
      }
    }

    // Special character requirement
    if (this.requireSpecialChars) {
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
      } else {
        strengthScore += 1;
      }
    }

    // Additional strength checks
    const hasMultipleNumbers = (password.match(/\d/g) || []).length >= 2;
    const hasMultipleSpecial = (password.match(/[!@#$%^&*(),.?":{}|<>]/g) || []).length >= 2;
    const hasNoRepeatingChars = !/(.)\1{2,}/.test(password);
    const hasNoSequentialChars = !this.hasSequentialCharacters(password);

    if (hasMultipleNumbers) {
      strengthScore += 0.5;
      feedback.push('Multiple numbers');
    }

    if (hasMultipleSpecial) {
      strengthScore += 0.5;
      feedback.push('Multiple special characters');
    }

    if (hasNoRepeatingChars) {
      strengthScore += 0.5;
      feedback.push('No repeating characters');
    } else {
      feedback.push('Avoid repeating characters');
    }

    if (hasNoSequentialChars) {
      strengthScore += 0.5;
      feedback.push('No sequential characters');
    } else {
      feedback.push('Avoid sequential characters (abc, 123)');
    }

    // Check for common patterns
    const commonPatterns = this.checkCommonPatterns(password);
    if (commonPatterns.length > 0) {
      strengthScore -= commonPatterns.length * 0.5;
      feedback.push(...commonPatterns);
    }

    // Determine strength level
    let strength;
    if (errors.length > 0) {
      strength = 'invalid';
    } else if (strengthScore < 3) {
      strength = 'weak';
    } else if (strengthScore < 5) {
      strength = 'medium';
    } else if (strengthScore < 7) {
      strength = 'strong';
    } else {
      strength = 'very-strong';
    }

    return {
      isValid: errors.length === 0,
      errors,
      strengthScore: Math.max(0, strengthScore),
      strength,
      feedback,
    };
  }

  /**
   * Check for sequential characters in password
   * @param {string} password - Password to check
   * @returns {boolean} True if sequential characters found
   */
  hasSequentialCharacters(password) {
    const sequences = [
      'abcdefghijklmnopqrstuvwxyz',
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      '0123456789',
      'qwertyuiop',
      'asdfghjkl',
      'zxcvbnm'
    ];

    for (const sequence of sequences) {
      for (let i = 0; i <= sequence.length - 3; i++) {
        const subseq = sequence.substring(i, i + 3);
        if (password.includes(subseq)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check for common password patterns
   * @param {string} password - Password to check
   * @returns {Array} Array of warning messages
   */
  checkCommonPatterns(password) {
    const warnings = [];
    const lowerPassword = password.toLowerCase();

    // Common words to avoid
    const commonWords = [
      'password', 'admin', 'user', 'login', 'welcome', 'hello',
      'mozambique', 'portal', 'system', 'database', 'server'
    ];

    for (const word of commonWords) {
      if (lowerPassword.includes(word)) {
        warnings.push(`Avoid using common words like "${word}"`);
        break; // Only show one common word warning
      }
    }

    // Date patterns
    if (/\d{4}/.test(password)) {
      const year = new Date().getFullYear();
      const currentYear = year.toString();
      const lastYear = (year - 1).toString();
      const nextYear = (year + 1).toString();

      if (password.includes(currentYear) || password.includes(lastYear) || password.includes(nextYear)) {
        warnings.push('Avoid using current or recent years');
      }
    }

    // Simple patterns
    if (/^(.)\1+$/.test(password)) {
      warnings.push('Avoid using the same character repeatedly');
    }

    if (/^(012|123|234|345|456|567|678|789|890)/.test(password)) {
      warnings.push('Avoid simple number sequences');
    }

    return warnings;
  }

  /**
   * Generate a secure random password
   * @param {Object} options - Password generation options
   * @param {number} options.length - Password length (default: 16)
   * @param {boolean} options.includeUppercase - Include uppercase letters (default: true)
   * @param {boolean} options.includeLowercase - Include lowercase letters (default: true)
   * @param {boolean} options.includeNumbers - Include numbers (default: true)
   * @param {boolean} options.includeSpecialChars - Include special characters (default: true)
   * @returns {string} Generated password
   */
  generateSecurePassword(options = {}) {
    const {
      length = 16,
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSpecialChars = true,
    } = options;

    let charset = '';
    const guaranteedChars = [];

    if (includeUppercase) {
      charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      guaranteedChars.push(this.getRandomChar('ABCDEFGHIJKLMNOPQRSTUVWXYZ'));
    }

    if (includeLowercase) {
      charset += 'abcdefghijklmnopqrstuvwxyz';
      guaranteedChars.push(this.getRandomChar('abcdefghijklmnopqrstuvwxyz'));
    }

    if (includeNumbers) {
      charset += '0123456789';
      guaranteedChars.push(this.getRandomChar('0123456789'));
    }

    if (includeSpecialChars) {
      charset += '!@#$%^&*(),.?":{}|<>';
      guaranteedChars.push(this.getRandomChar('!@#$%^&*(),.?":{}|<>'));
    }

    if (charset === '') {
      throw new Error('At least one character type must be included');
    }

    // Generate remaining characters
    const remainingLength = length - guaranteedChars.length;
    const randomChars = [];

    for (let i = 0; i < remainingLength; i++) {
      randomChars.push(this.getRandomChar(charset));
    }

    // Combine and shuffle
    const allChars = [...guaranteedChars, ...randomChars];
    return this.shuffleArray(allChars).join('');
  }

  /**
   * Get a random character from a charset
   * @param {string} charset - Character set to choose from
   * @returns {string} Random character
   */
  getRandomChar(charset) {
    const crypto = require('crypto');
    const randomIndex = crypto.randomInt(0, charset.length);
    return charset[randomIndex];
  }

  /**
   * Shuffle an array using Fisher-Yates algorithm
   * @param {Array} array - Array to shuffle
   * @returns {Array} Shuffled array
   */
  shuffleArray(array) {
    const crypto = require('crypto');
    const shuffled = [...array];
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }

  /**
   * Check if password needs to be rehashed (due to changed salt rounds)
   * @param {string} hash - Current password hash
   * @returns {boolean} True if rehashing is needed
   */
  needsRehash(hash) {
    try {
      const rounds = bcrypt.getRounds(hash);
      return rounds !== this.saltRounds;
    } catch (error) {
      // If we can't determine rounds, assume rehash is needed
      return true;
    }
  }

  /**
   * Get password strength requirements for client-side validation
   * @returns {Object} Password requirements
   */
  getPasswordRequirements() {
    return {
      minLength: this.minLength,
      maxLength: 128,
      requireUppercase: this.requireUppercase,
      requireLowercase: this.requireLowercase,
      requireNumbers: this.requireNumbers,
      requireSpecialChars: this.requireSpecialChars,
    };
  }

  /**
   * Validate multiple passwords (for batch operations)
   * @param {Array<string>} passwords - Array of passwords to validate
   * @returns {Array<Object>} Array of validation results
   */
  validatePasswords(passwords) {
    return passwords.map((password, index) => ({
      index,
      password,
      ...this.validatePassword(password),
    }));
  }
}

module.exports = PasswordService;