/**
 * Email Service
 * Handles email sending via AWS SES for authentication purposes
 */

const AWS = require('aws-sdk');
const config = require('../utils/config');

class EmailService {
  constructor() {
    // Configure AWS SES
    this.ses = new AWS.SES({
      region: config.aws.region,
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
    });

    this.fromEmail = config.aws.sesFromEmail;
    this.isConfigured = this.validateConfiguration();
  }

  /**
   * Validate AWS SES configuration
   * @returns {boolean} True if properly configured
   */
  validateConfiguration() {
    const requiredConfig = [
      config.aws.accessKeyId,
      config.aws.secretAccessKey,
      config.aws.region,
      config.aws.sesFromEmail,
    ];

    const isValid = requiredConfig.every(value => value && value.length > 0);
    
    if (!isValid) {
      console.warn('AWS SES not properly configured. Email features will be disabled.');
      return false;
    }

    return true;
  }

  /**
   * Send password reset email
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email address
   * @param {string} options.resetToken - Password reset token
   * @param {string} options.username - Username for personalization
   * @param {string} options.resetUrl - Base URL for password reset
   * @returns {Promise<Object>} Send result
   */
  async sendPasswordResetEmail(options) {
    const { to, resetToken, username, resetUrl } = options;

    if (!this.isConfigured) {
      throw new Error('Email service is not properly configured');
    }

    // Validate required parameters
    if (!to || !resetToken || !username) {
      throw new Error('Missing required email parameters');
    }

    // Construct reset URL
    const fullResetUrl = resetUrl 
      ? `${resetUrl}?token=${resetToken}`
      : `${process.env.VITE_API_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Generate email content
    const emailContent = this.generatePasswordResetEmail({
      username,
      resetUrl: fullResetUrl,
      resetToken,
    });

    const params = {
      Source: this.fromEmail,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: emailContent.subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: emailContent.html,
            Charset: 'UTF-8',
          },
          Text: {
            Data: emailContent.text,
            Charset: 'UTF-8',
          },
        },
      },
      Tags: [
        {
          Name: 'EmailType',
          Value: 'PasswordReset',
        },
        {
          Name: 'Application',
          Value: 'MozambiquePortal',
        },
      ],
    };

    try {
      const result = await this.ses.sendEmail(params).promise();
      
      console.log(`Password reset email sent successfully to ${to}. MessageId: ${result.MessageId}`);
      
      return {
        success: true,
        messageId: result.MessageId,
        recipient: to,
      };
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      
      return {
        success: false,
        error: error.message,
        code: error.code,
        recipient: to,
      };
    }
  }

  /**
   * Send welcome email to new users
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email address
   * @param {string} options.username - Username for personalization
   * @param {string} options.loginUrl - Login URL
   * @returns {Promise<Object>} Send result
   */
  async sendWelcomeEmail(options) {
    const { to, username, loginUrl } = options;

    if (!this.isConfigured) {
      throw new Error('Email service is not properly configured');
    }

    if (!to || !username) {
      throw new Error('Missing required email parameters');
    }

    const emailContent = this.generateWelcomeEmail({
      username,
      loginUrl: loginUrl || `${process.env.VITE_API_URL || 'http://localhost:3000'}/login`,
    });

    const params = {
      Source: this.fromEmail,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: emailContent.subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: emailContent.html,
            Charset: 'UTF-8',
          },
          Text: {
            Data: emailContent.text,
            Charset: 'UTF-8',
          },
        },
      },
      Tags: [
        {
          Name: 'EmailType',
          Value: 'Welcome',
        },
        {
          Name: 'Application',
          Value: 'MozambiquePortal',
        },
      ],
    };

    try {
      const result = await this.ses.sendEmail(params).promise();
      
      console.log(`Welcome email sent successfully to ${to}. MessageId: ${result.MessageId}`);
      
      return {
        success: true,
        messageId: result.MessageId,
        recipient: to,
      };
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      
      return {
        success: false,
        error: error.message,
        code: error.code,
        recipient: to,
      };
    }
  }

  /**
   * Send security alert email
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email address
   * @param {string} options.username - Username for personalization
   * @param {string} options.alertType - Type of security alert
   * @param {string} options.ipAddress - IP address of the activity
   * @param {string} options.userAgent - User agent of the activity
   * @returns {Promise<Object>} Send result
   */
  async sendSecurityAlertEmail(options) {
    const { to, username, alertType, ipAddress, userAgent } = options;

    if (!this.isConfigured) {
      throw new Error('Email service is not properly configured');
    }

    if (!to || !username || !alertType) {
      throw new Error('Missing required email parameters');
    }

    const emailContent = this.generateSecurityAlertEmail({
      username,
      alertType,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });

    const params = {
      Source: this.fromEmail,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: emailContent.subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: emailContent.html,
            Charset: 'UTF-8',
          },
          Text: {
            Data: emailContent.text,
            Charset: 'UTF-8',
          },
        },
      },
      Tags: [
        {
          Name: 'EmailType',
          Value: 'SecurityAlert',
        },
        {
          Name: 'Application',
          Value: 'MozambiquePortal',
        },
      ],
    };

    try {
      const result = await this.ses.sendEmail(params).promise();
      
      console.log(`Security alert email sent successfully to ${to}. MessageId: ${result.MessageId}`);
      
      return {
        success: true,
        messageId: result.MessageId,
        recipient: to,
      };
    } catch (error) {
      console.error('Failed to send security alert email:', error);
      
      return {
        success: false,
        error: error.message,
        code: error.code,
        recipient: to,
      };
    }
  }

  /**
   * Generate password reset email content
   * @param {Object} data - Email data
   * @returns {Object} Email content (subject, html, text)
   */
  generatePasswordResetEmail(data) {
    const { username, resetUrl, resetToken } = data;
    
    const subject = 'Reset Your Mozambique Portal Password';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - Mozambique Portal</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0066cc; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Mozambique Portal</h1>
            <h2>Password Reset Request</h2>
        </div>
        
        <div class="content">
            <p>Hello <strong>${username}</strong>,</p>
            
            <p>We received a request to reset your password for your Mozambique Portal account. If you made this request, click the button below to reset your password:</p>
            
            <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Your Password</a>
            </p>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 4px;">
                ${resetUrl}
            </p>
            
            <div class="warning">
                <strong>Important Security Information:</strong>
                <ul>
                    <li>This link will expire in 1 hour for security reasons</li>
                    <li>If you didn't request this password reset, please ignore this email</li>
                    <li>Never share this link with anyone</li>
                    <li>For security, this link can only be used once</li>
                </ul>
            </div>
            
            <p>If you're having trouble clicking the button, you can also reset your password by visiting the login page and clicking "Forgot Password".</p>
            
            <p>If you didn't request this password reset, your account is still secure. You can safely ignore this email.</p>
        </div>
        
        <div class="footer">
            <p>This is an automated message from Mozambique Portal. Please do not reply to this email.</p>
            <p>If you need help, please contact our support team.</p>
        </div>
    </div>
</body>
</html>`;

    const text = `
Mozambique Portal - Password Reset Request

Hello ${username},

We received a request to reset your password for your Mozambique Portal account.

To reset your password, please visit the following link:
${resetUrl}

IMPORTANT SECURITY INFORMATION:
- This link will expire in 1 hour for security reasons
- If you didn't request this password reset, please ignore this email
- Never share this link with anyone
- For security, this link can only be used once

If you didn't request this password reset, your account is still secure. You can safely ignore this email.

This is an automated message from Mozambique Portal. Please do not reply to this email.
`;

    return { subject, html, text };
  }

