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
  currency,
}) => {
  // Extract unit from formatValue function by calling it with a test value
  const unit = useMemo(() => {
    const testValue = formatValue ? formatValue(1) : '1';
    return testValue.replace(/[\d.,]+\s?/, '').trim();
  }, [formatValue]);

  const options = useMemo(
    () => ({
      ...chartConfig,
      chart: {
        ...chartConfig.chart,
        height,
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
        enabled: viewMode === 'yearly',
        style: {
          fontSize: '12px',
          fontWeight: 500,
        },
        formatter: function (val) {
          if (val === null || val === undefined) return '';
          return formatValue ? formatValue(val) : val.toFixed(2);
        },
      },
      stroke: {
        curve: 'smooth',
        width: viewMode === 'yearly' ? 0 : 2,
        lineCap: 'round',
      },
      fill: {
        opacity: viewMode === 'yearly' ? 1 : 0.2,
        type: viewMode === 'yearly' ? 'solid' : 'gradient',
        gradient:
          viewMode === 'yearly'
            ? undefined
            : {
                shadeIntensity: 1,
                opacityFrom: 0.7,
                opacityTo: 0.3,
                stops: [0, 90, 100],
              },
      },
      plotOptions: {
        bar: {
          borderRadius: 8,
          columnWidth: '60%',
          colors: {
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
        type: viewMode === 'yearly' ? 'category' : 'datetime',
        labels: {
          style: {
            fontSize: '12px',
          },
          format: viewMode === 'yearly' ? undefined : 'MMM yyyy',
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: {
        title: {
          text: unit,
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
            // Just return the number without the unit
            return val.toFixed(2);
          },
        },
        forceNiceScale: true,
        decimalsInFloat: 2,
      },
      tooltip: {
        theme: theme === 'dark' ? 'dark' : 'light',
        x: {
          format: viewMode === 'yearly' ? 'yyyy' : 'dd MMM yyyy',
        },
        y: {
          formatter: function (val) {
            return val == null ? 'No data' : formatValue ? formatValue(val) : val.toFixed(2);
          },
        },
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
      markers: {
        size: viewMode === 'yearly' ? 0 : 4,
        strokeWidth: 2,
        strokeColors: theme === 'dark' ? '#3b82f6' : '#60a5fa',
        hover: {
          size: 6,
        },
      },
    }),
    [chartConfig, theme, viewMode, height, formatValue, unit]
  );

  return (
    <Chart
      key={`${viewMode}-${currency || ''}`}
      options={options}
      series={[
        {
          name: title,
          data: data,
        },
      ]}
      type={viewMode === 'yearly' ? 'bar' : 'area'}
      height={height}
    />
  );
};

export default React.memo(TimeSeriesChart);
