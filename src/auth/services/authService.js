/**
 * Authentication Service
 * Handles all authentication-related API calls and token management
 */

import { apiClient } from './apiClient';

// Token storage keys
const TOKEN_STORAGE_KEY = 'auth_tokens';
const CSRF_TOKEN_KEY = 'csrf_token';

// Token refresh configuration
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds
const TOKEN_REFRESH_INTERVAL = 60 * 1000; // Check every minute

class AuthService {
  constructor() {
    this.refreshInterval = null;
    this.refreshPromise = null;
  }

  /**
   * Login user with credentials
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.username - Username or email
   * @param {string} credentials.email - Email (alternative to username)
   * @param {string} credentials.password - Password
   * @returns {Promise<Object>} Login result
   */
  async login(credentials) {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      
      if (response.data.success) {
        // Store tokens securely
        this.storeTokens(response.data.tokens);
        
        return {
          success: true,
          user: response.data.user,
          tokens: response.data.tokens,
          message: response.data.message,
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Login failed',
          details: response.data.details,
        };
      }
    } catch (error) {
      return this.handleApiError(error, 'Login failed');
    }
  }

  /**
   * Register new user
   * @param {Object} userData - Registration data
   * @param {string} userData.username - Username
   * @param {string} userData.email - Email address
   * @param {string} userData.password - Password
   * @param {Object} userData.profile - Optional profile data
   * @returns {Promise<Object>} Registration result
   */
  async register(userData) {
    try {
      console.log('AuthService: Registering user with data:', userData);
      const response = await apiClient.post('/auth/register', userData);

      if (response.data.success) {
        // Store tokens securely
        this.storeTokens(response.data.tokens);

        return {
          success: true,
          user: response.data.user,
          tokens: response.data.tokens,
          message: response.data.message,
        };
      } else {
        console.error('AuthService: Registration failed (non-success response):', response.data);
        return {
          success: false,
          error: response.data.error || 'Registration failed',
          details: response.data.details,
        };
      }
    } catch (error) {
      console.error('AuthService: Registration error caught:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      return this.handleApiError(error, 'Registration failed');
    }
  }

  /**
   * Logout user
   * @returns {Promise<Object>} Logout result
   */
  async logout() {
    try {
      // Get CSRF token for logout request
      const csrfToken = await this.getCSRFToken();
      
      const response = await apiClient.post('/auth/logout', {}, {
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      });
      
      // Clear stored tokens regardless of API response
      this.clearStoredTokens();
      this.clearRefreshInterval();
      
      return {
        success: true,
        message: response.data?.message || 'Logged out successfully',
      };
    } catch (error) {
      // Clear tokens even if logout API fails
      this.clearStoredTokens();
      this.clearRefreshInterval();
      
      return {
        success: false,
        error: error.message || 'Logout failed',
      };
    }
  }

  /**
   * Verify current token
   * @returns {Promise<Object>} Verification result
   */
  async verifyToken() {
    try {
      const response = await apiClient.get('/auth/verify-token');
      
      if (response.data.success) {
        return {
          success: true,
          user: response.data.user,
          tokenInfo: response.data.tokenInfo,
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Token verification failed',
        };
      }
    } catch (error) {
      return this.handleApiError(error, 'Token verification failed');
    }
  }

  /**
   * Refresh access token
   * @returns {Promise<Object>} Refresh result
   */
  async refreshToken() {
    try {
      // Prevent multiple simultaneous refresh requests
      if (this.refreshPromise) {
        return await this.refreshPromise;
      }

      const tokens = this.getStoredTokens();
      if (!tokens || !tokens.refreshToken) {
        throw new Error('No refresh token available');
      }

      this.refreshPromise = apiClient.post('/auth/refresh', {
        refreshToken: tokens.refreshToken,
      });

      const response = await this.refreshPromise;
      this.refreshPromise = null;
      
      if (response.data.success) {
        // Update stored tokens
        this.storeTokens(response.data.tokens);
        
        return {
          success: true,
          tokens: response.data.tokens,
        };
      } else {
        throw new Error(response.data.error || 'Token refresh failed');
      }
    } catch (error) {
      this.refreshPromise = null;
      
      // If refresh fails, clear tokens and force re-login
      this.clearStoredTokens();
      
      return {
        success: false,
        error: error.message || 'Token refresh failed',
      };
    }
  }

  /**
   * Request password reset
   * @param {string} email - Email address
   * @returns {Promise<Object>} Request result
   */
  async requestPasswordReset(email) {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      
      return {
        success: response.data.success,
        message: response.data.message,
        error: response.data.error,
      };
    } catch (error) {
      return this.handleApiError(error, 'Password reset request failed');
    }
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @param {string} confirmPassword - Password confirmation
   * @returns {Promise<Object>} Reset result
   */
  async resetPassword(token, newPassword, confirmPassword) {
    try {
      const response = await apiClient.post('/auth/reset-password', {
        token,
        newPassword,
        confirmPassword,
      });
      
      return {
        success: response.data.success,
        message: response.data.message,
        error: response.data.error,
      };
    } catch (error) {
      return this.handleApiError(error, 'Password reset failed');
    }
  }

  /**
   * Verify reset token
   * @param {string} token - Reset token
   * @returns {Promise<Object>} Verification result
   */
  async verifyResetToken(token) {
    try {
      const response = await apiClient.get(`/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
      
      return {
        success: response.data.success,
        tokenInfo: response.data.tokenInfo,
        error: response.data.error,
      };
    } catch (error) {
      return this.handleApiError(error, 'Token verification failed');
    }
  }

  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile
   */
  async getCurrentUser() {
    try {
      const response = await apiClient.get('/auth/me');
      
      if (response.data.success) {
        return {
          success: true,
          user: response.data.user,
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Failed to get user profile',
        };
      }
    } catch (error) {
      return this.handleApiError(error, 'Failed to get user profile');
    }
  }

  /**
   * Get user session information
   * @returns {Promise<Object>} Session information
   */
  async getSessionInfo() {
    try {
      const response = await apiClient.get('/auth/sessions');
      
      if (response.data.success) {
        return {
          success: true,
          data: {
            sessions: response.data.sessions,
            totalSessions: response.data.totalSessions,
          },
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Failed to get session info',
        };
      }
    } catch (error) {
      return this.handleApiError(error, 'Failed to get session info');
    }
  }

  /**
   * Get CSRF token
   * @returns {Promise<string>} CSRF token
   */
  async getCSRFToken() {
    try {
      // Check if we have a cached token
      const cachedToken = localStorage.getItem(CSRF_TOKEN_KEY);
      if (cachedToken) {
        return cachedToken;
      }

      // Request new CSRF token
      const response = await apiClient.get('/auth/csrf-token');
      
      if (response.data.success) {
        const token = response.data.csrfToken;
        localStorage.setItem(CSRF_TOKEN_KEY, token);
        return token;
      } else {
        throw new Error('Failed to get CSRF token');
      }
    } catch (error) {
      console.error('CSRF token error:', error);
      throw error;
    }
  }

  /**
   * Store authentication tokens securely
   * @param {Object} tokens - Token object
   */
  storeTokens(tokens) {
    try {
      const tokenData = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        tokenType: tokens.tokenType || 'Bearer',
        storedAt: Date.now(),
      };
      
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokenData));
      
      // Update API client with new token
      apiClient.setAuthToken(tokens.accessToken);
    } catch (error) {
      console.error('Token storage error:', error);
    }
  }

  /**
   * Get stored authentication tokens
   * @returns {Object|null} Stored tokens or null
   */
  getStoredTokens() {
    try {
      const tokenData = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!tokenData) {
        return null;
      }
      
      const tokens = JSON.parse(tokenData);
      
      // Check if tokens are expired
      if (tokens.expiresAt && new Date(tokens.expiresAt) <= new Date()) {
        this.clearStoredTokens();
        return null;
      }
      
      return tokens;
    } catch (error) {
      console.error('Token retrieval error:', error);
      this.clearStoredTokens();
      return null;
    }
  }

  /**
   * Clear stored authentication tokens
   */
  clearStoredTokens() {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(CSRF_TOKEN_KEY);
      apiClient.clearAuthToken();
    } catch (error) {
      console.error('Token clearing error:', error);
    }
  }

  /**
   * Check if token needs refresh
   * @returns {boolean} True if token should be refreshed
   */
  shouldRefreshToken() {
    const tokens = this.getStoredTokens();
    if (!tokens || !tokens.expiresAt) {
      return false;
    }
    
    const expiresAt = new Date(tokens.expiresAt);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    
    return timeUntilExpiry <= TOKEN_REFRESH_THRESHOLD;
  }

  /**
   * Setup automatic token refresh
   * @param {Function} onTokenRefresh - Callback when tokens are refreshed
   * @returns {number} Interval ID
   */
  setupTokenRefresh(onTokenRefresh) {
    // Clear existing interval
    this.clearRefreshInterval();
    
    this.refreshInterval = setInterval(async () => {
      if (this.shouldRefreshToken()) {
        try {
          const result = await this.refreshToken();
          if (result.success && onTokenRefresh) {
            onTokenRefresh(result.tokens);
          }
        } catch (error) {
          console.error('Automatic token refresh failed:', error);
        }
      }
    }, TOKEN_REFRESH_INTERVAL);
    
    return this.refreshInterval;
  }

  /**
   * Clear token refresh interval
   */
  clearRefreshInterval() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Handle API errors consistently
   * @param {Error} error - API error
   * @param {string} defaultMessage - Default error message
   * @returns {Object} Error response
   */
  handleApiError(error, defaultMessage) {
    let errorMessage = defaultMessage;
    let details = null;
    
    if (error.response) {
      // Server responded with error status
      const data = error.response.data;
      errorMessage = data.error || data.message || defaultMessage;
      details = data.details;
    } else if (error.request) {
      // Network error
      errorMessage = 'Network error. Please check your connection.';
    } else {
      // Other error
      errorMessage = error.message || defaultMessage;
    }
    
    return {
      success: false,
      error: errorMessage,
      details,
    };
  }

  /**
   * Initialize authentication service
   * Sets up stored tokens in API client if available
   */
  initialize() {
    const tokens = this.getStoredTokens();
    if (tokens && tokens.accessToken) {
      apiClient.setAuthToken(tokens.accessToken);
    }
  }
}

// Create and export singleton instance
export const authService = new AuthService();

// Initialize on module load
authService.initialize();

export default authService;