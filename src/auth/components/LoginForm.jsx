/**
 * Login Form Component
 * Tabler-styled login form with validation and error handling
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLogin } from '../hooks/useAuth';
import { validateLoginForm, sanitizeInput } from '../utils/validation';
import { ROUTES } from '../utils/constants';

const LoginForm = ({ onSuccess, redirectTo = ROUTES.DASHBOARD }) => {
  const { login, isSubmitting, error, success, resetState } = useLogin();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    loginMethod: 'username', // 'username' or 'email'
    rememberMe: false,
  });
  
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});

  // Reset form state when component mounts or success changes
  useEffect(() => {
    if (success) {
      // Clear form on successful login
      setFormData({
        username: '',
        email: '',
        password: '',
        loginMethod: 'username',
        rememberMe: false,
      });
      setValidationErrors({});
      setTouched({});
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(redirectTo);
      }
    }
  }, [success, onSuccess, redirectTo]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const sanitizedValue = type === 'checkbox' ? checked : sanitizeInput(value);
    
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue,
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  // Handle input blur for validation
  const handleInputBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));

    // Validate single field
    validateField(name);
  };

  // Validate single field
  const validateField = (fieldName) => {
    const dataToValidate = {
      [formData.loginMethod]: formData[formData.loginMethod],
      password: formData.password,
    };

    const validation = validateLoginForm(dataToValidate);
    
    if (!validation.isValid && validation.errors[fieldName]) {
      setValidationErrors(prev => ({
        ...prev,
        [fieldName]: validation.errors[fieldName],
      }));
    }
  };

  // Handle login method toggle
  const handleLoginMethodChange = (method) => {
    setFormData(prev => ({
      ...prev,
      loginMethod: method,
      username: method === 'username' ? prev.username : '',
      email: method === 'email' ? prev.email : '',
    }));
    setValidationErrors({});
    setTouched({});
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prepare data for validation
    const dataToValidate = {
      [formData.loginMethod]: formData[formData.loginMethod],
      password: formData.password,
    };

    // Validate form
    const validation = validateLoginForm(dataToValidate);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    // Prepare login credentials
    const credentials = {
      password: formData.password,
      rememberMe: formData.rememberMe,
    };

    if (formData.loginMethod === 'username') {
      credentials.username = formData.username;
    } else {
      credentials.email = formData.email;
    }

    // Attempt login
    const result = await login(credentials);
    
    if (!result.success) {
      // Error is handled by the hook and displayed via the error prop
      console.error('Login failed:', result.error);
    }
  };

  // Get field error
  const getFieldError = (fieldName) => {
    return validationErrors[fieldName] && touched[fieldName] ? validationErrors[fieldName][0] : null;
  };

  // Check if field has error
  const hasFieldError = (fieldName) => {
    return Boolean(getFieldError(fieldName));
  };

  return (
    <div className="card card-md">
      <div className="card-body">
        <h2 className="h2 text-center mb-4">Login to your account</h2>
        
        {/* Login Method Toggle */}
        <div className="mb-3">
          <div className="btn-group w-100" role="group">
            <input
              type="radio"
              className="btn-check"
              name="loginMethod"
              id="login-username"
              checked={formData.loginMethod === 'username'}
              onChange={() => handleLoginMethodChange('username')}
            />
            <label className="btn btn-outline-primary" htmlFor="login-username">
              Username
            </label>
            
            <input
              type="radio"
              className="btn-check"
              name="loginMethod"
              id="login-email"
              checked={formData.loginMethod === 'email'}
              onChange={() => handleLoginMethodChange('email')}
            />
            <label className="btn btn-outline-primary" htmlFor="login-email">
              Email
            </label>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Username/Email Field */}
          <div className="mb-3">
            <label className="form-label">
              {formData.loginMethod === 'username' ? 'Username' : 'Email address'}
            </label>
            <div className="input-icon">
              <span className="input-icon-addon">
                {formData.loginMethod === 'username' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <circle cx="12" cy="7" r="4"/>
                    <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <rect x="3" y="5" width="18" height="14" rx="2"/>
                    <polyline points="3,7 12,13 21,7"/>
                  </svg>
                )}
              </span>
              <input
                type={formData.loginMethod === 'username' ? 'text' : 'email'}
                className={`form-control ${hasFieldError(formData.loginMethod) ? 'is-invalid' : ''}`}
                name={formData.loginMethod}
                value={formData[formData.loginMethod]}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                placeholder={formData.loginMethod === 'username' ? 'Enter your username' : 'Enter your email'}
                disabled={isSubmitting}
                autoComplete={formData.loginMethod === 'username' ? 'username' : 'email'}
              />
            </div>
            {hasFieldError(formData.loginMethod) && (
              <div className="invalid-feedback d-block">
                {getFieldError(formData.loginMethod)}
              </div>
            )}
          </div>

          {/* Password Field */}
          <div className="mb-2">
            <label className="form-label">
              Password
              <span className="form-label-description">
                <Link to={ROUTES.FORGOT_PASSWORD} className="text-decoration-none">
                  I forgot password
                </Link>
              </span>
            </label>
            <div className="input-icon">
              <span className="input-icon-addon">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <rect x="5" y="11" width="14" height="10" rx="2"/>
                  <circle cx="12" cy="16" r="1"/>
                  <path d="M8 11v-4a4 4 0 0 1 8 0v4"/>
                </svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className={`form-control ${hasFieldError('password') ? 'is-invalid' : ''}`}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                placeholder="Enter your password"
                disabled={isSubmitting}
                autoComplete="current-password"
              />
              <span className="input-icon-addon cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <line x1="3" y1="3" x2="21" y2="21"/>
                    <path d="M10.584 10.587a2 2 0 0 0 2.828 2.83"/>
                    <path d="M9.363 5.365a9.466 9.466 0 0 1 2.637 -.365c4 0 7.333 2.333 10 7c-.778 1.361 -1.612 2.524 -2.503 3.488m-2.14 1.861c-1.631 1.1 -3.415 1.651 -5.357 1.651c-4 0 -7.333 -2.333 -10 -7c1.369 -2.395 2.913 -4.175 4.632 -5.341"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <circle cx="12" cy="12" r="2"/>
                    <path d="M22 12c-2.667 4.667 -6 7 -10 7s-7.333 -2.333 -10 -7c2.667 -4.667 6 -7 10 -7s7.333 2.333 10 7"/>
                  </svg>
                )}
              </span>
            </div>
            {hasFieldError('password') && (
              <div className="invalid-feedback d-block">
                {getFieldError('password')}
              </div>
            )}
          </div>

          {/* Remember Me */}
          <div className="mb-2">
            <label className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleInputChange}
                disabled={isSubmitting}
              />
              <span className="form-check-label">Remember me on this device</span>
            </label>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger" role="alert">
              <div className="d-flex">
                <div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon alert-icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <circle cx="12" cy="12" r="9"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <div>
                  <h4 className="alert-title">Login failed!</h4>
                  <div className="text-muted">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="form-footer">
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Register Link */}
      <div className="hr-text">or</div>
      <div className="card-body">
        <div className="row">
          <div className="col">
            <Link to={ROUTES.REGISTER} className="btn w-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <circle cx="12" cy="7" r="4"/>
                <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"/>
              </svg>
              Create new account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;