/**
 * Registration Form Component
 * Tabler-styled registration form with validation and password strength indicator
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useRegister } from '../hooks/useAuth';
import { 
  validateRegistrationForm, 
  validatePassword, 
  sanitizeInput 
} from '../utils/validation';
import { ROUTES } from '../utils/constants';

const RegisterForm = ({ onSuccess, redirectTo = ROUTES.DASHBOARD }) => {
  const { register, isSubmitting, error, success, resetState } = useRegister();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, strength: 'none' });

  // Reset form state when component mounts or success changes
  useEffect(() => {
    if (success) {
      // Clear form on successful registration
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
      });
      setValidationErrors({});
      setTouched({});
      setPasswordStrength({ score: 0, strength: 'none' });
      
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

    // Update password strength for password field
    if (name === 'password') {
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
    const validation = validateRegistrationForm(formData);
    
    if (!validation.isValid && validation.errors[fieldName]) {
      setValidationErrors(prev => ({
        ...prev,
        [fieldName]: validation.errors[fieldName],
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Transform formData to match validation structure
    const validationData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      profile: {
        firstName: formData.firstName,
        lastName: formData.lastName,
      },
    };

    // Validate form
    const validation = validateRegistrationForm(validationData);

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      // Mark all fields as touched to show errors
      const allTouched = Object.keys(formData).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});
      setTouched(allTouched);
      return;
    }

    // Prepare registration data
    // Note: confirmPassword is only for client-side validation
    // Backend only needs username, email, password, and profile
    const userData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
    };

    // Only include profile if there are actual values
    const profile = {};
    if (formData.firstName) profile.firstName = formData.firstName;
    if (formData.lastName) profile.lastName = formData.lastName;

    // Only add profile to userData if it has properties
    if (Object.keys(profile).length > 0) {
      userData.profile = profile;
    }

    // Attempt registration
    console.log('Sending registration data:', userData);
    const result = await register(userData);

    if (!result.success) {
      // Error is handled by the hook and displayed via the error prop
      console.error('Registration failed:', result.error);
      if (result.details) {
        console.error('Validation details:', result.details);
      }
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

  return (
    <div className="card card-md">
      <div className="card-body">
        <h2 className="h2 text-center mb-4">Create new account</h2>
        
        <form onSubmit={handleSubmit} noValidate>
          {/* Name Fields Row */}
          <div className="row">
            <div className="col-6">
              <div className="mb-3">
                <label className="form-label">First name</label>
                <input
                  type="text"
                  className={`form-control ${hasFieldError('firstName') ? 'is-invalid' : ''}`}
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  placeholder="Enter your first name"
                  disabled={isSubmitting}
                  autoComplete="given-name"
                />
                {hasFieldError('firstName') && (
                  <div className="invalid-feedback">
                    {getFieldError('firstName')}
                  </div>
                )}
              </div>
            </div>
            <div className="col-6">
              <div className="mb-3">
                <label className="form-label">Last name</label>
                <input
                  type="text"
                  className={`form-control ${hasFieldError('lastName') ? 'is-invalid' : ''}`}
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  placeholder="Enter your last name"
                  disabled={isSubmitting}
                  autoComplete="family-name"
                />
                {hasFieldError('lastName') && (
                  <div className="invalid-feedback">
                    {getFieldError('lastName')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Username Field */}
          <div className="mb-3">
            <label className="form-label">Username</label>
            <div className="input-icon">
              <span className="input-icon-addon">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <circle cx="12" cy="7" r="4"/>
                  <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"/>
                </svg>
              </span>
              <input
                type="text"
                className={`form-control ${hasFieldError('username') ? 'is-invalid' : ''}`}
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                placeholder="Choose a username"
                disabled={isSubmitting}
                autoComplete="username"
                required
              />
            </div>
            {hasFieldError('username') && (
              <div className="invalid-feedback d-block">
                {getFieldError('username')}
              </div>
            )}
            <small className="form-hint">
              Your username must be 3-30 characters and can only contain letters, numbers, underscores, and hyphens.
            </small>
          </div>

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
              />
            </div>
            {hasFieldError('email') && (
              <div className="invalid-feedback d-block">
                {getFieldError('email')}
              </div>
            )}
          </div>

          {/* Password Field */}
          <div className="mb-3">
            <label className="form-label">Password</label>
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
                placeholder="Create a password"
                disabled={isSubmitting}
                autoComplete="new-password"
                required
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
            
            {/* Password Strength Indicator */}
            {formData.password && (
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
            <label className="form-label">Confirm password</label>
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
                placeholder="Confirm your password"
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
                  <h4 className="alert-title">Registration failed!</h4>
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
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Login Link */}
      <div className="hr-text">or</div>
      <div className="card-body">
        <div className="row">
          <div className="col">
            <Link to={ROUTES.LOGIN} className="btn w-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2"/>
                <path d="M20 12h-13l3 -3m0 6l-3 -3"/>
              </svg>
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;