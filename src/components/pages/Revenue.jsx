import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getChartConfig } from '../../utils/chartConfigs';
import { getRevenueData } from '../../services/dataService';
import gearHabitatMetrics from '../../data/gear-habitat-metrics.json';
import TimeSeriesChart from '../charts/TimeSeriesChart';
import SeasonalChart from '../charts/SeasonalChart';
import GearMetricsHeatmap from '../charts/GearMetricsHeatmap';

// Memoized constants
const EXCHANGE_RATES = {
  MT: 1,
  USD: 0.016,  // 1 MT = 0.016 USD
  EUR: 0.015,  // 1 MT = 0.015 EUR
};

const CURRENCY_SYMBOLS = {
  MT: 'MT',
  USD: 'USD',
  EUR: '€',
};

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

const Revenue = ({ theme, landingSite, currency }) => {
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState(null);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('monthly');

  // Memoized currency conversion
  const convertCurrency = useCallback(
    value => {
      if (value === null || value === undefined) return null;
      return Number((value * EXCHANGE_RATES[currency]).toFixed(2));
    },
    [currency]
  );

  // Memoized currency formatting
  const formatWithCurrency = useCallback(
    (value, skipSymbol = false) => {
      if (value === null || value === undefined) return 'No data';
      const formattedValue = value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return skipSymbol ? formattedValue : `${CURRENCY_SYMBOLS[currency]} ${formattedValue}`;
    },
    [currency]
  );

  // Memoized data fetching
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRevenueData(landingSite);
      setRevenueData(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching revenue data:', err);
    } finally {
      setLoading(false);
    }
  }, [landingSite]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Memoize chart config
  const chartConfig = useMemo(() => getChartConfig(theme), [theme]);

  // Memoized monthly medians calculation
  const getMonthlyMedians = useCallback(data => {
    const monthlyData = new Array(12).fill().map(() => []);
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

    data.forEach(item => {
      if (item.y !== null) {
        const month = new Date(item.x).getMonth();
        monthlyData[month].push(item.y);
      }
    });

    return monthlyData.map((values, index) => ({
      x: monthNames[index],
      y: calculateMedian(values),
    }));
  }, []);

  // Memoized seasonal data calculation
  const seasonalData = useMemo(() => {
    if (!revenueData?.selectedData) return [];
    const rawData = getMonthlyMedians(revenueData.selectedData);
    return rawData.map(d => ({
      x: d.x,
      y: convertCurrency(d.y),
    }));
  }, [revenueData, convertCurrency, getMonthlyMedians]);

  // Memoized display data calculation
  const displayData = useMemo(() => {
    if (!revenueData?.selectedData) return [];
    return revenueData.selectedData.map(item => ({
      x: item.x,
      y: convertCurrency(item.y),
    }));
  }, [revenueData, convertCurrency]);

  // Memoized valid data filtering
  const validData = useMemo(() => {
    if (!revenueData?.selectedData) return [];
    return revenueData.selectedData
      .filter(item => item.y !== null && typeof item.y === 'number')
      .map(item => ({
        x: item.x,
        y: convertCurrency(item.y),
      }));
  }, [revenueData, convertCurrency]);

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

  if (!revenueData?.selectedData?.length) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="text-center text-muted">
            No data available for {landingSite === 'all' ? 'all landing sites' : landingSite}
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
            <h3 className="card-title">Revenue per unit effort (median)</h3>
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
                <div className="text-muted mb-1">Latest Revenue</div>
                <div className="d-flex align-items-baseline">
                  <h1 className="h1 mb-0 me-2">
                    {typeof latestValue === 'number' ? formatWithCurrency(latestValue) : 'No data'}
                  </h1>
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
                    <span className="fw-medium">{Math.abs(Number(percentChange.change))}%</span>
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
                  title={landingSite === 'all' ? 'All Landing Sites' : landingSite}
                  formatValue={formatWithCurrency}
                  currency={currency}
                />
              </div>
              <div className="col-4">
                <SeasonalChart theme={theme} data={seasonalData} formatValue={formatWithCurrency} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap card */}
      <div className="col-12 mt-3">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Revenue by Gear Type and Landing Site</h3>
          </div>
          <div className="card-body">
            {gearHabitatMetrics.length > 0 ? (
              <GearMetricsHeatmap
                theme={theme}
                data={gearHabitatMetrics}
                formatValue={val => `${CURRENCY_SYMBOLS[currency]} ${(val * EXCHANGE_RATES[currency]).toFixed(2)}`}
                metric="rpue"
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

export default React.memo(Revenue);
