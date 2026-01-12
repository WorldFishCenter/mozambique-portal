/**
 * Authentication Services Integration Tests
 * Tests the interaction between different authentication services
 */

const { PasswordService, ValidationService, TokenService } = require('../index');
const { ObjectId } = require('mongodb');

describe('Authentication Services Integration', () => {
  let passwordService;
  let validationService;
  let tokenService;

  beforeEach(() => {
    passwordService = new PasswordService();
    validationService = new ValidationService();
    tokenService = new TokenService();
  });

  describe('Complete User Registration Flow', () => {
    test('should validate, hash password, and generate tokens for new user', async () => {
      // Step 1: Validate registration data
      const registrationData = {
        username: 'newuser123',
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          organization: 'Test Org'
        }
      };

      const validationResult = validationService.validateRegistrationData(registrationData);
      expect(validationResult.isValid).toBe(true);

      // Step 2: Hash the password
      const hashedPassword = await passwordService.hashPassword(validationResult.sanitized.password);
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(registrationData.password);

      // Step 3: Create user object (simulating database save)
      const user = {
        _id: new ObjectId(),
        username: validationResult.sanitized.username,
        email: validationResult.sanitized.email,
        passwordHash: hashedPassword,
        profile: validationResult.sanitized.profile,
        createdAt: new Date(),
        isActive: true,
      };

      // Step 4: Generate authentication tokens
      const tokenPair = tokenService.generateTokenPair(user);
      expect(tokenPair.accessToken).toBeDefined();
      expect(tokenPair.refreshToken).toBeDefined();
      expect(tokenPair.sessionId).toBeDefined();

      // Step 5: Verify tokens work
      const accessVerification = tokenService.verifyAccessToken(tokenPair.accessToken.token);
      expect(accessVerification.isValid).toBe(true);
      expect(accessVerification.payload.userId).toBe(user._id.toString());

      const refreshVerification = tokenService.verifyRefreshToken(tokenPair.refreshToken.token);
      expect(refreshVerification.isValid).toBe(true);
      expect(refreshVerification.payload.userId).toBe(user._id.toString());
    });
  });

  describe('Complete User Login Flow', () => {
    test('should validate login, verify password, and generate tokens', async () => {
      // Setup: Create a user with hashed password
      const originalPassword = 'LoginPass123!';
      const hashedPassword = await passwordService.hashPassword(originalPassword);
      
      const user = {
        _id: new ObjectId(),
        username: 'loginuser',
        email: 'login@example.com',
        passwordHash: hashedPassword,
        isActive: true,
      };

      // Step 1: Validate login data
      const loginData = {
        username: 'loginuser',
        password: originalPassword,
      };

      const validationResult = validationService.validateLoginData(loginData);
      expect(validationResult.isValid).toBe(true);

      // Step 2: Verify password
      const passwordValid = await passwordService.verifyPassword(
        loginData.password,
        user.passwordHash
      );
      expect(passwordValid).toBe(true);

      // Step 3: Generate tokens for successful login
      const tokenPair = tokenService.generateTokenPair(user, {
        ipAddress: '192.168.1.1',
      });

      expect(tokenPair.accessToken).toBeDefined();
      expect(tokenPair.refreshToken).toBeDefined();

      // Step 4: Verify token contains expected claims
      const tokenInfo = tokenService.getTokenInfo(tokenPair.accessToken.token);
      expect(tokenInfo.userId).toBe(user._id.toString());
      expect(tokenInfo.username).toBe(user.username);
      expect(tokenInfo.email).toBe(user.email);
    });

    test('should reject login with invalid password', async () => {
      // Setup: Create a user with hashed password
      const originalPassword = 'CorrectPass123!';
      const hashedPassword = await passwordService.hashPassword(originalPassword);
      
      const user = {
        _id: new ObjectId(),
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: hashedPassword,
      };

      // Step 1: Validate login data with wrong password
      const loginData = {
        username: 'testuser',
        password: 'WrongPass123!',
      };

      const validationResult = validationService.validateLoginData(loginData);
      expect(validationResult.isValid).toBe(true); // Format is valid

      // Step 2: Verify password (should fail)
      const passwordValid = await passwordService.verifyPassword(
        loginData.password,
        user.passwordHash
      );
      expect(passwordValid).toBe(false);

      // Step 3: Should not generate tokens for failed login
      // (In real implementation, this step would be skipped)
    });
  });

  describe('Token Refresh Flow', () => {
    test('should refresh access token using valid refresh token', async () => {
      // Setup: Create user and initial tokens
      const user = {
        _id: new ObjectId(),
        username: 'refreshuser',
        email: 'refresh@example.com',
      };

      const initialTokens = tokenService.generateTokenPair(user);

      // Step 1: Simulate access token near expiry
      const shouldRefresh = tokenService.shouldRefreshToken(
        initialTokens.accessToken.token,
        60 // 60 minutes threshold
      );
      expect(shouldRefresh).toBe(true); // Default token is 15 minutes

      // Step 2: Refresh the token
      const refreshResult = tokenService.refreshAccessToken(
        initialTokens.refreshToken.token,
        user
      );

      expect(refreshResult.success).toBe(true);
      expect(refreshResult.tokens).toBeDefined();
      expect(refreshResult.oldRefreshTokenId).toBe(initialTokens.refreshToken.tokenId);

      // Step 3: Verify new tokens are valid
      const newAccessVerification = tokenService.verifyAccessToken(
        refreshResult.tokens.accessToken.token
      );
      expect(newAccessVerification.isValid).toBe(true);

      const newRefreshVerification = tokenService.verifyRefreshToken(
        refreshResult.tokens.refreshToken.token
      );
      expect(newRefreshVerification.isValid).toBe(true);

      // Step 4: Verify new tokens have same session ID
      expect(refreshResult.tokens.sessionId).toBe(initialTokens.sessionId);
    });
  });

  describe('Password Reset Flow', () => {
    test('should validate password reset data and hash new password', async () => {
      // Step 1: Validate password reset request
      const resetRequest = {
        email: 'reset@example.com',
      };

      const requestValidation = validationService.validatePasswordResetRequest(resetRequest);
      expect(requestValidation.isValid).toBe(true);

      // Step 2: Validate password reset with new password
      const resetData = {
        token: 'valid-reset-token-from-email',
        newPassword: 'NewSecurePass123!',
        confirmPassword: 'NewSecurePass123!',
      };

      const resetValidation = validationService.validatePasswordReset(resetData);
      expect(resetValidation.isValid).toBe(true);

      // Step 3: Hash the new password
      const newHashedPassword = await passwordService.hashPassword(resetData.newPassword);
      expect(newHashedPassword).toBeDefined();
      expect(newHashedPassword).not.toBe(resetData.newPassword);

      // Step 4: Verify new password can be used for login
      const passwordValid = await passwordService.verifyPassword(
        resetData.newPassword,
        newHashedPassword
      );
      expect(passwordValid).toBe(true);
    });
  });

  describe('Security Validation', () => {
    test('should validate password strength requirements', () => {
      const weakPasswords = [
        'weak',
        '12345678',
        'password',
        'Password',
        'Password123',
      ];

      const strongPasswords = [
        'StrongPass123!',
        'MySecure2024@Pass',
        'Complex#Password789',
      ];

      // Test weak passwords
      weakPasswords.forEach(password => {
        const result = passwordService.validatePassword(password);
        expect(result.strength).not.toBe('strong');
      });

      // Test strong passwords
      strongPasswords.forEach(password => {
        const result = passwordService.validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(['strong', 'very-strong']).toContain(result.strength);
      });
    });

    test('should sanitize and validate user inputs', () => {
      const maliciousInputs = {
        username: '<script>alert("xss")</script>',
        email: 'test@example.com<script>',
        profile: {
          firstName: 'John<script>alert("xss")</script>',
          lastName: 'Doe',
        },
      };

      const validationResult = validationService.validateRegistrationData(maliciousInputs);
      
      // Should reject due to invalid characters
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);
    });

    test('should validate token configuration security', () => {
      const configValidation = tokenService.validateConfiguration();
      expect(configValidation.isValid).toBe(true);
      expect(configValidation.errors).toHaveLength(0);
    });
  });
});