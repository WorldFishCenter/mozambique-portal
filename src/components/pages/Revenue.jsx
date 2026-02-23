import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getChartConfig } from '../../utils/chartConfigs';
import { getRevenueData } from '../../services/dataService';
import gearHabitatMetrics from '../../data/gear-habitat-metrics.json';
import TimeSeriesChart from '../charts/TimeSeriesChart';
import SeasonalChart from '../charts/SeasonalChart';
import GearMetricsHeatmap from '../charts/GearMetricsHeatmap';
import InfoButton from '../common/InfoButton';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <span>Loading data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Error loading data: {error}</AlertDescription>
      </Alert>
    );
  }

  if (!revenueData?.selectedData?.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No data available for {landingSite === 'all' ? 'all districts' : landingSite}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <CardTitle>Revenue per unit effort (median)</CardTitle>
            <InfoButton
              title="Revenue Per Unit Effort (RPUE)"
              content="This chart shows the median revenue per fisher per hour over time. The time series displays monthly trends, while the radar chart shows median values by month across all years. Use the 'Differenced' view to see deviations from the mean value, with green bars indicating above-average values and red bars indicating below-average values across the time series."
              placement="bottom"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'monthly' ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode('monthly')}
            >
              Monthly
            </Button>
            <Button
              variant={viewMode === 'differenced' ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode('differenced')}
            >
              Differenced
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Latest RPUE</p>
              <div className="flex items-baseline gap-2">
                {typeof latestValue === 'number' ? (
                  <>
                    <span className="text-3xl font-bold">
                      {formatWithCurrency(latestValue, true)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {CURRENCY_SYMBOLS[currency]}/fisher/hour
                    </span>
                  </>
                ) : (
                  <span className="text-3xl font-bold">No data</span>
                )}
              </div>
            </div>

            {percentChange && (
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">
                  Change from {percentChange.previousPeriod} to {percentChange.currentPeriod}
                </span>
                <div className={`flex items-center gap-1 text-sm font-medium ${parseFloat(percentChange.change) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {parseFloat(percentChange.change) >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {Math.abs(Number(percentChange.change))}%
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
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
            <div className="md:col-span-1">
              <SeasonalChart theme={theme} data={seasonalData} formatValue={formatValueWithUnit} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Heatmap card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-baseline gap-2">
              Revenue by Habitat and Gear Type
              <span className="text-sm font-normal text-muted-foreground">MZN/fisher/hour</span>
            </CardTitle>
            <InfoButton
              title="Revenue Heatmap"
              content="This heatmap visualizes revenue rates across different combinations of habitats and fishing gears. Darker colors indicate higher revenue rates. This helps identify which gear-habitat combinations are most productive for fisheries."
              placement="bottom"
            />
          </div>
        </CardHeader>
        <CardContent>
          {gearHabitatMetrics.length > 0 ? (
            <div className="h-[400px] w-full">
              <GearMetricsHeatmap
                theme={theme}
                data={gearHabitatMetrics}
                formatValue={val => {
                  const converted = (val * EXCHANGE_RATES[currency]).toFixed(2);
                  return `${converted} ${CURRENCY_SYMBOLS[currency]}/fisher/hour`;
                }}
                metric="rpue"
              />
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              No gear metrics data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(Revenue);
