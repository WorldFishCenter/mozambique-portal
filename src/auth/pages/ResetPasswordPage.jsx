/**
 * Reset Password Page Component
 * Full page layout for password reset with token
 */

import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ResetPasswordForm } from '../components';
import { ROUTES } from '../utils/constants';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Handle successful password reset
  const handleSuccess = () => {
    // The form handles navigation to login page
    // No additional action needed here
  };

  return (
    <div className="page page-center">
      <div className="container container-tight py-4">
        <div className="text-center mb-4">
          <Link to="/" className="navbar-brand navbar-brand-autodark">
            <img src="/logo.svg" width="110" height="32" alt="Mozambique Portal" className="navbar-brand-image" />
          </Link>
        </div>

        <ResetPasswordForm onSuccess={handleSuccess} />

        <div className="text-center text-muted mt-3">
          Remember your password? <Link to={ROUTES.LOGIN} tabIndex="-1">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;