import React from 'react';
import Header from './Header';
import Navigation from './Navigation';
import Footer from './Footer';

const Layout = ({
  children,
  theme,
  toggleTheme,
  selectedLandingSite,
  setSelectedLandingSite,
  currency,
  setCurrency,
  onLogout,
}) => {
  return (
    <div className="page">
      <div className="sticky-top">
        <Header theme={theme} toggleTheme={toggleTheme} onLogout={onLogout} />
        <Navigation
          selectedLandingSite={selectedLandingSite}
          setSelectedLandingSite={setSelectedLandingSite}
          currency={currency}
          setCurrency={setCurrency}
        />
      </div>

      <div className="page-wrapper">
        <div className="page-body">
          <div className="container-xl">
            {/* Beta Alert using official Tabler Alert component structure */}
            {/* <div className="alert alert-warning alert-dismissible" role="alert">
              <div className="alert-icon">
                <i className="ti ti-info-circle"></i>
              </div>
              <div className="alert-title mb-1">Beta Version</div>
              <div className="alert-description text-muted">
                This application is currently in beta testing phase.
              </div>
            </div> */}

            {children}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default Layout;
