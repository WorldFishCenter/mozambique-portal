/**
 * Reset Password Form Component
 * Tabler-styled password reset form for setting new password with token
 */

import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { usePasswordReset } from '../hooks/useAuth';
import { validatePassword, sanitizeInput } from '../utils/validation';
import { ROUTES } from '../utils/constants';

const ResetPasswordForm = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const { resetPassword, verifyToken, isSubmitting, error, success, step, resetState } = usePasswordReset();
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, strength: 'none' });
  const [tokenValid, setTokenValid] = useState(null);
  const [isVerifying, setIsVerifying] = useState(true);

  // Verify token on component mount
  useEffect(() => {
    const verifyResetToken = async () => {
      if (!token) {
        setTokenValid(false);
        setIsVerifying(false);
        return;
      }

      try {
        const result = await verifyToken(token);
        setTokenValid(result.success);
      } catch (error) {
        setTokenValid(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyResetToken();
  }, [token, verifyToken]);

  // Handle success callback
  useEffect(() => {
    if (success && step === 'complete' && onSuccess) {
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

    // Update password strength for password field
    if (name === 'newPassword') {
      const strength = validatePassword(sanitizedValue);
      setPasswordStrength(strength);
    }

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
    const errors = {};

    if (fieldName === 'newPassword') {
      const validation = validatePassword(formData.newPassword);
      if (!validation.isValid) {
        errors.newPassword = validation.errors;
      }
    }

    if (fieldName === 'confirmPassword') {
      if (!formData.confirmPassword) {
        errors.confirmPassword = ['Please confirm your password'];
      } else if (formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = ['Passwords do not match'];
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(prev => ({
        ...prev,
        ...errors,
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    const passwordValidation = validatePassword(formData.newPassword);
    const errors = {};

    if (!passwordValidation.isValid) {
      errors.newPassword = passwordValidation.errors;
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = ['Please confirm your password'];
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = ['Passwords do not match'];
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setTouched({ newPassword: true, confirmPassword: true });
      return;
    }

    // Reset password
    const result = await resetPassword(token, formData.newPassword, formData.confirmPassword);
    
    if (result.success) {
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate(ROUTES.LOGIN, { 
          state: { message: 'Password reset successfully. Please log in with your new password.' }
        });
      }, 2000);
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

  // Get password strength color and text
  const getPasswordStrengthInfo = () => {
    switch (passwordStrength.strength) {
      case 'weak':
        return { color: 'danger', text: 'Weak', width: '25%' };
      case 'medium':
        return { color: 'warning', text: 'Medium', width: '50%' };
      case 'strong':
        return { color: 'success', text: 'Strong', width: '100%' };
      default:
        return { color: 'secondary', text: '', width: '0%' };
    }
  };

  const strengthInfo = getPasswordStrengthInfo();

  // Show loading while verifying token
  if (isVerifying) {
    return (
      <div className="card card-md">
        <div className="card-body text-center py-4 p-sm-5">
          <div className="spinner-border text-primary mb-4" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h2 className="h2 text-center mb-4">Verifying reset token...</h2>
          <p className="text-muted">
            Please wait while we verify your password reset request.
          </p>
        </div>
      </div>
    );
  }

  // Show error if token is invalid
  if (tokenValid === false) {
    return (
      <div className="card card-md">
        <div className="card-body text-center py-4 p-sm-5">
          <svg xmlns="http://www.w3.org/2000/svg" className="icon mb-4 text-danger icon-lg" width="48" height="48" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <circle cx="12" cy="12" r="9"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h2 className="h2 text-center mb-4">Invalid Reset Link</h2>
          <p className="text-muted mb-4">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <div className="mt-4">
            <Link to={ROUTES.FORGOT_PASSWORD} className="btn btn-primary me-2">
              Request New Reset Link
            </Link>
            <Link to={ROUTES.LOGIN} className="btn btn-outline-primary">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show success state
  if (success && step === 'complete') {
    return (
      <div className="card card-md">
        <div className="card-body text-center py-4 p-sm-5">
          <svg xmlns="http://www.w3.org/2000/svg" className="icon mb-4 text-green icon-lg" width="48" height="48" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <circle cx="12" cy="12" r="9"/>
            <path d="M9 12l2 2l4 -4"/>
          </svg>
          <h2 className="h2 text-center mb-4">Password Reset Successfully</h2>
          <p className="text-muted mb-4">
            Your password has been reset successfully. You can now log in with your new password.
          </p>
          <p className="text-muted">
            Redirecting to login page...
          </p>
          <div className="mt-4">
            <Link to={ROUTES.LOGIN} className="btn btn-primary">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card card-md">
      <div className="card-body">
        <h2 className="h2 text-center mb-4">Reset your password</h2>
        <p className="text-muted mb-4">
          Enter your new password below. Make sure it's strong and secure.
        </p>
        
        <form onSubmit={handleSubmit} noValidate>
          {/* New Password Field */}
          <div className="mb-3">
            <label className="form-label">New password</label>
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
                className={`form-control ${hasFieldError('newPassword') ? 'is-invalid' : ''}`}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                placeholder="Enter your new password"
                disabled={isSubmitting}
                autoComplete="new-password"
                required
                autoFocus
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
            {hasFieldError('newPassword') && (
              <div className="invalid-feedback d-block">
                {getFieldError('newPassword')}
              </div>
            )}
            
            {/* Password Strength Indicator */}
            {formData.newPassword && (
              <div className="mt-2">
                <div className="progress progress-sm">
                  <div 
                    className={`progress-bar bg-${strengthInfo.color}`} 
                    style={{ width: strengthInfo.width }}
                    role="progressbar"
                  ></div>
                </div>
                <small className={`form-hint text-${strengthInfo.color}`}>
                  Password strength: {strengthInfo.text}
                </small>
              </div>
            )}
            <small className="form-hint">
              Your password must be at least 8 characters and contain uppercase, lowercase, and numbers.
            </small>
          </div>

          {/* Confirm Password Field */}
          <div className="mb-3">
            <label className="form-label">Confirm new password</label>
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
                type={showConfirmPassword ? 'text' : 'password'}
                className={`form-control ${hasFieldError('confirmPassword') ? 'is-invalid' : ''}`}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                placeholder="Confirm your new password"
                disabled={isSubmitting}
                autoComplete="new-password"
                required
              />
              <span className="input-icon-addon cursor-pointer" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? (
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
            {hasFieldError('confirmPassword') && (
              <div className="invalid-feedback d-block">
                {getFieldError('confirmPassword')}
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
                  <h4 className="alert-title">Password reset failed!</h4>
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
                  Resetting password...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <circle cx="12" cy="12" r="9"/>
                    <path d="M9 12l2 2l4 -4"/>
                  </svg>
                  Reset password
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

export default ResetPasswordForm;