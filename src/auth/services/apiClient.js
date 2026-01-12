/**
 * API Client
 * Centralized HTTP client for authentication API calls
 */

import axios from 'axios';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_TIMEOUT = 10000; // 10 seconds

class ApiClient {
  constructor() {
    // Create axios instance
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add timestamp to prevent caching
        config.params = {
          ...config.params,
          _t: Date.now(),
        };

        // Log request in development
        if (import.meta.env.DEV) {
          console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
            data: config.data,
            params: config.params,
          });
        }

        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Log response in development
        if (import.meta.env.DEV) {
          console.log(`API Response: ${response.status} ${response.config.url}`, {
            data: response.data,
          });
        }

        // Check for token refresh suggestion
        if (response.headers['x-token-refresh-suggested']) {
          console.log('Token refresh suggested by server');
          // Could emit an event here for the auth service to handle
        }

        return response;
      },
      (error) => {
        // Log error in development
        if (import.meta.env.DEV) {
          console.error('API Error:', {
            status: error.response?.status,
            url: error.config?.url,
            data: error.response?.data,
            message: error.message,
          });
        }

        // Handle specific error cases
        if (error.response) {
          const { status, data } = error.response;
          
          // Handle authentication errors
          if (status === 401) {
            // Token expired or invalid
            this.clearAuthToken();
            
            // Emit authentication error event
            window.dispatchEvent(new CustomEvent('auth:token-expired', {
              detail: { error: data.error, message: data.message }
            }));
          }
          
          // Handle rate limiting
          if (status === 429) {
            console.warn('Rate limit exceeded:', data.message);
          }
          
          // Handle server errors
          if (status >= 500) {
            console.error('Server error:', data.error || 'Internal server error');
          }
        } else if (error.request) {
          // Network error
          console.error('Network error:', error.message);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Set authentication token for requests
   * @param {string} token - JWT access token
   */
  setAuthToken(token) {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      this.clearAuthToken();
    }
  }

  /**
   * Clear authentication token
   */
  clearAuthToken() {
    delete this.client.defaults.headers.common['Authorization'];
  }

  /**
   * GET request
   * @param {string} url - Request URL
   * @param {Object} config - Request configuration
   * @returns {Promise} Axios response promise
   */
  get(url, config = {}) {
    return this.client.get(url, config);
  }

  /**
   * POST request
   * @param {string} url - Request URL
   * @param {Object} data - Request data
   * @param {Object} config - Request configuration
   * @returns {Promise} Axios response promise
   */
  post(url, data = {}, config = {}) {
    return this.client.post(url, data, config);
  }

  /**
   * PUT request
   * @param {string} url - Request URL
   * @param {Object} data - Request data
   * @param {Object} config - Request configuration
   * @returns {Promise} Axios response promise
   */
  put(url, data = {}, config = {}) {
    return this.client.put(url, data, config);
  }

  /**
   * PATCH request
   * @param {string} url - Request URL
   * @param {Object} data - Request data
   * @param {Object} config - Request configuration
   * @returns {Promise} Axios response promise
   */
  patch(url, data = {}, config = {}) {
    return this.client.patch(url, data, config);
  }

  /**
   * DELETE request
   * @param {string} url - Request URL
   * @param {Object} config - Request configuration
   * @returns {Promise} Axios response promise
   */
  delete(url, config = {}) {
    return this.client.delete(url, config);
  }

  /**
   * Upload file
   * @param {string} url - Upload URL
   * @param {FormData} formData - Form data with file
   * @param {Object} config - Request configuration
   * @returns {Promise} Axios response promise
   */
  upload(url, formData, config = {}) {
    return this.client.post(url, formData, {
      ...config,
      headers: {
        ...config.headers,
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Download file
   * @param {string} url - Download URL
   * @param {Object} config - Request configuration
   * @returns {Promise} Axios response promise
   */
  download(url, config = {}) {
    return this.client.get(url, {
      ...config,
      responseType: 'blob',
    });
  }

  /**
   * Check API health
   * @returns {Promise} Health check response
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return {
        success: true,
        status: response.data.status,
        timestamp: response.data.timestamp,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get API base URL
   * @returns {string} Base URL
   */
  getBaseURL() {
    return this.client.defaults.baseURL;
  }

  /**
   * Update API configuration
   * @param {Object} config - New configuration
   */
  updateConfig(config) {
    Object.assign(this.client.defaults, config);
  }

  /**
   * Create request with custom configuration
   * @param {Object} config - Request configuration
   * @returns {Promise} Axios response promise
   */
  request(config) {
    return this.client.request(config);
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests() {
    // Note: This would require tracking request tokens
    // For now, just log the action
    console.log('Cancelling all pending requests');
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();

// Export class for testing
export { ApiClient };

export default apiClient;