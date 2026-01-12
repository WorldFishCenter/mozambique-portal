/**
 * Authentication Controller Tests
 * Unit tests for authentication endpoints
 */

const AuthController = require('../authController');
const { MongoClient } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');

describe('AuthController', () => {
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
  });

  describe('register', () => {
    test('should register a new user successfully', async () => {
      const req = {
        body: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'TestPassword123!',
          profile: {
            firstName: 'Test',
            lastName: 'User',
          },
        },
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Test User Agent'),
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User registered successfully',
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

    test('should reject registration with invalid data', async () => {
      const req = {
        body: {
          username: 'ab', // too short
          email: 'invalid-email',
          password: 'weak',
        },
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Test User Agent'),
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Validation failed',
          details: expect.any(Array),
        })
      );
    });

    test('should reject duplicate username', async () => {
      // First registration
      const userData = {
        username: 'testuser',
        email: 'test1@example.com',
        password: 'TestPassword123!',
      };

      await authController.models.User.create(userData);

      // Second registration with same username
      const req = {
        body: {
          username: 'testuser',
          email: 'test2@example.com',
          password: 'TestPassword123!',
        },
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Test User Agent'),
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Registration failed',
          details: ['Username already exists'],
        })
      );
    });

    test('should reject duplicate email', async () => {
      // First registration
      const userData = {
        username: 'testuser1',
        email: 'test@example.com',
        password: 'TestPassword123!',
      };

      await authController.models.User.create(userData);

      // Second registration with same email
      const req = {
        body: {
          username: 'testuser2',
          email: 'test@example.com',
          password: 'TestPassword123!',
        },
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Test User Agent'),
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Registration failed',
          details: ['Email already exists'],
        })
      );
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await authController.models.User.create({
        username: 'loginuser',
        email: 'login@example.com',
        password: 'LoginPassword123!',
      });
    });

    test('should login with valid credentials', async () => {
      const req = {
        body: {
          username: 'loginuser',
          password: 'LoginPassword123!',
        },
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Test User Agent'),
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
            username: 'loginuser',
            email: 'login@example.com',
          }),
          tokens: expect.objectContaining({
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
            tokenType: 'Bearer',
          }),
        })
      );
    });

    test('should reject login with invalid username', async () => {
      const req = {
        body: {
          username: 'nonexistent',
          password: 'LoginPassword123!',
        },
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Test User Agent'),
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

    test('should reject login with invalid password', async () => {
      const req = {
        body: {
          username: 'loginuser',
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

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid credentials',
        })
      );
    });
  });

  describe('verifyToken', () => {
    test('should verify valid token', async () => {
      // Create user and generate token
      const user = await authController.models.User.create({
        username: 'tokenuser',
        email: 'token@example.com',
        password: 'TokenPassword123!',
      });

      const tokenPair = authController.tokenService.generateTokenPair(user);

      const req = {
        get: jest.fn().mockReturnValue(`Bearer ${tokenPair.accessToken.token}`),
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.verifyToken(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Token is valid',
          user: expect.objectContaining({
            username: 'tokenuser',
            email: 'token@example.com',
          }),
        })
      );
    });

    test('should reject invalid token', async () => {
      const req = {
        get: jest.fn().mockReturnValue('Bearer invalid-token'),
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.verifyToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid token',
        })
      );
    });
  });
});