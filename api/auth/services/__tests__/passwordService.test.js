/**
 * Password Service Tests
 * Unit tests for password hashing, validation, and strength checking
 */

const PasswordService = require('../passwordService');

describe('PasswordService', () => {
  let passwordService;

  beforeEach(() => {
    passwordService = new PasswordService();
  });

  describe('hashPassword', () => {
    test('should hash a password successfully', async () => {
      const password = 'TestPassword123!';
      const hash = await passwordService.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are typically 60 chars
    });

    test('should throw error for empty password', async () => {
      await expect(passwordService.hashPassword('')).rejects.toThrow('Password is required for hashing');
      await expect(passwordService.hashPassword(null)).rejects.toThrow('Password is required for hashing');
      await expect(passwordService.hashPassword(undefined)).rejects.toThrow('Password is required for hashing');
    });

    test('should generate different hashes for same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await passwordService.hashPassword(password);
      const hash2 = await passwordService.hashPassword(password);
      
      expect(hash1).not.toBe(hash2); // Due to salt
    });
  });

  describe('verifyPassword', () => {
    test('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const hash = await passwordService.hashPassword(password);
      const isValid = await passwordService.verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    test('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hash = await passwordService.hashPassword(password);
      const isValid = await passwordService.verifyPassword(wrongPassword, hash);
      
      expect(isValid).toBe(false);
    });

    test('should handle empty inputs gracefully', async () => {
      const hash = await passwordService.hashPassword('TestPassword123!');
      
      expect(await passwordService.verifyPassword('', hash)).toBe(false);
      expect(await passwordService.verifyPassword('password', '')).toBe(false);
      expect(await passwordService.verifyPassword(null, hash)).toBe(false);
      expect(await passwordService.verifyPassword('password', null)).toBe(false);
    });
  });

  describe('validatePassword', () => {
    test('should validate strong password', () => {
      const result = passwordService.validatePassword('StrongPass123!');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.strength).toBe('strong');
      expect(result.strengthScore).toBeGreaterThan(4);
    });

    test('should reject password that is too short', () => {
      const result = passwordService.validatePassword('Short1!');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    test('should reject password without uppercase', () => {
      const result = passwordService.validatePassword('lowercase123!');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    test('should reject password without lowercase', () => {
      const result = passwordService.validatePassword('UPPERCASE123!');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    test('should reject password without numbers', () => {
      const result = passwordService.validatePassword('NoNumbers!');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    test('should handle empty password', () => {
      const result = passwordService.validatePassword('');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is required');
      expect(result.strength).toBe('invalid');
    });

    test('should reject very long password', () => {
      const longPassword = 'A'.repeat(130) + '1!';
      const result = passwordService.validatePassword(longPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be less than 128 characters long');
    });

    test('should provide strength feedback', () => {
      const result = passwordService.validatePassword('VeryStrongPassword123!@#');
      
      expect(result.feedback).toBeDefined();
      expect(Array.isArray(result.feedback)).toBe(true);
    });
  });

  describe('hasSequentialCharacters', () => {
    test('should detect alphabetical sequences', () => {
      expect(passwordService.hasSequentialCharacters('abc123')).toBe(true);
      expect(passwordService.hasSequentialCharacters('XYZ456')).toBe(true);
    });

    test('should detect numerical sequences', () => {
      expect(passwordService.hasSequentialCharacters('pass123word')).toBe(true);
      expect(passwordService.hasSequentialCharacters('test456pass')).toBe(true);
    });

    test('should detect keyboard sequences', () => {
      expect(passwordService.hasSequentialCharacters('qwerty123')).toBe(true);
      expect(passwordService.hasSequentialCharacters('asdf1234')).toBe(true);
    });

    test('should not flag non-sequential characters', () => {
      expect(passwordService.hasSequentialCharacters('StrongPass124!')).toBe(false);
      expect(passwordService.hasSequentialCharacters('Random2024!')).toBe(false);
    });
  });

  describe('checkCommonPatterns', () => {
    test('should detect common words', () => {
      const warnings = passwordService.checkCommonPatterns('password123');
      expect(warnings.some(w => w.includes('password'))).toBe(true);
    });

    test('should detect year patterns', () => {
      const currentYear = new Date().getFullYear();
      const warnings = passwordService.checkCommonPatterns(`test${currentYear}`);
      expect(warnings.some(w => w.includes('year'))).toBe(true);
    });

    test('should detect repeating characters', () => {
      const warnings = passwordService.checkCommonPatterns('aaaaaaa');
      expect(warnings.some(w => w.includes('same character'))).toBe(true);
    });

    test('should detect simple sequences', () => {
      const warnings = passwordService.checkCommonPatterns('123456');
      expect(warnings.some(w => w.includes('sequence'))).toBe(true);
    });
  });

  describe('generateSecurePassword', () => {
    test('should generate password with default options', () => {
      const password = passwordService.generateSecurePassword();
      
      expect(password).toBeDefined();
      expect(password.length).toBe(16);
      expect(/[A-Z]/.test(password)).toBe(true); // Has uppercase
      expect(/[a-z]/.test(password)).toBe(true); // Has lowercase
      expect(/\d/.test(password)).toBe(true); // Has numbers
      expect(/[!@#$%^&*(),.?":{}|<>]/.test(password)).toBe(true); // Has special chars
    });

    test('should generate password with custom length', () => {
      const password = passwordService.generateSecurePassword({ length: 20 });
      expect(password.length).toBe(20);
    });

    test('should respect character type options', () => {
      const password = passwordService.generateSecurePassword({
        length: 12,
        includeUppercase: false,
        includeSpecialChars: false
      });
      
      expect(password.length).toBe(12);
      expect(/[A-Z]/.test(password)).toBe(false); // No uppercase
      expect(/[!@#$%^&*(),.?":{}|<>]/.test(password)).toBe(false); // No special chars
      expect(/[a-z]/.test(password)).toBe(true); // Has lowercase
      expect(/\d/.test(password)).toBe(true); // Has numbers
    });

    test('should throw error if no character types selected', () => {
      expect(() => {
        passwordService.generateSecurePassword({
          includeUppercase: false,
          includeLowercase: false,
          includeNumbers: false,
          includeSpecialChars: false
        });
      }).toThrow('At least one character type must be included');
    });
  });

  describe('needsRehash', () => {
    test('should detect when rehash is needed', async () => {
      // Create a hash with current salt rounds
      const password = 'TestPassword123!';
      const hash = await passwordService.hashPassword(password);
      
      // Should not need rehash with same salt rounds
      expect(passwordService.needsRehash(hash)).toBe(false);
    });

    test('should handle invalid hash gracefully', () => {
      expect(passwordService.needsRehash('invalid-hash')).toBe(true);
      expect(passwordService.needsRehash('')).toBe(true);
      expect(passwordService.needsRehash(null)).toBe(true);
    });
  });

  describe('getPasswordRequirements', () => {
    test('should return password requirements', () => {
      const requirements = passwordService.getPasswordRequirements();
      
      expect(requirements).toHaveProperty('minLength');
      expect(requirements).toHaveProperty('maxLength');
      expect(requirements).toHaveProperty('requireUppercase');
      expect(requirements).toHaveProperty('requireLowercase');
      expect(requirements).toHaveProperty('requireNumbers');
      expect(requirements).toHaveProperty('requireSpecialChars');
      
      expect(typeof requirements.minLength).toBe('number');
      expect(requirements.maxLength).toBe(128);
    });
  });

  describe('validatePasswords', () => {
    test('should validate multiple passwords', () => {
      const passwords = [
        'StrongPass123!',
        'weak',
        'AnotherStrong456@'
      ];
      
      const results = passwordService.validatePasswords(passwords);
      
      expect(results).toHaveLength(3);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(false);
      expect(results[2].isValid).toBe(true);
      
      results.forEach((result, index) => {
        expect(result.index).toBe(index);
        expect(result.password).toBe(passwords[index]);
      });
    });
  });
});