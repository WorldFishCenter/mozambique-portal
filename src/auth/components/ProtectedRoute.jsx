/**
 * Protected Route Component
 * Wrapper component that requires authentication to access routes
 */

import { useLocation, Navigate } from 'react-router-dom';
import { useAuthState } from '../hooks/useAuth';
import { ROUTES, AUTH_STATES } from '../utils/constants';

const ProtectedRoute = ({ children, requireAuth = true, redirectTo = ROUTES.LOGIN }) => {
  const location = useLocation();
  const { authState, isAuthenticated, isLoading } = useAuthState();

  // Show loading spinner while checking authentication
  if (isLoading || authState === AUTH_STATES.LOADING) {
    return (
      <div className="page page-center">
        <div className="container container-tight py-4">
          <div className="text-center">
            <div className="spinner-border text-primary mb-4" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <h2 className="h2 text-center mb-4">Loading...</h2>
            <p className="text-muted">
              Please wait while we verify your authentication.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Redirect to login with the current location as the return path
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // If authentication is not required but user is authenticated
  // (useful for login/register pages)
  if (!requireAuth && isAuthenticated) {
    // Redirect to dashboard or the intended destination
    const from = location.state?.from?.pathname || ROUTES.DASHBOARD;
    return <Navigate to={from} replace />;
  }

  // Render the protected content
  return children;
};

export default ProtectedRoute;