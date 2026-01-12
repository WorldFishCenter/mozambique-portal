# Authentication System

This directory contains the backend authentication system for the Mozambique Portal application.

## Structure

```
api/auth/
├── controllers/     # Request handlers for authentication endpoints
├── middleware/      # Authentication and security middleware
├── models/         # Database models and schemas
├── routes/         # Express route definitions
├── services/       # Business logic and external service integrations
├── utils/          # Utility functions and configuration
└── README.md       # This file
```

## Features

- User registration and login
- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting for brute force protection
- Password recovery via AWS SES
- Session management
- Input validation and sanitization
- CSRF protection

## Environment Variables

Required environment variables (see .env.example):

- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_REFRESH_SECRET` - Secret key for refresh tokens
- `AWS_ACCESS_KEY_ID` - AWS access key for SES
- `AWS_SECRET_ACCESS_KEY` - AWS secret key for SES
- `AWS_SES_FROM_EMAIL` - Email address for sending password reset emails

## Security Features

- Password hashing with configurable salt rounds
- JWT tokens with short expiration times
- Refresh token rotation
- Rate limiting on authentication endpoints
- Input validation and sanitization
- CSRF protection
- Secure session management

## Testing

The authentication system includes both unit tests and property-based tests using Jest and fast-check.

Run tests with:
```bash
npm test
```

## API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/verify-token` - Verify JWT token