/**
 * useAuth Hook
 * Custom hook for accessing authentication context and utilities
 */

import { useContext, useCallback, useEffect, useState } from 'react';
import AuthContext from '../context/AuthContext';
import { AUTH_STATES, ERROR_MESSAGES } from '../utils/constants';

/**
 * Custom hook to use authentication context
 * @returns {Object} Authentication context and utilities
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

/**
 * Hook for authentication state management
 * @returns {Object} Authentication state and utilities
 */
export const useAuthState = () => {
  const { user, isAuthenticated, isLoading, error } = useAuth();
  
  // Determine current authentication state
  const getAuthState = useCallback(() => {
    if (isLoading) return AUTH_STATES.LOADING;
    if (error) return AUTH_STATES.ERROR;
    if (isAuthenticated) return AUTH_STATES.AUTHENTICATED;
    return AUTH_STATES.UNAUTHENTICATED;
  }, [isLoading, error, isAuthenticated]);
  
  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    authState: getAuthState(),
  };
};

/**
 * Hook for login functionality
 * @returns {Object} Login function and state
 */
export const useLogin = () => {
  const { login, isLoading, error, clearError } = useAuth();
  const [loginState, setLoginState] = useState({
    isSubmitting: false,
    success: false,
    error: null,
  });
  
  const handleLogin = useCallback(async (credentials) => {
    setLoginState({ isSubmitting: true, success: false, error: null });
    clearError();
    
    try {
      const result = await login(credentials);
      
      if (result.success) {
        setLoginState({ isSubmitting: false, success: true, error: null });
        return { success: true };
      } else {
        const errorMessage = ERROR_MESSAGES[result.error] || result.error || 'Login failed';
        setLoginState({ isSubmitting: false, success: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setLoginState({ isSubmitting: false, success: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [login, clearError]);
  
  const resetLoginState = useCallback(() => {
    setLoginState({ isSubmitting: false, success: false, error: null });
  }, []);
  
  return {
    login: handleLogin,
    isSubmitting: loginState.isSubmitting || isLoading,
    success: loginState.success,
    error: loginState.error || error,
    resetState: resetLoginState,
  };
};

/**
 * Hook for registration functionality
 * @returns {Object} Registration function and state
 */
export const useRegister = () => {
  const { register, isLoading, error, clearError } = useAuth();
  const [registerState, setRegisterState] = useState({
    isSubmitting: false,
    success: false,
    error: null,
  });
  
  const handleRegister = useCallback(async (userData) => {
    setRegisterState({ isSubmitting: true, success: false, error: null });
    clearError();
    
    try {
      const result = await register(userData);
      
      if (result.success) {
        setRegisterState({ isSubmitting: false, success: true, error: null });
        return { success: true };
      } else {
        const errorMessage = ERROR_MESSAGES[result.error] || result.error || 'Registration failed';
        setRegisterState({ isSubmitting: false, success: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setRegisterState({ isSubmitting: false, success: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [register, clearError]);
  
  const resetRegisterState = useCallback(() => {
    setRegisterState({ isSubmitting: false, success: false, error: null });
  }, []);
  
  return {
    register: handleRegister,
    isSubmitting: registerState.isSubmitting || isLoading,
    success: registerState.success,
    error: registerState.error || error,
    resetState: resetRegisterState,
  };
};

/**
 * Hook for logout functionality
 * @returns {Object} Logout function and state
 */
export const useLogout = () => {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if there's an error
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout]);
  
  return {
    logout: handleLogout,
    isLoggingOut,
  };
};

/**
 * Hook for password reset functionality
 * @returns {Object} Password reset functions and state
 */
export const usePasswordReset = () => {
  const { requestPasswordReset, resetPassword, verifyResetToken, isLoading, error, clearError } = useAuth();
  const [resetState, setResetState] = useState({
    isSubmitting: false,
    success: false,
    error: null,
    step: 'request', // 'request', 'verify', 'reset', 'complete'
  });
  
  const handleRequestReset = useCallback(async (email) => {
    setResetState(prev => ({ ...prev, isSubmitting: true, error: null }));
    clearError();
    
    try {
      const result = await requestPasswordReset(email);
      
      if (result.success) {
        setResetState({
          isSubmitting: false,
          success: true,
          error: null,
          step: 'verify',
        });
        return { success: true, message: result.message };
      } else {
        const errorMessage = result.error || 'Password reset request failed';
        setResetState(prev => ({ ...prev, isSubmitting: false, error: errorMessage }));
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setResetState(prev => ({ ...prev, isSubmitting: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, [requestPasswordReset, clearError]);
  
  const handleResetPassword = useCallback(async (token, newPassword, confirmPassword) => {
    setResetState(prev => ({ ...prev, isSubmitting: true, error: null }));
    clearError();
    
    try {
      const result = await resetPassword(token, newPassword, confirmPassword);
      
      if (result.success) {
        setResetState({
          isSubmitting: false,
          success: true,
          error: null,
          step: 'complete',
        });
        return { success: true, message: result.message };
      } else {
        const errorMessage = result.error || 'Password reset failed';
        setResetState(prev => ({ ...prev, isSubmitting: false, error: errorMessage }));
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setResetState(prev => ({ ...prev, isSubmitting: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, [resetPassword, clearError]);
  
  const handleVerifyToken = useCallback(async (token) => {
    try {
      const result = await verifyResetToken(token);
      
      if (result.success) {
        setResetState(prev => ({ ...prev, step: 'reset' }));
        return { success: true, tokenInfo: result.tokenInfo };
      } else {
        setResetState(prev => ({ ...prev, error: result.error || 'Invalid reset token' }));
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err.message || 'Token verification failed';
      setResetState(prev => ({ ...prev, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, [verifyResetToken]);
  
  const resetPasswordResetState = useCallback(() => {
    setResetState({
      isSubmitting: false,
      success: false,
      error: null,
      step: 'request',
    });
  }, []);
  
  return {
    requestReset: handleRequestReset,
    resetPassword: handleResetPassword,
    verifyToken: handleVerifyToken,
    isSubmitting: resetState.isSubmitting || isLoading,
    success: resetState.success,
    error: resetState.error || error,
    step: resetState.step,
    resetState: resetPasswordResetState,
  };
};

/**
 * Hook for session management
 * @returns {Object} Session information and management functions
 */
export const useSession = () => {
  const { sessionInfo, refreshSessions, tokens } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefreshSessions = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      const result = await refreshSessions();
      return result;
    } catch (error) {
      console.error('Session refresh error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshSessions]);
  
  // Calculate token expiry information
  const tokenExpiry = tokens?.expiresAt ? new Date(tokens.expiresAt) : null;
  const timeUntilExpiry = tokenExpiry ? tokenExpiry.getTime() - Date.now() : null;
  const isTokenExpiringSoon = timeUntilExpiry ? timeUntilExpiry < 5 * 60 * 1000 : false; // 5 minutes
  
  return {
    sessionInfo,
    refreshSessions: handleRefreshSessions,
    isRefreshing,
    tokenExpiry,
    timeUntilExpiry,
    isTokenExpiringSoon,
  };
};

/**
 * Hook for authentication persistence
 * @returns {Object} Persistence utilities
 */
export const useAuthPersistence = () => {
  const { tokens } = useAuth();
  
  // Check if user has persistent session
  const hasPersistentSession = Boolean(tokens && localStorage.getItem('auth_tokens'));
  
  // Clear persistent session
  const clearPersistentSession = useCallback(() => {
    localStorage.removeItem('auth_tokens');
    localStorage.removeItem('csrf_token');
  }, []);
  
  return {
    hasPersistentSession,
    clearPersistentSession,
  };
};

export default useAuth;