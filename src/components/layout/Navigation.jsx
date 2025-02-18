import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  IconHome,
  IconScale,
  IconCurrencyDollar,
  IconInfoSquare,
  IconMap2,
  IconRuler,
} from '@tabler/icons-react';
import { LANDING_SITES } from '../../constants/landingSites';

const CURRENCY_SYMBOLS = {
  MT: 'MT',
  USD: 'USD',
  EUR: '€',
};

const Navigation = ({ selectedLandingSite, setSelectedLandingSite, currency, setCurrency }) => {
  const location = useLocation();

  // Format landing site name for display
  const formatLandingSiteName = site => {
    return site === 'all'
      ? 'All Landing Sites'
      : site.charAt(0).toUpperCase() + site.slice(1).replace('_', ' ');
  };

  // Check if current page needs landing site selector
  const shouldShowLandingSiteSelector = ['/catch', '/revenue'].includes(location.pathname);
  // Check if current page is revenue page
  const isRevenuePage = location.pathname === '/revenue';

  return (
    <header className="navbar-expand-md">
      <div className="collapse navbar-collapse" id="navbar-menu">
        <div className="navbar">
          <div className="container-xl">
            <ul className="navbar-nav">
              <li className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
                <Link to="/" className="nav-link">
                  <span className="nav-link-icon d-md-none d-lg-inline-block">
                    <IconHome size={24} stroke={1.5} />
                  </span>
                  <span className="nav-link-title">Home</span>
                </Link>
              </li>
              <li className={`nav-item ${location.pathname === '/catch' ? 'active' : ''}`}>
                <Link to="/catch" className="nav-link">
                  <span className="nav-link-icon d-md-none d-lg-inline-block">
                    <IconScale size={24} stroke={1.5} />
                  </span>
                  <span className="nav-link-title">Catch</span>
                </Link>
              </li>
              <li className={`nav-item ${location.pathname === '/revenue' ? 'active' : ''}`}>
                <Link to="/revenue" className="nav-link">
                  <span className="nav-link-icon d-md-none d-lg-inline-block">
                    <IconCurrencyDollar size={24} stroke={1.5} />
                  </span>
                  <span className="nav-link-title">Revenue</span>
                </Link>
              </li>
              <li className={`nav-item ${location.pathname === '/taxa-length' ? 'active' : ''}`}>
                <Link to="/taxa-length" className="nav-link">
                  <span className="nav-link-icon d-md-none d-lg-inline-block">
                    <IconRuler size={24} stroke={1.5} />
                  </span>
                  <span className="nav-link-title">Taxa Length</span>
                </Link>
              </li>
              <li className={`nav-item ${location.pathname === '/about' ? 'active' : ''}`}>
                <Link to="/about" className="nav-link">
                  <span className="nav-link-icon d-md-none d-lg-inline-block">
                    <IconInfoSquare size={24} stroke={1.5} />
                  </span>
                  <span className="nav-link-title">About</span>
                </Link>
              </li>
            </ul>
            <div className="navbar-nav ms-auto d-flex align-items-center gap-2">
              {isRevenuePage && (
                <div className="nav-item">
                  <div className="btn-group" role="group">
                    {Object.keys(CURRENCY_SYMBOLS).map(curr => (
                      <button
                        key={curr}
                        type="button"
                        className={`btn ${currency === curr ? 'btn-secondary' : 'btn-outline-secondary'}`}
                        onClick={() => setCurrency(curr)}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {shouldShowLandingSiteSelector && (
                <div className="nav-item dropdown">
                  <button
                    type="button"
                    className="btn btn-primary dropdown-toggle"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <IconMap2 className="icon me-2" stroke={1.5} />
                    <span className="nav-link-title">
                      {formatLandingSiteName(selectedLandingSite)}
                    </span>
                  </button>
                  <div className="dropdown-menu dropdown-menu-end">
                    <div className="dropdown-header">Select Landing Site</div>
                    <button
                      type="button"
                      className={`dropdown-item ${selectedLandingSite === 'all' ? 'active fw-bold' : ''}`}
                      onClick={() => setSelectedLandingSite('all')}
                    >
                      All Landing Sites
                    </button>
                    <div className="dropdown-divider"></div>
                    <div
                      className="dropdown-menu-scrollable"
                      style={{ maxHeight: '400px', overflowY: 'auto' }}
                    >
                      {LANDING_SITES.map(site => (
                        <button
                          key={site}
                          type="button"
                          className={`dropdown-item ${selectedLandingSite === site ? 'active fw-bold' : ''}`}
                          onClick={() => setSelectedLandingSite(site)}
                        >
                          {formatLandingSiteName(site)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
