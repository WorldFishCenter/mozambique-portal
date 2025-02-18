import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';

/** @type {import('react-apexcharts').Props['type']} */
const CHART_TYPE = 'radar';

const SeasonalChart = ({ theme, data, height = 350, formatValue }) => {
  const options = useMemo(
    () => ({
      chart: {
        type: CHART_TYPE,
        height,
        toolbar: {
          show: false,
        },
        background: 'transparent',
      },
      xaxis: {
        categories: data.map(d => d.x),
        labels: {
          style: {
            colors: Array(12).fill(theme === 'dark' ? '#94a3b8' : '#475569'),
            fontSize: '12px',
          },
        },
      },
      yaxis: {
        min: 0,
        max: Math.ceil(Math.max(...data.map(d => d.y || 0))),
        tickAmount: 5,
        labels: {
          formatter: function (val) {
            return formatValue ? formatValue(val) : val.toFixed(2);
          },
          style: {
            colors: [theme === 'dark' ? '#94a3b8' : '#475569'],
          },
        },
      },
      grid: {
        show: false,
      },
      plotOptions: {
        radar: {
          size: undefined,
          polygons: {
            strokeColors: theme === 'dark' ? '#334155' : '#cbd5e1',
            strokeWidth: '1',
            connectorColors: theme === 'dark' ? '#334155' : '#cbd5e1',
          },
        },
      },
      markers: {
        size: 4,
        colors: [theme === 'dark' ? '#3b82f6' : '#60a5fa'],
        strokeColors: [theme === 'dark' ? '#3b82f6' : '#60a5fa'],
        strokeWidth: 2,
      },
      fill: {
        opacity: 0.2,
        colors: [theme === 'dark' ? '#3b82f6' : '#60a5fa'],
      },
      stroke: {
        width: 2,
        colors: [theme === 'dark' ? '#3b82f6' : '#60a5fa'],
        dashArray: 0,
      },
      tooltip: {
        theme: theme === 'dark' ? 'dark' : 'light',
        y: {
          formatter: function (val) {
            return formatValue ? formatValue(val) : val.toFixed(2);
          },
        },
      },
    }),
    [theme, data, height, formatValue]
  );

  return (
    <Chart
      options={options}
      series={[
        {
          name: 'Monthly Pattern',
          data: data.map(d => d.y),
        },
      ]}
      type="radar"
      height={height}
    />
  );
};

export default React.memo(SeasonalChart);
