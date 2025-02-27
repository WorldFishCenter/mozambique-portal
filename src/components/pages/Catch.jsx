import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getChartConfig } from '../../utils/chartConfigs';
import { getCatchData } from '../../services/dataService';
import gearHabitatMetrics from '../../data/gear-habitat-metrics.json';
import TimeSeriesChart from '../charts/TimeSeriesChart';
import SeasonalChart from '../charts/SeasonalChart';
import GearMetricsHeatmap from '../charts/GearMetricsHeatmap';

// Memoized helper functions
const calculateMedian = values => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Number(((sorted[middle - 1] + sorted[middle]) / 2).toFixed(2));
  }
  return Number(sorted[middle].toFixed(2));
};

const Catch = ({ theme, landingSite }) => {
  const [loading, setLoading] = useState(true);
  const [catchData, setCatchData] = useState(null);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('monthly');

  // Memoize chart config to prevent unnecessary recalculations
  const chartConfig = useMemo(() => getChartConfig(theme), [theme]);

  // Memoized data fetching function
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCatchData(landingSite);
      setCatchData(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching catch data:', err);
    } finally {
      setLoading(false);
    }
  }, [landingSite]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Memoized monthly medians calculation
  const getMonthlyMedians = useCallback(data => {
    const monthlyData = new Array(12).fill().map(() => []);

    data.forEach(item => {
      if (item.y !== null) {
        const month = new Date(item.x).getMonth();
        monthlyData[month].push(item.y);
      }
    });

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    return monthlyData.map((values, index) => ({
      x: monthNames[index],
      y: calculateMedian(values),
    }));
  }, []);


  // Memoized seasonal data calculation
  const seasonalData = useMemo(() => {
    if (!catchData?.selectedData) return [];
    return getMonthlyMedians(catchData.selectedData);
  }, [catchData, getMonthlyMedians]);

  // Memoized display data calculation
  const displayData = useMemo(() => {
    if (!catchData?.selectedData) return [];
    return catchData.selectedData;
  }, [catchData]);

  // Memoized valid data filtering
  const validData = useMemo(() => {
    if (!catchData?.selectedData) return [];
    return catchData.selectedData.filter(item => item.y !== null && typeof item.y === 'number');
  }, [catchData]);

  // Memoized latest value calculation
  const latestValue = useMemo(() => {
    return validData.length > 0 ? validData[validData.length - 1].y : 0;
  }, [validData]);

  // Memoized percentage change calculation
  const percentChange = useMemo(() => {
    if (validData.length < 2) return null;

    const latest = validData[validData.length - 1];
    const previous = validData[validData.length - 2];

    return {
      change: (((latest.y - previous.y) / previous.y) * 100).toFixed(1),
      currentPeriod: new Date(latest.x).toLocaleString('default', {
        month: 'short',
        year: 'numeric',
      }),
      previousPeriod: new Date(previous.x).toLocaleString('default', {
        month: 'short',
        year: 'numeric',
      }),
    };
  }, [validData]);

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-center">
            <div className="spinner-border text-primary me-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <span>Loading data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-danger">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-center text-danger">
            <i className="ti ti-alert-circle me-2"></i>
            <span>Error loading data: {error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!catchData?.selectedData?.length) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="text-center text-muted">
            No data available for {landingSite === 'all' ? 'all districts' : landingSite}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="row row-deck row-cards">
      <div className="col-12">
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h3 className="card-title">Catch per unit effort (median)</h3>
            <div className="btn-group" role="group">
              <button
                type="button"
                className={`btn ${viewMode === 'monthly' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setViewMode('monthly')}
              >
                Monthly
              </button>
              <button
                type="button"
                className={`btn ${viewMode === 'differenced' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setViewMode('differenced')}
              >
                Differenced
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="d-flex align-items-center mb-4">
              <div className="me-4">
                <div className="text-muted mb-1">Latest CPUE</div>
                <div className="d-flex align-items-baseline">
                  <h1 className="h1 mb-0 me-2">
                    {typeof latestValue === 'number' ? latestValue.toFixed(2) : 'No data'}
                  </h1>
                  <span className="text-muted fs-4">kg/fisher/hour</span>
                </div>
              </div>
              {percentChange && (
                <div>
                  <div className="text-muted mb-1">
                    Change from {percentChange.previousPeriod} to {percentChange.currentPeriod}
                  </div>
                  <div
                    className={`d-inline-flex align-items-center px-2 py-1 rounded-2 ${
                      parseFloat(percentChange.change) >= 0
                        ? 'bg-success-lt text-success'
                        : 'bg-danger-lt text-danger'
                    }`}
                  >
                    <i
                      className={`ti ti-trend-${parseFloat(percentChange.change) >= 0 ? 'up' : 'down'} me-1`}
                    ></i>
                    <span className="fw-medium">{Math.abs(parseFloat(percentChange.change))}%</span>
                  </div>
                </div>
              )}
            </div>
            <div className="row">
              <div className="col-8">
                <TimeSeriesChart
                  theme={theme}
                  chartConfig={chartConfig}
                  data={displayData}
                  viewMode={viewMode}
                  title={landingSite === 'all' ? 'All Districts' : landingSite}
                  formatValue={val => `${val.toFixed(2)} kg/fisher/hour`}
                />
              </div>
              <div className="col-4">
                <SeasonalChart
                  theme={theme}
                  data={seasonalData}
                  formatValue={val => `${val.toFixed(2)} kg/fisher/hour`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap card */}
      <div className="col-12 mt-3">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Catch Rate by Gear Type</h3>
          </div>
          <div className="card-body">
            {gearHabitatMetrics.length > 0 ? (
              <GearMetricsHeatmap
                theme={theme}
                data={gearHabitatMetrics}
                formatValue={val => `${val.toFixed(2)} kg/fisher/hour`}
                metric="cpue"
              />
            ) : (
              <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                No gear metrics data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Catch);
