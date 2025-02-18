import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';

/** @type {import('react-apexcharts').Props['type']} */
const CHART_TYPE = 'heatmap';

const GearMetricsHeatmap = ({
  theme,
  series,
  gearTypes,
  colorRanges,
  height = 600,
  formatValue,
}) => {
  const options = useMemo(
    () => ({
      chart: {
        type: CHART_TYPE,
        height,
        toolbar: {
          show: false,
        },
        fontFamily: 'inherit',
        background: 'transparent',
      },
      dataLabels: {
        enabled: true,
        style: {
          colors: [theme === 'dark' ? '#ffffff' : '#000000'],
          fontSize: '12px',
          fontWeight: 500,
        },
        formatter: function (val) {
          return val === -1 ? '' : val.toFixed(2);
        },
      },
      plotOptions: {
        heatmap: {
          enableShades: false,
          colorScale: {
            ranges: colorRanges,
          },
          radius: 2,
          distributed: false,
          useFillColorAsStroke: true,
        },
      },
      xaxis: {
        categories: gearTypes,
        labels: {
          trim: true,
          style: {
            fontSize: '12px',
            colors: theme === 'dark' ? '#94a3b8' : '#475569',
          },
          rotate: -45,
        },
        axisBorder: {
          color: theme === 'dark' ? '#334155' : '#e2e8f0',
        },
        axisTicks: {
          color: theme === 'dark' ? '#334155' : '#e2e8f0',
        },
      },
      yaxis: {
        labels: {
          style: {
            fontSize: '12px',
            colors: theme === 'dark' ? '#94a3b8' : '#475569',
          },
        },
      },
      grid: {
        show: true,
        borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
        xaxis: {
          lines: {
            show: true,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
      },
      legend: {
        show: true,
        position: /** @type {'top'} */ ('top'),
        fontSize: '12px',
        labels: {
          colors: theme === 'dark' ? '#94a3b8' : '#475569',
        },
        markers: {
          width: 6,
          height: 6,
        },
      },
      tooltip: {
        theme: theme === 'dark' ? 'dark' : 'light',
        y: {
          formatter: function (val) {
            return val === -1 ? 'No data' : formatValue ? formatValue(val) : val.toFixed(2);
          },
        },
      },
    }),
    [theme, gearTypes, colorRanges, height, formatValue]
  );

  return <Chart options={options} series={series} type="heatmap" height={height} />;
};

export default React.memo(GearMetricsHeatmap);
