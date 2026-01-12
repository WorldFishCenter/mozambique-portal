/**
 * Validation Service Tests
 * Unit tests for input validation and sanitization
 */

const ValidationService = require('../validationService');

describe('ValidationService', () => {
  let validationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  describe('validateRegistrationData', () => {
    test('should validate valid registration data', () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'StrongPass123!',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          organization: 'Test Org'
        }
      };

      const result = validationService.validateRegistrationData(userData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitized).toBeDefined();
      expect(result.sanitized.username).toBe('testuser');
      expect(result.sanitized.email).toBe('test@example.com');
    });

    test('should reject invalid registration data', () => {
      const userData = {
        username: 'ab', // too short
        email: 'invalid-email',
        password: 'weak'
      };

      const result = validationService.validateRegistrationData(userData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.sanitized).toBeNull();
    });
  });

  describe('validateLoginData', () => {
    test('should validate valid login data with username', () => {
      const loginData = {
        username: 'testuser',
        password: 'password123'
      };

      const result = validationService.validateLoginData(loginData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitized.username).toBe('testuser');
    });

    test('should validate valid login data with email', () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const result = validationService.validateLoginData(loginData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitized.email).toBe('test@example.com');
    });

    test('should reject login data without username or email', () => {
      const loginData = {
        password: 'password123'
      };

      const result = validationService.validateLoginData(loginData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Username or email is required');
    });
  });

  describe('validateUsername', () => {
    test('should validate valid username', () => {
      const result = validationService.validateUsername('validuser123');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitized).toBe('validuser123');
    });

    test('should reject short username', () => {
      const result = validationService.validateUsername('ab');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Username must be at least 3 characters long');
    });

    test('should reject username with invalid characters', () => {
      const result = validationService.validateUsername('user@name');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Username can only contain letters, numbers, hyphens, and underscores');
    });

    test('should reject reserved usernames', () => {
      const result = validationService.validateUsername('admin');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('This username is reserved and cannot be used');
    });
  });

  describe('validateEmail', () => {
    test('should validate valid email', () => {
      const result = validationService.validateEmail('test@example.com');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitized).toBe('test@example.com');
    });

    test('should reject invalid email format', () => {
      const result = validationService.validateEmail('invalid-email');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    test('should normalize email addresses', () => {
      const result = validationService.validateEmail('  TEST@EXAMPLE.COM  ');
      
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('test@example.com');
    });
  });

  describe('validateProfile', () => {
    test('should validate valid profile', () => {
      const profile = {
        firstName: 'John',
        lastName: 'Doe',
        organization: 'Test Organization'
      };

      const result = validationService.validateProfile(profile);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitized.firstName).toBe('John');
      expect(result.sanitized.lastName).toBe('Doe');
      expect(result.sanitized.organization).toBe('Test Organization');
    });

    test('should handle empty profile', () => {
      const result = validationService.validateProfile({});
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid name characters', () => {
      const profile = {
        firstName: 'John123',
        lastName: 'Doe@#$'
      };

      const result = validationService.validateProfile(profile);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('sanitizeInput', () => {
    test('should trim whitespace by default', () => {
      const result = validationService.sanitizeInput('  test  ');
      expect(result).toBe('test');
    });

    test('should escape HTML when requested', () => {
      const result = validationService.sanitizeInput('<script>alert("xss")</script>', { escapeHtml: true });
      expect(result).not.toContain('<script>');
    });

    test('should limit length when specified', () => {
      const result = validationService.sanitizeInput('verylongstring', { maxLength: 5 });
      expect(result).toBe('veryl');
    });

    test('should remove null bytes', () => {
      const result = validationService.sanitizeInput('test\0null');
      expect(result).toBe('testnull');
    });
  });

  describe('isValidIP', () => {
    test('should validate IPv4 addresses', () => {
      expect(validationService.isValidIP('192.168.1.1')).toBe(true);
      expect(validationService.isValidIP('127.0.0.1')).toBe(true);
    });

    test('should validate IPv6 addresses', () => {
      expect(validationService.isValidIP('::1')).toBe(true);
      expect(validationService.isValidIP('2001:db8::1')).toBe(true);
    });

    test('should reject invalid IP addresses', () => {
      expect(validationService.isValidIP('256.256.256.256')).toBe(false);
      expect(validationService.isValidIP('not-an-ip')).toBe(false);
    });
  });

  describe('getValidationRules', () => {
    test('should return validation rules object', () => {
      const rules = validationService.getValidationRules();
      
      expect(rules).toHaveProperty('username');
      expect(rules).toHaveProperty('email');
      expect(rules).toHaveProperty('password');
      expect(rules).toHaveProperty('profile');
      
      expect(rules.username.minLength).toBe(3);
      expect(rules.username.maxLength).toBe(30);
      expect(rules.email.maxLength).toBe(254);
    });
  });
});