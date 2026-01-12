/**
 * Email Service Tests
 * Unit tests for AWS SES email functionality
 */

const EmailService = require('../emailService');

// Mock AWS SDK
jest.mock('aws-sdk', () => ({
  SES: jest.fn().mockImplementation(() => ({
    sendEmail: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        MessageId: 'test-message-id-123'
      })
    }),
    getSendQuota: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Max24HourSend: 200,
        MaxSendRate: 1,
        SentLast24Hours: 0
      })
    })
  }))
}));

describe('EmailService', () => {
  let emailService;
  let mockSES;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create email service instance
    emailService = new EmailService();
    
    // Get the mocked SES instance
    const AWS = require('aws-sdk');
    mockSES = new AWS.SES();
  });

  describe('constructor', () => {
    test('should initialize with AWS SES configuration', () => {
      expect(emailService.ses).toBeDefined();
      expect(emailService.fromEmail).toBeDefined();
    });

    test('should validate configuration on initialization', () => {
      expect(typeof emailService.isConfigured).toBe('boolean');
    });
  });

  describe('validateConfiguration', () => {
    test('should return configuration status', () => {
      const isValid = emailService.validateConfiguration();
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('sendPasswordResetEmail', () => {
    const validOptions = {
      to: 'test@example.com',
      resetToken: 'test-reset-token-123',
      username: 'testuser',
      resetUrl: 'https://example.com/reset-password'
    };

    test('should send password reset email successfully', async () => {
      // Mock successful configuration
      emailService.isConfigured = true;

      const result = await emailService.sendPasswordResetEmail(validOptions);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id-123');
      expect(result.recipient).toBe('test@example.com');
      expect(mockSES.sendEmail).toHaveBeenCalled();
    });

    test('should throw error when not configured', async () => {
      emailService.isConfigured = false;

      await expect(emailService.sendPasswordResetEmail(validOptions))
        .rejects.toThrow('Email service is not properly configured');
    });

    test('should throw error with missing parameters', async () => {
      emailService.isConfigured = true;

      const invalidOptions = {
        to: 'test@example.com',
        // Missing resetToken and username
      };

      await expect(emailService.sendPasswordResetEmail(invalidOptions))
        .rejects.toThrow('Missing required email parameters');
    });

    test('should handle SES errors gracefully', async () => {
      emailService.isConfigured = true;
      
      // Mock SES error
      mockSES.sendEmail.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('SES Error'))
      });

      const result = await emailService.sendPasswordResetEmail(validOptions);

      expect(result.success).toBe(false);
      expect(result.error).toBe('SES Error');
      expect(result.recipient).toBe('test@example.com');
    });

    test('should generate proper reset URL when not provided', async () => {
      emailService.isConfigured = true;

      const optionsWithoutUrl = {
        to: 'test@example.com',
        resetToken: 'test-token',
        username: 'testuser'
      };

      await emailService.sendPasswordResetEmail(optionsWithoutUrl);

      expect(mockSES.sendEmail).toHaveBeenCalled();
      
      // Check that the email was called with proper parameters
      const callArgs = mockSES.sendEmail.mock.calls[0][0];
      expect(callArgs.Message.Body.Html.Data).toContain('test-token');
    });
  });

  describe('sendWelcomeEmail', () => {
    const validOptions = {
      to: 'test@example.com',
      username: 'testuser',
      loginUrl: 'https://example.com/login'
    };

    test('should send welcome email successfully', async () => {
      emailService.isConfigured = true;

      const result = await emailService.sendWelcomeEmail(validOptions);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id-123');
      expect(result.recipient).toBe('test@example.com');
      expect(mockSES.sendEmail).toHaveBeenCalled();
    });

    test('should throw error when not configured', async () => {
      emailService.isConfigured = false;

      await expect(emailService.sendWelcomeEmail(validOptions))
        .rejects.toThrow('Email service is not properly configured');
    });

    test('should throw error with missing parameters', async () => {
      emailService.isConfigured = true;

      const invalidOptions = {
        to: 'test@example.com',
        // Missing username
      };

      await expect(emailService.sendWelcomeEmail(invalidOptions))
        .rejects.toThrow('Missing required email parameters');
    });
  });

  describe('sendSecurityAlertEmail', () => {
    const validOptions = {
      to: 'test@example.com',
      username: 'testuser',
      alertType: 'Suspicious Login',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0...'
    };

    test('should send security alert email successfully', async () => {
      emailService.isConfigured = true;

      const result = await emailService.sendSecurityAlertEmail(validOptions);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id-123');
      expect(result.recipient).toBe('test@example.com');
      expect(mockSES.sendEmail).toHaveBeenCalled();
    });

    test('should throw error with missing required parameters', async () => {
      emailService.isConfigured = true;

      const invalidOptions = {
        to: 'test@example.com',
        username: 'testuser',
        // Missing alertType
      };

      await expect(emailService.sendSecurityAlertEmail(invalidOptions))
        .rejects.toThrow('Missing required email parameters');
    });
  });

  describe('generatePasswordResetEmail', () => {
    test('should generate proper email content', () => {
      const data = {
        username: 'testuser',
        resetUrl: 'https://example.com/reset?token=abc123',
        resetToken: 'abc123'
      };

      const content = emailService.generatePasswordResetEmail(data);

      expect(content.subject).toContain('Reset Your Mozambique Portal Password');
      expect(content.html).toContain('testuser');
      expect(content.html).toContain('https://example.com/reset?token=abc123');
      expect(content.text).toContain('testuser');
      expect(content.text).toContain('https://example.com/reset?token=abc123');
    });
  });

  describe('generateWelcomeEmail', () => {
    test('should generate proper welcome email content', () => {
      const data = {
        username: 'testuser',
        loginUrl: 'https://example.com/login'
      };

      const content = emailService.generateWelcomeEmail(data);

      expect(content.subject).toContain('Welcome to Mozambique Portal');
      expect(content.html).toContain('testuser');
      expect(content.html).toContain('https://example.com/login');
      expect(content.text).toContain('testuser');
      expect(content.text).toContain('https://example.com/login');
    });
  });

  describe('generateSecurityAlertEmail', () => {
    test('should generate proper security alert email content', () => {
      const data = {
        username: 'testuser',
        alertType: 'Suspicious Login',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        timestamp: new Date('2024-01-01T12:00:00Z')
      };

      const content = emailService.generateSecurityAlertEmail(data);

      expect(content.subject).toContain('Security Alert');
      expect(content.subject).toContain('Suspicious Login');
      expect(content.html).toContain('testuser');
      expect(content.html).toContain('Suspicious Login');
      expect(content.html).toContain('192.168.1.1');
      expect(content.text).toContain('testuser');
      expect(content.text).toContain('Suspicious Login');
    });
  });

  describe('testConfiguration', () => {
    test('should test configuration successfully', async () => {
      emailService.isConfigured = true;

      const result = await emailService.testConfiguration();

      expect(result.success).toBe(true);
      expect(result.quota).toBeDefined();
      expect(result.quota.max24HourSend).toBe(200);
      expect(mockSES.getSendQuota).toHaveBeenCalled();
    });

    test('should return error when not configured', async () => {
      emailService.isConfigured = false;

      const result = await emailService.testConfiguration();

      expect(result.success).toBe(false);
      expect(result.error).toContain('not properly configured');
    });

    test('should handle SES errors in configuration test', async () => {
      emailService.isConfigured = true;
      
      mockSES.getSendQuota.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('AWS Error'))
      });

      const result = await emailService.testConfiguration();

      expect(result.success).toBe(false);
      expect(result.error).toBe('AWS Error');
    });
  });

  describe('getDeliveryStatus', () => {
    test('should return delivery status', async () => {
      emailService.isConfigured = true;

      const result = await emailService.getDeliveryStatus('test-message-id');

      expect(result.messageId).toBe('test-message-id');
      expect(result.status).toBe('sent');
    });

    test('should throw error when not configured', async () => {
      emailService.isConfigured = false;

      await expect(emailService.getDeliveryStatus('test-message-id'))
        .rejects.toThrow('Email service is not properly configured');
    });
  });
});