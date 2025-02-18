import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface TaxaLengthData {
  type?: string[];
  catch_taxon?: string;
  q25: number;
  q75: number;
  min: number;
  max: number;
}

interface ChartDataPoint {
  x: string;
  y: [number, number];
  q25: number;
  q75: number;
}

interface TaxaLengthChartProps {
  data: TaxaLengthData[];
  theme: 'dark' | 'light';
}

const TaxaLengthChart: React.FC<TaxaLengthChartProps> = ({ data, theme }) => {
  const chartData = useMemo(() => {
    // Filter out metadata
    const filteredData = data.filter(d => !d.type?.includes('metadata'));
    
    // Sort by median (q75 + q25)/2 descending
    return filteredData
      .sort((a, b) => ((b.q75 + b.q25) / 2) - ((a.q75 + a.q25) / 2))
      .map(item => ({
        x: item.catch_taxon || '',
        y: [item.min, item.max] as [number, number],
        q25: item.q25,
        q75: item.q75
      }));
  }, [data]);

  const options: ApexOptions = {
    chart: {
      type: 'rangeBar' as const,
      height: Math.max(350, chartData.length * 40), // Adjust height based on number of taxa
      toolbar: {
        show: false
      },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 2,
        barHeight: '40%',
        colors: {
          ranges: [{
            from: 0,
            to: 1000,
            color: theme === 'dark' ? '#60a5fa' : '#3b82f6'
          }]
        }
      }
    },
    tooltip: {
      shared: true,
      custom: function({ seriesIndex, dataPointIndex, w }) {
        const data = w.globals.initialSeries[seriesIndex].data[dataPointIndex] as ChartDataPoint;
        return `
          <div class="apexcharts-tooltip-box">
            <span><b>${data.x}</b></span><br/>
            <span>Min: ${data.y[0]} cm</span><br/>
            <span>Q25: ${data.q25} cm</span><br/>
            <span>Q75: ${data.q75} cm</span><br/>
            <span>Max: ${data.y[1]} cm</span>
          </div>
        `;
      }
    },
    title: {
      text: 'Fish Length Distribution by Taxa',
      align: 'left',
      style: {
        fontSize: '16px',
        color: theme === 'dark' ? '#94a3b8' : '#475569'
      }
    },
    xaxis: {
      title: {
        text: 'Length (cm)',
        style: {
          color: theme === 'dark' ? '#94a3b8' : '#475569'
        }
      },
      labels: {
        style: {
          colors: theme === 'dark' ? '#94a3b8' : '#475569'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: theme === 'dark' ? '#94a3b8' : '#475569'
        }
      }
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <Chart
          options={options}
          series={[{ 
            name: 'Length Range',
            data: chartData
          }]}
          type="rangeBar"
          height={options.chart.height}
        />
      </div>
    </div>
  );
};

export default TaxaLengthChart; 