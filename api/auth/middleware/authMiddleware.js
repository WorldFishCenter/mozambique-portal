/**
 * Authentication Middleware
 * Validates JWT tokens and protects routes with comprehensive security checks
 */

const { TokenService } = require('../services');
const { initializeModels } = require('../models');

/**
 * Create authentication middleware
 * @param {Object} db - MongoDB database instance
 * @param {Object} options - Middleware options
 * @param {boolean} options.requireActive - Require user to be active (default: true)
 * @param {boolean} options.checkSession - Check session validity (default: true)
 * @param {number} options.refreshThreshold - Minutes before suggesting token refresh (default: 5)
 * @returns {Function} Express middleware function
 */
function createAuthMiddleware(db, options = {}) {
  const {
    requireActive = true,
    checkSession = true,
    refreshThreshold = 5,
  } = options;

  const models = initializeModels(db);
  const tokenService = new TokenService();

  return async (req, res, next) => {
    const startTime = Date.now();
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    try {
      // Extract token from Authorization header
      const authHeader = req.get('Authorization');
      const accessToken = tokenService.extractTokenFromHeader(authHeader);

      if (!accessToken) {
        // Log authentication attempt
        console.log(`Authentication failed - Missing token: ${clientIP} ${userAgent}`);
        
        return res.status(401).json({
          success: false,
          error: 'Missing authorization token',
          message: 'Authorization header with Bearer token is required',
        });
      }

      // Verify the access token
      const tokenVerification = tokenService.verifyAccessToken(accessToken);
      if (!tokenVerification.isValid) {
        // Log failed token verification
        console.log(`Authentication failed - Invalid token: ${clientIP} ${tokenVerification.error}`);
        
        return res.status(401).json({
          success: false,
          error: 'Invalid token',
          message: tokenVerification.error,
        });
      }

      const { userId, sessionId, iat, exp } = tokenVerification.payload;

      // Find the user
      const user = await models.User.findById(userId);
      if (!user) {
        console.log(`Authentication failed - User not found: ${userId} from ${clientIP}`);
        
        return res.status(401).json({
          success: false,
          error: 'User not found',
          message: 'User associated with token not found',
        });
      }

      // Check if user account is active (if required)
      if (requireActive && user.status && user.status !== 'active') {
        console.log(`Authentication failed - User inactive: ${user.username} (${user.status}) from ${clientIP}`);
        
        return res.status(401).json({
          success: false,
          error: 'Account inactive',
          message: 'User account is not active',
        });
      }

      // Verify session is still active (if sessionId is present and checking is enabled)
      let session = null;
      if (checkSession && sessionId) {
        try {
          // Use the Session model's findById method for proper ObjectId handling
          session = await models.Session.collection.findOne({
            _id: models.Session.ObjectId ? 
              new models.Session.ObjectId(sessionId) : 
              sessionId,
            isActive: true,
            expiresAt: { $gt: new Date() }
          });

          if (!session) {
            console.log(`Authentication failed - Session expired: ${sessionId} for user ${user.username}`);
            
            return res.status(401).json({
              success: false,
              error: 'Session expired',
              message: 'User session has expired or been invalidated',
            });
          }

          // Verify the token hash matches (additional security check)
          const tokenHash = models.Session.hashToken(accessToken);
          if (session.accessToken !== tokenHash) {
            console.log(`Authentication failed - Token hash mismatch for user ${user.username}`);
            
            return res.status(401).json({
              success: false,
              error: 'Token mismatch',
              message: 'Token does not match session record',
            });
          }

        } catch (sessionError) {
          console.error('Session validation error:', sessionError);
          
          return res.status(401).json({
            success: false,
            error: 'Session validation failed',
            message: 'Unable to validate user session',
          });
        }
      }

      // Check for suspicious activity (token issued in the future)
      const now = Math.floor(Date.now() / 1000);
      if (iat > now + 60) { // Allow 1 minute clock skew
        console.warn(`Suspicious token - Future issued time: ${user.username} iat=${iat} now=${now}`);
        
        return res.status(401).json({
          success: false,
          error: 'Invalid token timing',
          message: 'Token has invalid issue time',
        });
      }

      // Check if token should be refreshed soon
      const shouldRefresh = tokenService.shouldRefreshToken(accessToken, refreshThreshold);
      if (shouldRefresh) {
        res.set('X-Token-Refresh-Suggested', 'true');
        const timeUntilExpiry = exp - now;
        res.set('X-Token-Expires-In', timeUntilExpiry.toString());
      }

      // Update user's last activity timestamp (optional, for session tracking)
      if (session) {
        try {
          await models.Session.collection.updateOne(
            { _id: session._id },
            { 
              $set: { 
                lastActivity: new Date(),
                lastIP: clientIP,
                lastUserAgent: userAgent 
              } 
            }
          );
        } catch (updateError) {
          // Don't fail authentication if activity update fails
          console.warn('Failed to update session activity:', updateError);
        }
      }

      // Attach user and token info to request
      req.user = user;
      req.tokenInfo = {
        userId,
        sessionId,
        token: accessToken,
        payload: tokenVerification.payload,
        session: session,
        issuedAt: new Date(iat * 1000),
        expiresAt: new Date(exp * 1000),
      };

      // Add security context
      req.securityContext = {
        clientIP,
        userAgent,
        authenticatedAt: new Date(),
        authenticationTime: Date.now() - startTime,
      };

      // Log successful authentication (in development/debug mode)
      if (process.env.NODE_ENV === 'development') {
        console.log(`Authentication successful: ${user.username} from ${clientIP} (${Date.now() - startTime}ms)`);
      }

      next();

    } catch (error) {
      console.error('Authentication middleware error:', error);

      // Log security event for unexpected errors
      console.error(`Authentication error for ${clientIP}: ${error.message}`);

      res.status(500).json({
        success: false,
        error: 'Authentication error',
        message: 'Failed to authenticate request',
      });
    }
  };
}

