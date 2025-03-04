import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';

/** @type {import('react-apexcharts').Props['type']} */
const CHART_TYPE = 'treemap';

// Define colors for different habitats with specific hex values matching the image
const HABITAT_COLORS = {
  'Reef': '#5D2A8C',      // Deep purple
  'Pelagic': '#3F7CAC',   // Steel blue
  'Beach': '#4CAF7C',     // Sea green
  'Mangroves': '#F4D03F', // Golden yellow
  'Seagrass': '#FFA07A',  // Light salmon
  'FAD': '#DC3545'        // Red
};

const GearMetricsTreemap = ({
  theme,
  data,
  height = 600,
  formatValue,
  metric = 'cpue' // 'cpue' or 'rpue'
}) => {
  const series = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];

    // Get the metric data (cpue or rpue)
    const metricData = data[0][metric];
    
    // Create a series for each habitat
    return metricData.map(habitat => ({
      name: habitat.name[0],
      data: habitat.data.map(item => ({
        x: item.x[0],
        y: item.y[0]
      })).sort((a, b) => b.y - a.y)
    }));
  }, [data, metric]);

  const options = useMemo(() => ({
    chart: {
      type: CHART_TYPE,
      height,
      toolbar: {
        show: true
      },
      animations: {
        enabled: true,
        speed: 800,
        animateGradually: {
          enabled: true
        }
      },
      fontFamily: 'inherit',
      background: 'transparent'
    },
    colors: Object.values(HABITAT_COLORS),
    title: {
      text: '',
      align: /** @type {'left'} */ ('left'),
      style: {
        fontSize: '16px',
        color: theme === 'dark' ? '#94a3b8' : '#475569'
      }
    },
    legend: {
      show: true,
      position: /** @type {'top'} */ ('top'),
      fontSize: '15px',
      fontFamily: 'inherit',
      labels: {
        colors: theme === 'dark' ? '#94a3b8' : '#475569'
      },
      onItemClick: {
        toggleDataSeries: false
      }
    },
    plotOptions: {
      treemap: {
        enableShades: true,
        shadeIntensity: 0.2,
        distributed: false,
        useFillColorAsStroke: false
      }
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '13px',
        fontWeight: 500,
        fontFamily: 'inherit',
        colors: ['#fff']
      },
      formatter: function(text, op) {
        const suffix = metric === 'cpue' ? ' kg/hrs' : ' MZM/hrs';
        return `${text}\n${op.value.toFixed(2)}${suffix}`;
      }
    },
    tooltip: {
      enabled: true,
      shared: false,
      followCursor: true,
      intersect: true,
      theme: theme === 'dark' ? 'dark' : 'light',
      style: {
        fontSize: '12px'
      },
      y: {
        formatter: function(val) {
          const suffix = metric === 'cpue' ? ' kg/hrs' : ' MZM/hrs';
          return val.toFixed(2) + suffix;
        }
      }
    }
  }), [theme, height, metric]);

  return (
    <Chart
      options={options}
      series={series}
      type={CHART_TYPE}
      height={height}
    />
  );
};

export default React.memo(GearMetricsTreemap);
