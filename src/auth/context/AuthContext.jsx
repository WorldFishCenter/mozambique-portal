/**
 * Authentication Context
 * Provides authentication state and methods throughout the React application
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/authService';

// Initial authentication state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  tokens: null,
  sessionInfo: null,
};

// Authentication action types
export const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  TOKEN_REFRESH: 'TOKEN_REFRESH',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
  SET_SESSION_INFO: 'SET_SESSION_INFO',
};

// Authentication reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
        error: action.payload ? null : state.error, // Clear error when starting to load
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        isLoading: false,
      };

    case AUTH_ACTIONS.TOKEN_REFRESH:
      return {
        ...state,
        tokens: action.payload.tokens,
        error: null,
      };

    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    case AUTH_ACTIONS.SET_SESSION_INFO:
      return {
        ...state,
        sessionInfo: action.payload,
      };

    default:
      return state;
  }
};

// Create the authentication context
const AuthContext = createContext(null);

/**
 * Authentication Provider Component
 * Wraps the application and provides authentication state and methods
 */
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize authentication state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

        // Check if user has stored tokens
        const storedTokens = authService.getStoredTokens();
        if (!storedTokens) {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
          return;
        }

        // Verify the stored token is still valid
        const verificationResult = await authService.verifyToken();
        if (verificationResult.success) {
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              user: verificationResult.user,
              tokens: storedTokens,
            },
          });

          // Load additional session info
          const sessionInfo = await authService.getSessionInfo();
          if (sessionInfo.success) {
            dispatch({
              type: AUTH_ACTIONS.SET_SESSION_INFO,
              payload: sessionInfo.data,
            });
          }
        } else {
          // Token is invalid, clear stored data
          authService.clearStoredTokens();
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authService.clearStoredTokens();
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    if (!state.isAuthenticated || !state.tokens) {
      return;
    }

    const refreshInterval = authService.setupTokenRefresh((newTokens) => {
      dispatch({
        type: AUTH_ACTIONS.TOKEN_REFRESH,
        payload: { tokens: newTokens },
      });
    });

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [state.isAuthenticated, state.tokens]);

  /**
   * Login user with credentials
   */
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const result = await authService.login(credentials);
      
      if (result.success) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: result.user,
            tokens: result.tokens,
          },
        });

        // Load session info after successful login
        const sessionInfo = await authService.getSessionInfo();
        if (sessionInfo.success) {
          dispatch({
            type: AUTH_ACTIONS.SET_SESSION_INFO,
            payload: sessionInfo.data,
          });
        }

        return { success: true };
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: result.error || 'Login failed',
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'An unexpected error occurred';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Register new user
   */
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const result = await authService.register(userData);
      
      if (result.success) {
        dispatch({
          type: AUTH_ACTIONS.REGISTER_SUCCESS,
          payload: {
            user: result.user,
            tokens: result.tokens,
          },
        });

        // Load session info after successful registration
        const sessionInfo = await authService.getSessionInfo();
        if (sessionInfo.success) {
          dispatch({
            type: AUTH_ACTIONS.SET_SESSION_INFO,
            payload: sessionInfo.data,
          });
        }

        return { success: true };
      } else {
        dispatch({
          type: AUTH_ACTIONS.REGISTER_FAILURE,
          payload: result.error || 'Registration failed',
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'An unexpected error occurred';
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      // Call logout API to invalidate server-side session
      await authService.logout();
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with client-side logout even if API fails
    } finally {
      // Always clear client-side state
      authService.clearStoredTokens();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  /**
   * Request password reset
   */
  const requestPasswordReset = async (email) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const result = await authService.requestPasswordReset(email);
      
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      
      if (result.success) {
        return { success: true, message: result.message };
      } else {
        dispatch({
          type: AUTH_ACTIONS.SET_ERROR,
          payload: result.error || 'Password reset request failed',
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'An unexpected error occurred';
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Reset password with token
   */
  const resetPassword = async (token, newPassword, confirmPassword) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const result = await authService.resetPassword(token, newPassword, confirmPassword);
      
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      
      if (result.success) {
        return { success: true, message: result.message };
      } else {
        dispatch({
          type: AUTH_ACTIONS.SET_ERROR,
          payload: result.error || 'Password reset failed',
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'An unexpected error occurred';
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Verify reset token
   */
  const verifyResetToken = async (token) => {
    try {
      const result = await authService.verifyResetToken(token);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (profileData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      // Note: This would need to be implemented in the backend
      // For now, just update local state
      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: profileData,
      });

      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      return { success: true };
    } catch (error) {
      const errorMessage = error.message || 'Profile update failed';
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Refresh user sessions
   */
  const refreshSessions = async () => {
    try {
      const sessionInfo = await authService.getSessionInfo();
      if (sessionInfo.success) {
        dispatch({
          type: AUTH_ACTIONS.SET_SESSION_INFO,
          payload: sessionInfo.data,
        });
      }
      return sessionInfo;
    } catch (error) {
      console.error('Session refresh error:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Clear authentication error
   */
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Context value
  const value = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    tokens: state.tokens,
    sessionInfo: state.sessionInfo,

    // Actions
    login,
    register,
    logout,
    requestPasswordReset,
    resetPassword,
    verifyResetToken,
    updateProfile,
    refreshSessions,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use authentication context
 * Must be used within AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;