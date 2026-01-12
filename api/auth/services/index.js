/**
 * Authentication Services Index
 * Exports all authentication services
 */

const PasswordService = require('./passwordService');
const ValidationService = require('./validationService');
const TokenService = require('./tokenService');
const EmailService = require('./emailService');

module.exports = {
  PasswordService,
  ValidationService,
  TokenService,
  EmailService,
};