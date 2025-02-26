import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getChartConfig } from '../../utils/chartConfigs';
import { getCatchData } from '../../services/dataService';
import gearMetricsData from '../../data/gear-metrics.json';
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

  // Memoized yearly aggregation
  const aggregateToYearly = useCallback(monthlyData => {
    const yearlyMap = new Map();

    monthlyData.forEach(item => {
      const date = new Date(item.x);
      const year = date.getFullYear();

      if (!yearlyMap.has(year)) {
        yearlyMap.set(year, {
          sum: 0,
          count: 0,
        });
      }

      if (item.y !== null) {
        yearlyMap.get(year).sum += item.y;
        yearlyMap.get(year).count += 1;
      }
    });

    return Array.from(yearlyMap.entries())
      .map(([year, data]) => ({
        x: year.toString(),
        y: data.count > 0 ? Number((data.sum / data.count).toFixed(2)) : null,
      }))
      .sort((a, b) => parseInt(a.x) - parseInt(b.x));
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

  // Memoized gear metrics data processing
  const processedGearMetrics = useMemo(() => {
    if (!Array.isArray(gearMetricsData) || gearMetricsData.length === 0) {
      console.warn('No gear metrics data available');
      return {
        series: [],
        gearTypes: [],
      };
    }

    try {
      // Filter for CPUE metrics only and exclude metadata
      const cpueData = gearMetricsData.filter(
        d =>
          d.metric === 'median_cpue' &&
          !d.type &&
          typeof d.value === 'number' &&
          d.landing_site &&
          d.gear
      );

      if (cpueData.length === 0) {
        console.warn('No CPUE data found in gear metrics');
        return {
          series: [],
          gearTypes: [],
        };
      }

      // Calculate total CPUE for each gear type and landing site
      const gearTotals = {};
      const siteTotals = {};

      cpueData.forEach(d => {
        if (!gearTotals[d.gear]) gearTotals[d.gear] = 0;
        if (!siteTotals[d.landing_site]) siteTotals[d.landing_site] = 0;
        gearTotals[d.gear] += d.value || 0;
        siteTotals[d.landing_site] += d.value || 0;
      });

      // Sort gear types by highest CPUE first
      const gearTypes = Object.keys(gearTotals).sort((a, b) => gearTotals[b] - gearTotals[a]);
      // Sort landing sites by lowest CPUE first (so highest CPUE will be at the top)
      const landingSites = Object.keys(siteTotals).sort((a, b) => siteTotals[a] - siteTotals[b]);

      // Transform data into series format
      const series = landingSites.map(site => ({
        name: site.replace(/_/g, ' '),
        data: gearTypes.map(gear => {
          const match = cpueData.find(d => d.landing_site === site && d.gear === gear);
          return match && match.value ? Number(match.value.toFixed(2)) : -1;
        }),
      }));

      console.log('Processed gear metrics:', {
        landingSites,
        gearTypes,
        series,
        rawData: cpueData,
        gearTotals,
        siteTotals,
      });

      return {
        series,
        gearTypes: gearTypes.map(gear => gear.replace(/_/g, ' ')),
      };
    } catch (error) {
      console.error('Error processing gear metrics data:', error);
      return {
        series: [],
        gearTypes: [],
      };
    }
  }, []);

  // Calculate color ranges
  const colorRanges = useMemo(() => {
    if (!processedGearMetrics.series.length) return [];

    const allValues = processedGearMetrics.series.flatMap(s => s.data).filter(v => v > 0);

    if (allValues.length === 0) return [];

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const step = (40 - min) / 7; // Changed to use 40 as max for regular scale

    return [
      {
        from: -1,
        to: -1,
        color: theme === 'dark' ? '#374151' : '#f3f4f6',
        name: 'No Data',
      },
      {
        from: min,
        to: min + step,
        color: '#ffffd990',
        name: `< ${(min + step).toFixed(2)}`,
      },
      {
        from: min + step,
        to: min + 2 * step,
        color: '#edf8b190',
        name: `${(min + step).toFixed(2)} - ${(min + 2 * step).toFixed(2)}`,
      },
      {
        from: min + 2 * step,
        to: min + 3 * step,
        color: '#c7e9b490',
        name: `${(min + 2 * step).toFixed(2)} - ${(min + 3 * step).toFixed(2)}`,
      },
      {
        from: min + 3 * step,
        to: min + 4 * step,
        color: '#7fcdbb90',
        name: `${(min + 3 * step).toFixed(2)} - ${(min + 4 * step).toFixed(2)}`,
      },
      {
        from: min + 4 * step,
        to: min + 5 * step,
        color: '#41b6c490',
        name: `${(min + 4 * step).toFixed(2)} - ${(min + 5 * step).toFixed(2)}`,
      },
      {
        from: min + 5 * step,
        to: min + 6 * step,
        color: '#1d91c090',
        name: `${(min + 5 * step).toFixed(2)} - ${(min + 6 * step).toFixed(2)}`,
      },
      {
        from: min + 6 * step,
        to: 40,
        color: '#225ea890',
        name: `${(min + 6 * step).toFixed(2)} - 40.00`,
      },
      {
        from: 40,
        to: max,
        color: '#0c2c8490',
        name: '> 40.00',
      },
    ];
  }, [processedGearMetrics.series, theme]);

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
                  title={landingSite === 'all' ? 'All Landing Sites' : landingSite}
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
            {processedGearMetrics.series.length > 0 ? (
              <GearMetricsHeatmap
                theme={theme}
                series={processedGearMetrics.series}
                gearTypes={processedGearMetrics.gearTypes}
                colorRanges={colorRanges}
                formatValue={val => `${val.toFixed(2)} kg/fisher/hour`}
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
