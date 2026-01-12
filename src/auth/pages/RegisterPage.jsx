/**
 * Register Page Component
 * Full page layout for user registration
 */

import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { RegisterForm } from '../components';
import { ROUTES } from '../utils/constants';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Handle successful registration
  const handleRegisterSuccess = (redirect) => {
    navigate(redirect || ROUTES.DASHBOARD, { replace: true });
  };

  return (
    <div className="page page-center">
      <div className="container container-tight py-4">
        <div className="text-center mb-4">
          <Link to="/" className="navbar-brand navbar-brand-autodark">
            <img src="/logo.svg" width="110" height="32" alt="Mozambique Portal" className="navbar-brand-image" />
          </Link>
        </div>

        <RegisterForm 
          onSuccess={handleRegisterSuccess}
          redirectTo={ROUTES.DASHBOARD}
        />

        <div className="text-center text-muted mt-3">
          Already have an account? <Link to={ROUTES.LOGIN} tabIndex="-1">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;