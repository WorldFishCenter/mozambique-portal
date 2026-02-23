import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconEye, IconEyeOff, IconAlertCircle } from '@tabler/icons-react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const validUsername = import.meta.env.VITE_APP_USERNAME;
    const validPassword = import.meta.env.VITE_APP_PASSWORD;

    if (username === validUsername && password === validPassword) {
      localStorage.setItem('isAuthenticated', 'true');
      onLogin();
      navigate('/');
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="page page-center">
      <div className="container container-tight py-4">
        <div className="text-center mb-4">
          <h2 className="navbar-brand-text fw-bolder fs-2">
            PESKAS | Cabo Delgado 🇲🇿
          </h2>
          <p className="text-muted mt-1">Management Dashboard</p>
        </div>

        <div className="card card-md">
          <div className="card-body">
            <h2 className="h2 text-center mb-4">Sign in to your account</h2>

            {error && (
              <div className="alert alert-danger" role="alert">
                <div className="d-flex">
                  <div>
                    <IconAlertCircle size={18} stroke={1.5} />
                  </div>
                  <div className="ms-2">
                    <div className="alert-title">Invalid credentials</div>
                    <div className="text-muted">
                      The username or password you entered is incorrect. Please try again.
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="mb-3">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError(false);
                  }}
                  autoFocus
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Password</label>
                <div className="input-group input-group-flat">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(false);
                    }}
                    required
                  />
                  <span className="input-group-text">
                    <button
                      type="button"
                      className="btn btn-ghost-secondary btn-sm p-0 border-0"
                      onClick={() => setShowPassword((v) => !v)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <IconEyeOff size={18} stroke={1.5} />
                      ) : (
                        <IconEye size={18} stroke={1.5} />
                      )}
                    </button>
                  </span>
                </div>
              </div>

              <div className="mb-2">
                <button type="submit" className="btn btn-primary w-100">
                  Sign in
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
