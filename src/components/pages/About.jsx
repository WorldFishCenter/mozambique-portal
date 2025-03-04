import React from 'react';
import { IconBuildingLighthouse, IconScale, IconCode, IconClock } from '@tabler/icons-react';

const About = () => {
  return (
    <>
      {/* About Section */}
      <div className="card">
        <div className="card-body">
          <h2 className="mb-3">About Peskas</h2>
          <p className="text-muted mb-4">
            A data-driven platform for sustainable fisheries management in Mozambique.
          </p>

          {/* Features */}
          <div className="row g-3">
            {[
              {
                icon: IconBuildingLighthouse,
                title: 'Low Cost',
                description: 'Accessible implementation',
                color: 'primary',
              },
              {
                icon: IconCode,
                title: 'Open Source',
                description: 'Transparent development',
                color: 'green',
              },
              {
                icon: IconScale,
                title: 'Open Access',
                description: 'Available to all stakeholders',
                color: 'yellow',
              },
              {
                icon: IconClock,
                title: 'Near Real-Time',
                description: 'Current data insights',
                color: 'azure',
              },
            ].map(({ icon: Icon, title, description, color }, index) => (
              <div key={index} className="col-sm-6 col-lg-3">
                <div className="card card-sm">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <span className={`avatar avatar-sm bg-${color}-lt`}>
                        <Icon size={24} stroke={1.5} />
                      </span>
                      <div className="ms-3">
                        <div className="font-weight-medium">{title}</div>
                        <div className="text-muted">{description}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Technical Overview */}
          <h3 className="mt-4 mb-3">Technical Overview</h3>
          <div className="row g-3">
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <h4 className="card-title">Data Collection</h4>
                  <p className="text-muted mb-0">
                    Local enumerators collect catch data across landing sites, enhanced by vessel
                    tracking for comprehensive fishing activity monitoring.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <h4 className="card-title">Processing</h4>
                  <p className="text-muted mb-0">
                    Automated daily processing includes data cleaning, standardization, and
                    enrichment with FishBase information.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <h4 className="card-title">Methodology</h4>
                  <p className="text-muted mb-0">
                    Statistical modeling generates reliable estimates of key metrics such as landing
                    values, catches, and fishing effort using R-based analytics.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;
