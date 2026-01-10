import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';

/** @type {import('react-apexcharts').Props['type']} */
const CHART_TYPE = 'treemap';

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

    // Create a series for each habitat, filtering out zero or very small values
    return metricData.map(habitat => ({
      name: Array.isArray(habitat.name) ? habitat.name[0] : (habitat.name || habitat.habitat),
      data: habitat.data
        .filter(item => item.y[0] > 0.01) // Filter out zero or negligible values
        .map(item => ({
          x: item.x[0],
          y: item.y[0]
        }))
        .sort((a, b) => b.y - a.y)
    })).filter(habitat => habitat.data.length > 0); // Remove empty habitats
  }, [data, metric]);

  // Generate colors dynamically based on the number of habitats in the data
  const colors = useMemo(() => {
    if (series.length === 0) return [];
    
    // Extended color palette that can handle any number of habitats
    const baseColors = [
      '#5D2A8C', // Deep purple
      '#3F7CAC', // Steel blue
      '#4CAF7C', // Sea green
      '#F4D03F', // Golden yellow
      '#FFA07A', // Light salmon
      '#DC3545', // Red
      '#8B5CF6', // Purple
      '#06B6D4', // Cyan
      '#10B981', // Emerald
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#EC4899', // Pink
      '#6366F1', // Indigo
      '#14B8A6', // Teal
      '#F97316', // Orange
      '#84CC16', // Lime
      '#A855F7', // Violet
      '#22C55E', // Green
      '#EAB308', // Yellow
      '#3B82F6'  // Blue
    ];
    
    // Return colors for each habitat, cycling through the palette if needed
    return Array.from({ length: series.length }, (_, i) => 
      baseColors[i % baseColors.length]
    );
  }, [series]);

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
    colors: colors,
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
        useFillColorAsStroke: false,
        dataLabels: {
          format: /** @type {'scale'} */ ('scale')
        }
      }
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '13px',
        fontWeight: 600,
        fontFamily: 'inherit',
        colors: ['#fff']
      },
      formatter: function(text, op) {
        const value = op.value.toFixed(2);
        // Single line format for treemaps (multiline doesn't work properly)
        return `${text} ${value}`;
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
  }), [theme, height, metric, colors]);

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
