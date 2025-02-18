// Chart configuration factory
export const getChartConfig = theme => ({
  chart: {
    type: 'area',
    height: 60,
    sparkline: {
      enabled: true,
    },
    toolbar: {
      show: false,
    },
    animations: {
      enabled: false,
    },
    background: 'transparent',
    foreColor: theme === 'dark' ? '#ffffff' : '#000000',
  },
  stroke: {
    curve: 'smooth',
    width: 2,
    lineCap: 'round',
  },
  fill: {
    opacity: 0.1,
    type: 'solid',
  },
  xaxis: {
    type: 'datetime',
    tooltip: {
      enabled: false,
    },
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: true,
      color: theme === 'dark' ? '#2c3e50' : '#e9ecef',
    },
    labels: {
      style: {
        colors: theme === 'dark' ? '#95a5a6' : '#64748b',
      },
    },
  },
  yaxis: {
    min: 0,
    labels: {
      formatter: value => Math.round(value),
      style: {
        colors: theme === 'dark' ? '#95a5a6' : '#64748b',
      },
    },
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: true,
      color: theme === 'dark' ? '#2c3e50' : '#e9ecef',
    },
  },
  grid: {
    show: true,
    borderColor: theme === 'dark' ? '#2c3e50' : '#e9ecef',
    strokeDashArray: 4,
    padding: {
      left: 2,
      right: 2,
    },
  },
  colors: [theme === 'dark' ? '#206bc4' : '#206bc4'],
  tooltip: {
    enabled: true,
    shared: true,
    intersect: false,
    theme: theme,
    style: {
      fontSize: '12px',
    },
    y: {
      formatter: value => value,
    },
    marker: {
      show: true,
    },
  },
  markers: {
    size: 3,
    strokeWidth: 1.5,
    strokeColors: theme === 'dark' ? '#206bc4' : '#206bc4',
    fillColors: theme === 'dark' ? '#1a2234' : '#ffffff',
    hover: {
      size: 5,
    },
  },
  responsive: [
    {
      breakpoint: 576,
      options: {
        chart: {
          height: 40,
        },
        markers: {
          size: 2,
        },
      },
    },
  ],
});
