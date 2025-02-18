import React from 'react';
import { Link } from 'react-router-dom';
import { IconSun, IconMoon } from '@tabler/icons-react';

const Header = ({ theme, toggleTheme }) => {
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
          <Link to="/">Peskas | Mozambique 🇲🇿</Link>
        </h1>

        {/* Right side navbar items */}
        <div className="navbar-nav flex-row order-md-last">
          <div className="nav-item d-none d-md-flex me-3">
            <div className="btn-list">
              <div className="text-muted">
                <small>Management Dashboard</small>
                <br />
                <small>Mozambique (0.0.0.9000 - beta)</small>
              </div>
            </div>
          </div>
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
        </div>
      </div>
    </header>
  );
};

export default Header;
