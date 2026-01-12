/**
 * Enhanced Login Tests
 * Tests for login endpoint with advanced rate limiting and security features
 */

const AuthController = require('../authController');
const { MongoClient } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');

describe('Enhanced Login Functionality', () => {
  let mongoServer;
  let mongoClient;
  let db;
  let authController;

  beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    db = mongoClient.db('test-auth');
    
    authController = new AuthController(db);
  });

  afterAll(async () => {
    await mongoClient.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clean up collections before each test
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.collection(collection.name).deleteMany({});
    }

    // Create test user
    await authController.models.User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPassword123!',
    });
  });

  describe('Login with Rate Limiting Integration', () => {
    test('should handle successful login and clear rate limiting', async () => {
      const req = {
        body: {
          username: 'testuser',
          password: 'TestPassword123!',
        },
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Test User Agent'),
        rateLimitUserKey: 'user:testuser',
        progressiveDelayKey: 'delay:127.0.0.1',
        captchaKey: 'captcha:127.0.0.1',
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Login successful',
          user: expect.objectContaining({
            username: 'testuser',
            email: 'test@example.com',
          }),
          tokens: expect.objectContaining({
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
            tokenType: 'Bearer',
          }),
        })
      );
    });

    test('should handle failed login and trigger rate limiting', async () => {
      const req = {
        body: {
          username: 'testuser',
          password: 'WrongPassword123!',
        },
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Test User Agent'),
        rateLimitUserKey: 'user:testuser',
        progressiveDelayKey: 'delay:127.0.0.1',
        captchaKey: 'captcha:127.0.0.1',
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid credentials',
          message: 'Username or password is incorrect',
        })
      );
    });

    test('should handle failed login with non-existent user', async () => {
      const req = {
        body: {
          username: 'nonexistent',
          password: 'TestPassword123!',
        },
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Test User Agent'),
        rateLimitUserKey: 'user:nonexistent',
        progressiveDelayKey: 'delay:127.0.0.1',
        captchaKey: 'captcha:127.0.0.1',
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid credentials',
        })
      );
    });

    test('should handle login with email instead of username', async () => {
      const req = {
        body: {
          email: 'test@example.com',
          password: 'TestPassword123!',
        },
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Test User Agent'),
        rateLimitUserKey: 'user:test@example.com',
        progressiveDelayKey: 'delay:127.0.0.1',
        captchaKey: 'captcha:127.0.0.1',
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Login successful',
          user: expect.objectContaining({
            username: 'testuser',
            email: 'test@example.com',
          }),
        })
      );
    });

    test('should handle validation errors', async () => {
      const req = {
        body: {
          // Missing username/email and password
        },
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Test User Agent'),
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid input',
          details: expect.any(Array),
        })
      );
    });

    test('should update last login timestamp on successful login', async () => {
      const req = {
        body: {
          username: 'testuser',
          password: 'TestPassword123!',
        },
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Test User Agent'),
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Get user before login
      const userBefore = await authController.models.User.findByUsername('testuser');
      expect(userBefore.lastLoginAt).toBeNull();

      await authController.login(req, res);

      // Get user after login
      const userAfter = await authController.models.User.findByUsername('testuser');
      expect(userAfter.lastLoginAt).toBeInstanceOf(Date);
      expect(userAfter.lastLoginAt.getTime()).toBeGreaterThan(userBefore.createdAt.getTime());
    });

    test('should create session record on successful login', async () => {
      const req = {
        body: {
          username: 'testuser',
          password: 'TestPassword123!',
        },
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Test User Agent'),
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Check sessions before login
      const user = await authController.models.User.findByUsername('testuser');
      const sessionsBefore = await authController.models.Session.findByUserId(user._id);
      expect(sessionsBefore).toHaveLength(0);

      await authController.login(req, res);

      // Check sessions after login
      const sessionsAfter = await authController.models.Session.findByUserId(user._id);
      expect(sessionsAfter).toHaveLength(1);
      expect(sessionsAfter[0].ipAddress).toBe('127.0.0.1');
      expect(sessionsAfter[0].userAgent).toBe('Test User Agent');
      expect(sessionsAfter[0].isActive).toBe(true);
    });
  });

  describe('Security Features', () => {
    test('should handle server errors gracefully', async () => {
      // Mock a database error
      const originalFindByUsername = authController.models.User.findByUsername;
      authController.models.User.findByUsername = jest.fn().mockRejectedValue(new Error('Database error'));

      const req = {
        body: {
          username: 'testuser',
          password: 'TestPassword123!',
        },
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Test User Agent'),
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Internal server error',
          message: 'Login failed due to server error',
        })
      );

      // Restore original method
      authController.models.User.findByUsername = originalFindByUsername;
    });

    test('should not expose sensitive information in error responses', async () => {
      const req = {
        body: {
          username: 'testuser',
          password: 'WrongPassword123!',
        },
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Test User Agent'),
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.login(req, res);

      const response = res.json.mock.calls[0][0];
      
      // Should not expose whether username exists or password is wrong
      expect(response.message).toBe('Username or password is incorrect');
      expect(response).not.toHaveProperty('user');
      expect(response).not.toHaveProperty('passwordHash');
    });

    test('should enforce session limits', async () => {
      const req = {
        body: {
          username: 'testuser',
          password: 'TestPassword123!',
        },
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Test User Agent'),
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Login should call enforceMaxSessions
      const enforceMaxSessionsSpy = jest.spyOn(authController.models.Session, 'enforceMaxSessions');

      await authController.login(req, res);

      expect(enforceMaxSessionsSpy).toHaveBeenCalled();

      enforceMaxSessionsSpy.mockRestore();
    });
  });
});