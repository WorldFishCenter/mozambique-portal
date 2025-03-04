import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';

// Create a wrapper component to bypass TypeScript errors
const ApexBarChart = (props) => {
  // @ts-ignore - Bypass TypeScript checking for ApexCharts
  return <Chart {...props} />;
};

/**
 * Component that displays a stacked barplot of taxa proportions by landing site
 * 
 * @param {Object} props
 * @param {Array} props.data - Raw taxa sites data
 * @param {'dark' | 'light'} props.theme - UI theme
 */
const TaxaProportionsChart = ({ data, theme }) => {
  // Process data for chart
  const processedData = useMemo(() => {
    // Filter out metadata
    const filteredData = data.filter(d => !d.type?.includes('metadata'));

    // Group by landing_site and catch_taxon
    const landingSites = [...new Set(filteredData.map(item => item.landing_site))].sort();
    const allTaxa = [...new Set(filteredData.map(item => item.catch_taxon))];

    // Define taxa categories to use
    const categories = [
      'Barracuda',
      'Chub',
      'Emperor',
      'Fusilier',
      'Grouper',
      'Jacks/Trevally/Other Scad',
      'Mackerel scad',
      'Mojarra/Silverbelly',
      'Other',
      'Parrotfish',
      'Sardines/pilchards',
      'Snapper/seaperch',
      'Soldierfish',
      'Spinefoot',
      'Surgeonfish'
    ];

    // Create a map of landing site to taxa proportions
    const siteProportions = {};
    landingSites.forEach(site => {
      siteProportions[site] = {};

      // Initialize all categories to 0
      categories.forEach(category => {
        siteProportions[site][category] = 0;
      });

      // Filter data for this site
      const siteData = filteredData.filter(item => item.landing_site === site);

      // Calculate total catch for this site to compute percentages
      const totalCatch = siteData.reduce((sum, item) => sum + (item.catch_kg || 0), 0);

      // Fill in actual values (using catch_percent if available, otherwise calculate from catch_kg)
      siteData.forEach(item => {
        if (categories.includes(item.catch_taxon)) {
          // Use catch_percent if available, otherwise calculate from catch_kg
          const percentage = item.catch_percent !== undefined
            ? item.catch_percent
            : (totalCatch > 0 ? (item.catch_kg / totalCatch * 100) : 0);

          siteProportions[site][item.catch_taxon] = percentage;
        } else {
          siteProportions[site]['Other'] += item.catch_percent !== undefined
            ? item.catch_percent
            : (totalCatch > 0 ? (item.catch_kg / totalCatch * 100) : 0);
        }
      });
    });

    // Format data for ApexCharts series
    const series = categories.map(category => {
      return {
        name: category,
        data: landingSites.map(site => siteProportions[site][category] || 0)
      };
    });

    return {
      landingSites,
      series
    };
  }, [data]);

  const chartOptions = {
    chart: {
      type: 'bar',
      stacked: true,
      stackType: '100%',
      toolbar: {
        show: true
      },
      fontFamily: 'inherit',
      background: 'transparent'
    },
    plotOptions: {
      bar: {
        horizontal: true
      }
    },
    colors: [
      '#1e293b', // Barracuda - dark blue
      '#3b82f6', // Chub - blue
      '#60a5fa', // Emperor - light blue
      '#93c5fd', // Fusilier - lighter blue
      '#7dd3fc', // Grouper - cyan
      '#67e8f9', // Jacks/Trevally - teal
      '#a7f3d0', // Mackerel scad - light green
      '#86efac', // Mojarra/Silverbelly - green
      '#fef08a', // Other - yellow
      '#fcd34d', // Parrotfish - gold
      '#fdba74', // Sardines - light orange
      '#fb923c', // Snapper - orange
      '#f87171', // Soldierfish - red
      '#b91c1c', // Spinefoot - dark red
      '#7f1d1d'  // Surgeonfish - burgundy
    ],
    title: {
      text: 'Catch Composition by Landing Site',
      align: 'left',
      style: {
        fontSize: '16px',
        color: theme === 'dark' ? '#94a3b8' : '#475569'
      }
    },
    xaxis: {
      categories: processedData.landingSites.map(site => site.charAt(0).toUpperCase() + site.slice(1).replace('_', ' ')),
      labels: {
        formatter: function (val) {
          return val + "%";
        },
        style: {
          colors: theme === 'dark' ? '#cbd5e1' : '#475569'
        }
      },
      title: {
        text: 'Catch Composition',
        style: {
          color: theme === 'dark' ? '#cbd5e1' : '#475569'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: theme === 'dark' ? '#cbd5e1' : '#475569'
        }
      }
    },
    tooltip: {
      onDatasetHover: {
        highlightDataSeries: true,
      },
      y: {
        formatter: function (val) {
          return val.toFixed(1) + "%";
        }
      }
    },
    fill: {
      opacity: 1
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'left',
      labels: {
        colors: theme === 'dark' ? '#cbd5e1' : '#475569'
      }
    },
    dataLabels: {
      enabled: false
    },
    grid: {
      borderColor: theme === 'dark' ? '#334155' : '#e2e8f0'
    }
  };

  return (
    <div className="p-3">
      <ApexBarChart
        options={chartOptions}
        series={processedData.series}
        type="bar"
        height={Math.max(450, processedData.landingSites.length * 40)}
      />
    </div>
  );
};

export default TaxaProportionsChart; 