  /**
   * Generate welcome email content
   * @param {Object} data - Email data
   * @returns {Object} Email content (subject, html, text)
   */
  generateWelcomeEmail(data) {
    const { username, loginUrl } = data;
    
    const subject = 'Welcome to Mozambique Portal!';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome - Mozambique Portal</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0066cc; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Mozambique Portal!</h1>
        </div>
        
        <div class="content">
            <p>Hello <strong>${username}</strong>,</p>
            
            <p>Welcome to the Mozambique Portal! Your account has been successfully created and you can now access all the features of our platform.</p>
            
            <p>You can now:</p>
            <ul>
                <li>Access fisheries data and analytics</li>
                <li>View interactive maps and visualizations</li>
                <li>Generate reports and insights</li>
                <li>Collaborate with other researchers and stakeholders</li>
            </ul>
            
            <p style="text-align: center;">
                <a href="${loginUrl}" class="button">Login to Your Account</a>
            </p>
            
            <p>If you have any questions or need assistance getting started, please don't hesitate to contact our support team.</p>
            
            <p>Thank you for joining the Mozambique Portal community!</p>
        </div>
        
        <div class="footer">
            <p>This is an automated message from Mozambique Portal. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>`;

    const text = `
Welcome to Mozambique Portal!

Hello ${username},

Welcome to the Mozambique Portal! Your account has been successfully created and you can now access all the features of our platform.

You can now:
- Access fisheries data and analytics
- View interactive maps and visualizations
- Generate reports and insights
- Collaborate with other researchers and stakeholders

Login to your account: ${loginUrl}

If you have any questions or need assistance getting started, please don't hesitate to contact our support team.

Thank you for joining the Mozambique Portal community!

This is an automated message from Mozambique Portal. Please do not reply to this email.
`;

    return { subject, html, text };
  }

  /**
   * Generate security alert email content
   * @param {Object} data - Email data
   * @returns {Object} Email content (subject, html, text)
   */
  generateSecurityAlertEmail(data) {
    const { username, alertType, ipAddress, userAgent, timestamp } = data;
    
    const subject = `Security Alert - ${alertType} - Mozambique Portal`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Alert - Mozambique Portal</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .alert { background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 Security Alert</h1>
            <h2>Mozambique Portal</h2>
        </div>
        
        <div class="content">
            <p>Hello <strong>${username}</strong>,</p>
            
            <div class="alert">
                <strong>Security Event Detected:</strong> ${alertType}
            </div>
            
            <p>We detected the following security-related activity on your account:</p>
            
            <ul>
                <li><strong>Event:</strong> ${alertType}</li>
                <li><strong>Time:</strong> ${timestamp.toLocaleString()}</li>
                <li><strong>IP Address:</strong> ${ipAddress || 'Unknown'}</li>
                <li><strong>Device/Browser:</strong> ${userAgent || 'Unknown'}</li>
            </ul>
            
            <p><strong>What should you do?</strong></p>
            <ul>
                <li>If this was you, no action is needed</li>
                <li>If this wasn't you, please change your password immediately</li>
                <li>Review your account for any unauthorized changes</li>
                <li>Contact support if you notice anything suspicious</li>
            </ul>
            
            <p>For your security, we recommend:</p>
            <ul>
                <li>Using a strong, unique password</li>
                <li>Enabling two-factor authentication when available</li>
                <li>Regularly reviewing your account activity</li>
                <li>Logging out from shared or public computers</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>This is an automated security alert from Mozambique Portal. Please do not reply to this email.</p>
            <p>If you need assistance, please contact our support team.</p>
        </div>
    </div>
</body>
</html>`;

    const text = `
SECURITY ALERT - Mozambique Portal

Hello ${username},

We detected the following security-related activity on your account:

Event: ${alertType}
Time: ${timestamp.toLocaleString()}
IP Address: ${ipAddress || 'Unknown'}
Device/Browser: ${userAgent || 'Unknown'}

What should you do?
- If this was you, no action is needed
- If this wasn't you, please change your password immediately
- Review your account for any unauthorized changes
- Contact support if you notice anything suspicious

For your security, we recommend:
- Using a strong, unique password
- Enabling two-factor authentication when available
- Regularly reviewing your account activity
- Logging out from shared or public computers

This is an automated security alert from Mozambique Portal. Please do not reply to this email.
`;

    return { subject, html, text };
  }

  /**
   * Verify email delivery status
   * @param {string} messageId - SES message ID
   * @returns {Promise<Object>} Delivery status
   */
  async getDeliveryStatus(messageId) {
    if (!this.isConfigured) {
      throw new Error('Email service is not properly configured');
    }

    try {
      // Note: SES doesn't provide a direct API to check delivery status
      // In production, you would typically use SNS notifications or CloudWatch logs
      return {
        messageId,
        status: 'sent',
        message: 'Email sent successfully. Delivery status tracking requires SNS configuration.',
      };
    } catch (error) {
      return {
        messageId,
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Test email configuration
   * @returns {Promise<Object>} Test result
   */
  async testConfiguration() {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'Email service is not properly configured',
      };
    }

    try {
      // Test by getting SES sending quota
      const quota = await this.ses.getSendQuota().promise();
      
      return {
        success: true,
        message: 'Email service is properly configured',
        quota: {
          max24HourSend: quota.Max24HourSend,
          maxSendRate: quota.MaxSendRate,
          sentLast24Hours: quota.SentLast24Hours,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }
}

module.exports = EmailService;