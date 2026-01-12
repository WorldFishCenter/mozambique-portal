/**
 * Login Page Component
 * Full page layout for user login
 */

import { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoginForm } from '../components';
import { ROUTES } from '../utils/constants';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Get redirect path from location state or default to dashboard
  const redirectTo = location.state?.from?.pathname || ROUTES.DASHBOARD;
  const message = location.state?.message;

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  // Handle successful login
  const handleLoginSuccess = (redirect) => {
    navigate(redirect || redirectTo, { replace: true });
  };

  return (
    <div className="page page-center">
      <div className="container container-tight py-4">
        <div className="text-center mb-4">
          <Link to="/" className="navbar-brand navbar-brand-autodark">
            <img src="/logo.svg" width="110" height="32" alt="Mozambique Portal" className="navbar-brand-image" />
          </Link>
        </div>

        {/* Success/Info Message */}
        {message && (
          <div className="alert alert-info mb-4" role="alert">
            <div className="d-flex">
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="icon alert-icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <circle cx="12" cy="12" r="9"/>
                  <line x1="12" y1="12" x2="12" y2="16"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              </div>
              <div>
                {message}
              </div>
            </div>
          </div>
        )}

        <LoginForm 
          onSuccess={handleLoginSuccess}
          redirectTo={redirectTo}
        />

        <div className="text-center text-muted mt-3">
          Don't have an account? <Link to={ROUTES.REGISTER} tabIndex="-1">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;