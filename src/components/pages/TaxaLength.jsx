import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import TaxaLengthChart from '../charts/TaxaLengthChart';
import { getTaxaLength } from '../../services/dataService';

/**
 * Component that displays taxa length distribution using a boxplot
 */
const TaxaLength = () => {
  const { theme } = useTheme();
  const rawData = getTaxaLength();

  return (
    <div className="container-xl">
      <div className="page-header d-print-none">
        <div className="row align-items-center">
          <div className="col">
            <h2 className="page-title">Taxa Length Distribution</h2>
            <div className="text-muted mt-1">
              Length distribution of different fish taxa in the catch
            </div>
          </div>
        </div>
      </div>
      <div className="page-body">
        <div className="row row-cards">
          <div className="col-12">
            {/* @ts-ignore - Type definition handled in TaxaLengthChart component */}
            <TaxaLengthChart data={rawData} theme={theme} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxaLength; 