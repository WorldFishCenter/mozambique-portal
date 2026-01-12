/**
 * Forgot Password Form Component
 * Tabler-styled forgot password form for requesting password reset
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePasswordReset } from '../hooks/useAuth';
import { validateEmail, sanitizeInput } from '../utils/validation';
import { ROUTES } from '../utils/constants';

const ForgotPasswordForm = ({ onSuccess }) => {
  const { requestReset, isSubmitting, error, success, step, resetState } = usePasswordReset();
  
  const [formData, setFormData] = useState({
    email: '',
  });
  
  const [validationErrors, setValidationErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Reset form state when component mounts
  useEffect(() => {
    resetState();
  }, [resetState]);

  // Handle success callback
  useEffect(() => {
    if (success && step === 'verify' && onSuccess) {
      onSuccess();
    }
  }, [success, step, onSuccess]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
    
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
    if (fieldName === 'email') {
      const validation = validateEmail(formData.email);
      if (!validation.isValid) {
        setValidationErrors(prev => ({
          ...prev,
          email: validation.errors,
        }));
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate email
    const emailValidation = validateEmail(formData.email);
    
    if (!emailValidation.isValid) {
      setValidationErrors({ email: emailValidation.errors });
      setTouched({ email: true });
      return;
    }

    // Request password reset
    const result = await requestReset(formData.email);
    
    if (!result.success) {
      // Error is handled by the hook and displayed via the error prop
      console.error('Password reset request failed:', result.error);
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

  // Handle retry
  const handleRetry = () => {
    resetState();
    setFormData({ email: '' });
    setValidationErrors({});
    setTouched({});
  };

  // Show success state
  if (success && step === 'verify') {
    return (
      <div className="card card-md">
        <div className="card-body text-center py-4 p-sm-5">
          <svg xmlns="http://www.w3.org/2000/svg" className="icon mb-4 text-green icon-lg" width="48" height="48" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z"/>
            <path d="M3 7l9 6l9 -6"/>
          </svg>
          <h2 className="h2 text-center mb-4">Check your email</h2>
          <p className="text-muted">
            We've sent a password reset link to <strong>{formData.email}</strong>
          </p>
          <p className="text-muted">
            If you don't see the email in your inbox, please check your spam folder.
          </p>
          <div className="mt-4">
            <button
              type="button"
              className="btn btn-outline-primary me-2"
              onClick={handleRetry}
            >
              Try another email
            </button>
            <Link to={ROUTES.LOGIN} className="btn btn-primary">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card card-md">
      <div className="card-body">
        <h2 className="h2 text-center mb-4">Forgot your password?</h2>
        <p className="text-muted mb-4">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        <form onSubmit={handleSubmit} noValidate>
          {/* Email Field */}
          <div className="mb-3">
            <label className="form-label">Email address</label>
            <div className="input-icon">
              <span className="input-icon-addon">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <rect x="3" y="5" width="18" height="14" rx="2"/>
                  <polyline points="3,7 12,13 21,7"/>
                </svg>
              </span>
              <input
                type="email"
                className={`form-control ${hasFieldError('email') ? 'is-invalid' : ''}`}
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                placeholder="Enter your email"
                disabled={isSubmitting}
                autoComplete="email"
                required
                autoFocus
              />
            </div>
            {hasFieldError('email') && (
              <div className="invalid-feedback d-block">
                {getFieldError('email')}
              </div>
            )}
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
                  <h4 className="alert-title">Request failed!</h4>
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
                  Sending reset link...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z"/>
                    <path d="M3 7l9 6l9 -6"/>
                  </svg>
                  Send reset link
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Back to Login Link */}
      <div className="hr-text">or</div>
      <div className="card-body">
        <div className="row">
          <div className="col">
            <Link to={ROUTES.LOGIN} className="btn w-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M9 11l-4 4l4 4m-4 -4h11a4 4 0 0 0 0 -8h-1"/>
              </svg>
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;