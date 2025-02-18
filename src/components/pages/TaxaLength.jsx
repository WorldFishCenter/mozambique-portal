import React, { useMemo } from 'react';
import { useTheme } from '../../hooks/useTheme';
import TaxaLengthChart from '../charts/TaxaLengthChart';
import { getTaxaLength } from '../../services/dataService';

const TaxaLength = () => {
  const { theme } = useTheme();
  const rawData = getTaxaLength();

  // Filter and transform data to match the required type
  const chartData = useMemo(() => {
    return rawData
      .filter(item => 
        !item.type?.includes('metadata') && 
        typeof item.q25 === 'number' &&
        typeof item.q75 === 'number' &&
        typeof item.min === 'number' &&
        typeof item.max === 'number' &&
        typeof item.catch_taxon === 'string'
      )
      .map(item => ({
        catch_taxon: item.catch_taxon,
        q25: item.q25,
        q75: item.q75,
        min: item.min,
        max: item.max
      }));
  }, [rawData]);

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
            <TaxaLengthChart data={chartData} theme={theme} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxaLength; 