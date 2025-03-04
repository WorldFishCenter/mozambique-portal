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
 * @param {Array} props.data - Raw taxa proportions data
 * @param {'dark' | 'light'} props.theme - UI theme
 */
const TaxaProportionsChart = ({ data, theme }) => {
  // Process data for chart
  const processedData = useMemo(() => {
    // Filter out metadata
    const filteredData = data.filter(d => !d.type?.includes('metadata'));
    
    // Group by landing_site and family
    const landingSites = [...new Set(filteredData.map(item => item.landing_site))].sort();
    const allFamilies = [...new Set(filteredData.map(item => item.family))];
    
    // Map fish families to common display names
    const familyDisplayNames = {
      'Acanthuridae': 'Surgeonfish',
      'Ariidae': 'Catfish',
      'Balistidae': 'Triggerfish',
      'Caesionidae': 'Fusilier',
      'Carangidae': 'Jacks/Trevally/Other Scad',
      'Clupeidae': 'Sardines/pilchards',
      'Dasyatidae': 'Stingray',
      'Gerreidae': 'Mojarra/Silverbelly',
      'Haemulidae': 'Grunts',
      'Hemiramphidae': 'Halfbeaks',
      'Lethrinidae': 'Emperor',
      'Lutjanidae': 'Snapper/seaperch',
      'Mullidae': 'Goatfish',
      'Myliobatidae': 'Eagle ray',
      'Nemipteridae': 'Threadfin bream',
      'Octopodidae': 'Octopus',
      'Scaridae': 'Parrotfish',
      'Scombridae': 'Mackerel scad',
      'Serranidae': 'Grouper',
      'Siganidae': 'Rabbitfish',
      'Sphyraenidae': 'Barracuda',
      'Xiphiidae': 'Swordfish',
      'Others': 'Other'
    };
    
    // Define fish family categories
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
    
    // Create a map of landing site to family proportions
    const siteProportions = {};
    landingSites.forEach(site => {
      siteProportions[site] = {};
      
      // Initialize all categories to 0
      categories.forEach(category => {
        siteProportions[site][category] = 0;
      });
      
      // Fill in actual values
      filteredData.forEach(item => {
        if (item.landing_site === site) {
          const displayName = familyDisplayNames[item.family] || 'Other';
          if (categories.includes(displayName)) {
            siteProportions[site][displayName] = item.catch_prop;
          } else {
            siteProportions[site]['Other'] += item.catch_prop;
          }
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
    <div className="card">
      <div className="card-body">
        <ApexBarChart
          options={chartOptions}
          series={processedData.series}
          type="bar"
          height={Math.max(450, processedData.landingSites.length * 40)}
        />
      </div>
    </div>
  );
};

export default TaxaProportionsChart; 