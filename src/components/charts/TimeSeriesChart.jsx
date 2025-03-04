import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';

const TimeSeriesChart = ({
  theme,
  chartConfig,
  data,
  viewMode,
  title,
  height = 350,
  formatValue,
  currency = null,
}) => {
  // Extract unit from formatValue function
  const unit = useMemo(() => {
    const testValue = formatValue ? formatValue(1) : '1';
    return testValue.replace(/[\d.,]+\s?/, '').trim();
  }, [formatValue]);

  // Calculate mean and differences for differenced view
  const { transformedData, mean } = useMemo(() => {
    if (!data?.length || viewMode !== 'differenced') return { transformedData: [], mean: 0 };
    const validValues = data.filter(d => d.y !== null && !isNaN(d.y)).map(d => d.y);
    const mean = validValues.reduce((a, b) => a + b, 0) / validValues.length;
    
    const transformedData = data.map(d => ({
      x: d.x,
      y: d.y !== null ? Number((d.y - mean).toFixed(2)) : null
    }));
    
    return { transformedData, mean: Number(mean.toFixed(2)) };
  }, [data, viewMode]);

  const options = useMemo(
    () => ({
      ...chartConfig,
      chart: {
        ...chartConfig.chart,
        height,
        type: 'bar',
        sparkline: {
          enabled: false,
        },
        toolbar: {
          show: false,
        },
        animations: {
          enabled: true,
          easing: 'linear',
          speed: 800,
          dynamicAnimation: {
            enabled: true,
            speed: 350,
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: 0,
      },
      fill: {
        opacity: 1,
        type: 'solid',
      },
      plotOptions: {
        bar: {
          horizontal: false,
          borderRadius: 8,
          columnWidth: '60%',
          colors: viewMode === 'differenced' ? {
            ranges: [
              {
                from: -Infinity,
                to: 0,
                color: theme === 'dark' ? '#ef4444' : '#dc2626'
              },
              {
                from: 0,
                to: Infinity,
                color: theme === 'dark' ? '#22c55e' : '#16a34a'
              }
            ]
          } : {
            ranges: [
              {
                from: 0,
                to: Infinity,
                color: '#2196f3',
              },
            ],
          },
        },
      },
      xaxis: {
        type: 'datetime',
        labels: {
          style: {
            fontSize: '12px',
          },
          format: 'MMM yyyy',
          datetimeUTC: false,
          rotate: 0,
          trim: true,
          hideOverlappingLabels: true,
          offsetY: 0,
          formatter: function(val, timestamp) {
            const date = new Date(timestamp);
            return date.toLocaleDateString('en-US', { 
              month: 'short', 
              year: 'numeric' 
            });
          }
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        tickAmount: 'dataPoints',
        tickPlacement: 'on',
        convertedCatToNumeric: false,
        tickInterval: 'month'
      },
      yaxis: {
        title: {
          text: viewMode === 'differenced' ? 
            `Difference from mean (${mean} ${unit})` : 
            unit,
          style: {
            fontSize: '13px',
            fontWeight: 400,
            color: theme === 'dark' ? '#94a3b8' : '#475569',
          },
        },
        labels: {
          style: {
            fontSize: '12px',
          },
          formatter: function (val) {
            if (val === null || val === undefined) return '';
            return val.toFixed(2);
          },
        },
        forceNiceScale: true,
        decimalsInFloat: 2,
      },
      tooltip: {
        theme: theme === 'dark' ? 'dark' : 'light',
        x: {
          format: 'dd MMM yyyy'
        },
        y: {
          formatter: function (val) {
            if (val === null) return 'No data';
            if (viewMode === 'differenced') {
              const actualValue = val + mean;
              return `Actual: ${formatValue ? formatValue(actualValue) : actualValue.toFixed(2)}\nDiff from mean: ${val > 0 ? '+' : ''}${val.toFixed(2)} ${unit}`;
            }
            return formatValue ? formatValue(val) : val.toFixed(2);
          }
        }
      },
      grid: {
        show: true,
        borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
        strokeDashArray: 4,
        padding: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 10,
        },
      },
    }),
    [chartConfig, theme, viewMode, height, formatValue, mean, unit]
  );

  return (
    <Chart
      key={`${viewMode}-${currency || ''}`}
      options={options}
      series={[{
        name: title,
        data: viewMode === 'differenced' ? transformedData : data
      }]}
      type="bar"
      height={height}
    />
  );
};

export default React.memo(TimeSeriesChart);