/**
 * Create optional authentication middleware (doesn't fail if no token)
 * Useful for endpoints that work for both authenticated and anonymous users
 * @param {Object} db - MongoDB database instance
 * @param {Object} options - Middleware options
 * @returns {Function} Express middleware function
 */
function createOptionalAuthMiddleware(db, options = {}) {
  const authMiddleware = createAuthMiddleware(db, options);

  return (req, res, next) => {
    const authHeader = req.get('Authorization');
    
    // If no authorization header, continue without authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      req.tokenInfo = null;
      req.securityContext = {
        clientIP: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        authenticatedAt: null,
        authenticationTime: 0,
      };
      return next();
    }

    // If authorization header exists, use normal auth middleware
    return authMiddleware(req, res, next);
  };
}

/**
 * Create role-based authorization middleware
 * @param {string|Array<string>} allowedRoles - Role(s) that can access the route
 * @returns {Function} Express middleware function
 */
function createRoleMiddleware(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    // Ensure user is authenticated first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'User must be authenticated to access this resource',
      });
    }

    // Check if user has required role
    const userRole = req.user.role || 'user'; // Default role
    if (!roles.includes(userRole)) {
      console.log(`Authorization failed: ${req.user.username} (${userRole}) attempted to access ${req.path} requiring ${roles.join(', ')}`);
      
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'User does not have permission to access this resource',
      });
    }

    next();
  };
}

/**
 * Create permission-based authorization middleware
 * @param {string|Array<string>} requiredPermissions - Permission(s) required to access the route
 * @returns {Function} Express middleware function
 */
function createPermissionMiddleware(requiredPermissions) {
  const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

  return (req, res, next) => {
    // Ensure user is authenticated first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'User must be authenticated to access this resource',
      });
    }

    // Check if user has required permissions
    const userPermissions = req.user.permissions || [];
    const hasPermission = permissions.every(permission => 
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      console.log(`Permission denied: ${req.user.username} attempted to access ${req.path} requiring ${permissions.join(', ')}`);
      
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'User does not have the required permissions to access this resource',
      });
    }

    next();
  };
}

module.exports = createAuthMiddleware;
module.exports.createOptionalAuthMiddleware = createOptionalAuthMiddleware;
module.exports.createRoleMiddleware = createRoleMiddleware;
module.exports.createPermissionMiddleware = createPermissionMiddleware;