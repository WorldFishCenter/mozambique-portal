import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getChartConfig } from '../../utils/chartConfigs';
import { getRevenueData } from '../../services/dataService';
import gearHabitatMetrics from '../../data/gear-habitat-metrics.json';
import TimeSeriesChart from '../charts/TimeSeriesChart';
import SeasonalChart from '../charts/SeasonalChart';
import GearMetricsHeatmap from '../charts/GearMetricsHeatmap';
import InfoButton from '../common/InfoButton';

// Memoized constants
const EXCHANGE_RATES = {
  MZN: 1,
  USD: 0.016,  // 1 MZN = 0.016 USD
};

const CURRENCY_SYMBOLS = {
  MZN: 'MZN',
  USD: 'USD',
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
      
      if (skipSymbol) {
        return formattedValue;
      }
      
      // Format as "133.33 MZN/fisher/hour"
      return `${formattedValue} ${CURRENCY_SYMBOLS[currency]}/fisher/hour`;
    },
    [currency]
  );

  // Memoized currency formatting with unit for charts
  const formatValueWithUnit = useCallback(
    (value) => {
      if (value === null || value === undefined) return 'No data';
      const formattedValue = value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      // Format as "133.33 MZN/fisher/hour" - same as formatWithCurrency
      return `${formattedValue} ${CURRENCY_SYMBOLS[currency]}/fisher/hour`;
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
            <div className="d-flex align-items-center">
              <h3 className="card-title mb-0">Revenue per unit effort (median)</h3>
              <InfoButton
                title="Revenue Per Unit Effort (RPUE)"
                content="This chart shows the median revenue per fisher per hour over time. The time series displays monthly trends, while the radar chart shows median values by month across all years. Use the 'Differenced' view to see deviations from the mean value, with green bars indicating above-average values and red bars indicating below-average values across the time series."
                placement="bottom"
              />
            </div>
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
                <div className="text-muted mb-1">Latest RPUE</div>
                <div className="d-flex align-items-baseline">
                  {typeof latestValue === 'number' ? (
                    <>
                      <h1 className="h1 mb-0 me-1">
                        {formatWithCurrency(latestValue, true)}
                      </h1>
                      <span className="text-muted">
                        {CURRENCY_SYMBOLS[currency]}/fisher/hour
                      </span>
                    </>
                  ) : (
                    <h1 className="h1 mb-0">No data</h1>
                  )}
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
                  title={landingSite === 'all' ? 'All Districts' : landingSite}
                  formatValue={formatValueWithUnit}
                  currency={currency}
                />
              </div>
              <div className="col-4">
                <SeasonalChart theme={theme} data={seasonalData} formatValue={formatValueWithUnit} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap card */}
      <div className="col-12 mt-3">
        <div className="card">
          <div className="card-header">
            <div className="d-flex align-items-center">
              <h3 className="card-title mb-0">Revenue by Habitat and Gear Type <span className="text-muted fs-4">MZN/fisher/hour</span></h3>
              <InfoButton
                title="Revenue Heatmap"
                content="This heatmap visualizes revenue rates across different combinations of habitats and fishing gears. Darker colors indicate higher revenue rates. This helps identify which gear-habitat combinations are most productive for fisheries."
                placement="bottom"
              />
            </div>
          </div>
          <div className="card-body">
            {gearHabitatMetrics.length > 0 ? (
              <GearMetricsHeatmap
                theme={theme}
                data={gearHabitatMetrics}
                formatValue={val => {
                  const converted = (val * EXCHANGE_RATES[currency]).toFixed(2);
                  return `${converted} ${CURRENCY_SYMBOLS[currency]}/fisher/hour`;
                }}
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
