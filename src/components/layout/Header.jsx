import React from 'react';
import { Link } from 'react-router-dom';
import { IconSun, IconMoon, IconUser, IconLogout, IconSettings } from '@tabler/icons-react';
import { useAuth, useLogout } from '../../auth';
import { getVersionString } from '../../utils/version';

const Header = ({ theme, toggleTheme }) => {
  const { user, isAuthenticated } = useAuth();
  const { logout, isLoggingOut } = useLogout();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="navbar navbar-expand-md navbar-light d-print-none">
      <div className="container-xl">
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbar-menu"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <h1 className="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0 pe-md-3">
          <Link to="/">PESKAS | Cabo Delgado 🇲🇿</Link>
        </h1>

        {/* Right side navbar items */}
        <div className="navbar-nav flex-row order-md-last">
          <div className="nav-item d-none d-md-flex me-3">
            <div className="btn-list">
              <div className="text-muted">
                <small>Management Dashboard</small>
                <br />
                <small>
                  Mozambique - Cabo Delgado ({getVersionString()})
                </small>              
                </div>
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="nav-item">
            <button
              className="nav-link px-0"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Enable dark mode' : 'Enable light mode'}
            >
              {theme === 'light' ? (
                <IconMoon size={24} stroke={1.5} />
              ) : (
                <IconSun size={24} stroke={1.5} />
              )}
            </button>
          </div>

          {/* User Menu */}
          {isAuthenticated && user && (
            <div className="nav-item dropdown">
              <a
                href="#"
                className="nav-link d-flex lh-1 text-reset p-0"
                data-bs-toggle="dropdown"
                aria-label="Open user menu"
              >
                <span className="avatar avatar-sm" style={{ backgroundImage: `url(https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || user.email)}&background=206bc4&color=fff)` }}></span>
                <div className="d-none d-xl-block ps-2">
                  <div>{user.profile?.firstName || user.username}</div>
                  <div className="mt-1 small text-muted">{user.email}</div>
                </div>
              </a>
              <div className="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
                <div className="dropdown-header">
                  <span className="text-muted">Signed in as</span>
                  <br />
                  <strong>{user.username}</strong>
                </div>
                <div className="dropdown-divider"></div>
                <a href="#" className="dropdown-item">
                  <IconUser className="dropdown-item-icon" size={16} />
                  Profile
                </a>
                <a href="#" className="dropdown-item">
                  <IconSettings className="dropdown-item-icon" size={16} />
                  Settings
                </a>
                <div className="dropdown-divider"></div>
                <button
                  className="dropdown-item"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <IconLogout className="dropdown-item-icon" size={16} />
                  {isLoggingOut ? 'Signing out...' : 'Sign out'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
