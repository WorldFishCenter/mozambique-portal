import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';

/**
 * @typedef {Object} TaxaLengthItem
 * @property {string} _id - MongoDB ID
 * @property {string} [catch_taxon] - Fish taxon name
 * @property {number} [length_class] - Length measurement
 * @property {string[]} [type] - Data type (metadata indicator)
 */

/**
 * @param {Object} props
 * @param {TaxaLengthItem[]} props.data - Raw taxa length data
 * @param {'dark' | 'light'} props.theme - UI theme
 */
const TaxaLengthChart = ({ data, theme }) => {
  // Process data for boxplot format
  const processedData = useMemo(() => {
    // Filter out metadata
    const filteredData = data.filter(d => !d.type?.includes('metadata'));
    
    // Group by catch_taxon
    const grouped = {};
    filteredData.forEach(item => {
      if (!item.catch_taxon || typeof item.length_class !== 'number') return;
      
      if (!grouped[item.catch_taxon]) {
        grouped[item.catch_taxon] = [];
      }
      grouped[item.catch_taxon].push(item.length_class);
    });
    
    // Calculate statistics for each taxon
    const stats = Object.entries(grouped).map(([taxon, lengths]) => {
      // Sort lengths for percentile calculations
      lengths.sort((a, b) => a - b);
      
      const min = lengths[0];
      const max = lengths[lengths.length - 1];
      const q1Index = Math.floor(lengths.length * 0.25);
      const medianIndex = Math.floor(lengths.length * 0.5);
      const q3Index = Math.floor(lengths.length * 0.75);
      
      const q1 = lengths[q1Index];
      const median = lengths[medianIndex];
      const q3 = lengths[q3Index];
      
      return {
        taxon,
        min,
        q1,
        median,
        q3,
        max,
        count: lengths.length
      };
    });
    
    // Sort by median length (descending)
    return stats.sort((a, b) => b.median - a.median);
  }, [data]);

  // Extract taxa names for categories (y-axis)
  const taxaNames = useMemo(() => 
    processedData.map(item => item.taxon),
  [processedData]);
  
  const options = {
    chart: {
      type: 'boxPlot',
      height: Math.max(450, processedData.length * 50), // Adjust height based on number of taxa
      toolbar: {
        show: true
      },
      fontFamily: 'inherit',
      background: 'transparent'
    },
    title: {
      text: 'Fish Length Distribution by Taxa',
      align: 'left',
      style: {
        fontSize: '16px',
        color: theme === 'dark' ? '#94a3b8' : '#475569'
      }
    },
    subtitle: {
      text: 'Ranked by median length',
      align: 'left',
      style: {
        fontSize: '14px',
        color: theme === 'dark' ? '#94a3b8' : '#6b7280' 
      }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '70%'
      },
      boxPlot: {
        colors: {
          upper: theme === 'dark' ? '#60a5fa' : '#3b82f6',
          lower: theme === 'dark' ? '#60a5fa' : '#3b82f6'
        }
      }
    },
    stroke: {
      colors: ['#6c757d']
    },
    tooltip: {
      shared: false,
      intersect: true,
      custom: function({ seriesIndex, dataPointIndex, w }) {
        const data = w.config.series[seriesIndex].data[dataPointIndex];
        const taxonInfo = processedData[dataPointIndex];
        
        return `
          <div class="apexcharts-tooltip-box">
            <span><b>${data.x}</b> (n=${taxonInfo.count})</span><br/>
            <span>Min: ${data.y[0].toFixed(1)} cm</span><br/>
            <span>Q1: ${data.y[1].toFixed(1)} cm</span><br/>
            <span>Median: ${data.y[2].toFixed(1)} cm</span><br/>
            <span>Q3: ${data.y[3].toFixed(1)} cm</span><br/>
            <span>Max: ${data.y[4].toFixed(1)} cm</span>
          </div>
        `;
      }
    },
    xaxis: {
      title: {
        text: 'Length (cm)',
        style: {
          fontSize: '13px',
          color: theme === 'dark' ? '#94a3b8' : '#475569'
        }
      },
      labels: {
        style: {
          colors: theme === 'dark' ? '#94a3b8' : '#475569'
        },
        formatter: function(val) {
          return typeof val === 'number' ? val.toFixed(0) : val;
        }
      },
      axisBorder: {
        show: true
      },
      axisTicks: {
        show: true
      }
    },
    yaxis: {
      title: {
        text: 'Fish Taxa',
        style: {
          fontSize: '13px',
          color: theme === 'dark' ? '#94a3b8' : '#475569'
        }
      },
      labels: {
        style: {
          colors: theme === 'dark' ? '#94a3b8' : '#475569'
        }
      },
      categories: taxaNames
    },
    grid: {
      borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: false
        }
      }
    }
  };

  // Prepare data for ApexCharts boxplot
  const series = useMemo(() => {
    return [{
      name: 'Length Distribution',
      data: processedData.map(item => ({
        x: item.taxon,
        y: [item.min, item.q1, item.median, item.q3, item.max]
      }))
    }];
  }, [processedData]);

  return (
    <div className="p-3">
      <Chart
        options={options}
        series={series}
        type="boxPlot"
        height={options.chart.height}
      />
      <div className="mt-3 text-muted small">
        <p>Each box shows the distribution of fish lengths: the central line indicates the median, box edges represent the 1st and 3rd quartiles (25th and 75th percentiles), and whiskers show the minimum and maximum values.</p>
      </div>
    </div>
  );
};

export default React.memo(TaxaLengthChart);