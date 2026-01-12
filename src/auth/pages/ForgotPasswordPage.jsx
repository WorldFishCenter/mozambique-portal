/**
 * Forgot Password Page Component
 * Full page layout for password recovery request
 */

import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ForgotPasswordForm } from '../components';
import { ROUTES } from '../utils/constants';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Handle successful password reset request
  const handleSuccess = () => {
    // The form handles its own success state display
    // No navigation needed here
  };

  return (
    <div className="page page-center">
      <div className="container container-tight py-4">
        <div className="text-center mb-4">
          <Link to="/" className="navbar-brand navbar-brand-autodark">
            <img src="/logo.svg" width="110" height="32" alt="Mozambique Portal" className="navbar-brand-image" />
          </Link>
        </div>

        <ForgotPasswordForm onSuccess={handleSuccess} />

        <div className="text-center text-muted mt-3">
          Remember your password? <Link to={ROUTES.LOGIN} tabIndex="-1">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;