import React, { useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import TaxaLengthChart from '../charts/TaxaLengthChart';
import TaxaProportionsChart from '../charts/TaxaProportionsChart';
import { getTaxaLength, getTaxaProportions } from '../../services/dataService';

/**
 * Component that displays taxa length distribution and catch composition
 * with a tabbed interface
 */
const TaxaLength = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('length');
  const lengthData = getTaxaLength();
  const proportionsData = getTaxaProportions();

  return (
    <div className="container-xl">
      <div className="page-header d-print-none">
        <div className="row align-items-center">
          <div className="col">
            <h2 className="page-title">Fish Taxa Analysis</h2>
            <div className="text-muted mt-1">
              Length distribution and catch composition of different fish taxa
            </div>
          </div>
        </div>
      </div>
      <div className="page-body">
        <div className="card">
          <div className="card-header">
            <ul className="nav nav-tabs card-header-tabs">
              <li className="nav-item">
                <a 
                  href="#" 
                  className={`nav-link ${activeTab === 'length' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('length');
                  }}
                >
                  Length Distribution
                </a>
              </li>
              <li className="nav-item">
                <a 
                  href="#" 
                  className={`nav-link ${activeTab === 'composition' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('composition');
                  }}
                >
                  Catch Composition
                </a>
              </li>
            </ul>
          </div>
          <div className="card-body">
            <div className="tab-content">
              <div className={`tab-pane ${activeTab === 'length' ? 'active show' : ''}`}>
                {activeTab === 'length' && (
                  /* @ts-ignore - Type definitions handled in chart components */
                  <TaxaLengthChart data={lengthData} theme={theme} />
                )}
              </div>
              <div className={`tab-pane ${activeTab === 'composition' ? 'active show' : ''}`}>
                {activeTab === 'composition' && (
                  /* @ts-ignore - Type definitions handled in chart components */
                  <TaxaProportionsChart data={proportionsData} theme={theme} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxaLength; 