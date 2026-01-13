/// <reference types="vite/client" />
import React, { useState, useMemo, memo } from 'react';
import { DeckGL } from '@deck.gl/react';
import { Map as MapGL } from 'react-map-gl';
import { GeoJsonLayer } from '@deck.gl/layers';
import mapboxgl from 'mapbox-gl';
import { IconSatellite, IconMap } from '@tabler/icons-react';
import effortMapData from '../../data/effort-map.json';
import geoIndicators from '../../data/geo-indicators.geojson';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  TIME_BREAKS,
  COLOR_RANGE,
  INITIAL_VIEW_STATE,
  // GRID_LAYER_SETTINGS,
  SHARED_STYLES,
} from '../../constants/mapConfig';

// @ts-ignore
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 
                     (typeof process !== 'undefined' && process.env && process.env.REACT_APP_MAPBOX_TOKEN);
console.log('Environment variables loaded:', !!(import.meta.env.VITE_MAPBOX_TOKEN || 
                     (typeof process !== 'undefined' && process.env && process.env.REACT_APP_MAPBOX_TOKEN)));

// Workaround for mapboxgl worker
const workerCode = `
  self.importScripts('https://unpkg.com/mapbox-gl@2.15.0/dist/mapbox-gl-csp-worker.js');
  self.addEventListener('message', (e) => {
    const action = e.data.type;
    if (action === 'ping') {
      self.postMessage({ type: 'pong' });
    }
  });
`;
const blob = new Blob([workerCode], { type: 'application/javascript' });
const workerUrl = URL.createObjectURL(blob);

// @ts-ignore
mapboxgl.workerClass = class {
  worker;
  onmessage;

  constructor() {
    this.worker = new Worker(workerUrl);
    this.worker.addEventListener('message', e => {
      if (this.onmessage) {
        this.onmessage(e);
      }
    });
  }

  postMessage(message) {
    this.worker.postMessage(message);
  }

  addEventListener(type, callback) {
    this.worker.addEventListener(type, callback);
  }

  removeEventListener(type, callback) {
    this.worker.removeEventListener(type, callback);
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
    }
  }
};

// Clean up the worker URL
URL.revokeObjectURL(workerUrl);

// Pre-filter and transform data once at module level
const FILTERED_DATA = effortMapData
  .filter(d => !d.type?.includes('metadata'))
  .map(d => ({
    position: [Number(d.lng_grid_1km), Number(d.lat_grid_1km)],
    avgTimeHours: Number(d.avg_time_hours) || 0,
    totalVisits: Number(d.total_visits) || 0,
    avgSpeed: Number(d.avg_speed) || 0,
    originalCells: Number(d.original_cells) || 0,
  }));

/** @type {React.FC<{ theme: string }>} */
const Map = memo(({ theme }) => {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [selectedRanges, setSelectedRanges] = useState(TIME_BREAKS);
  const [isSatellite, setIsSatellite] = useState(true);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('n_submissions');
  const [showControlPanel, setShowControlPanel] = useState(true);

  // Define available metrics
  const metrics = [
    { key: 'n_submissions', label: 'Submissions', unit: 'surveys', maxValue: 20000, description: 'Total number of fishing surveys collected' },
    { key: 'n_fishers', label: 'Fishers', unit: 'fishers', maxValue: 5, description: 'Average number of fishers per trip' },
    { key: 'mean_cpue', label: 'CPUE', unit: 'kg/fisher/hr', maxValue: 10, description: 'Catch per unit effort (kg per fisher per hour)' },
    { key: 'mean_rpue', label: 'RPUE', unit: 'MZN/fisher/hr', maxValue: 400, description: 'Revenue per unit effort (MZN per fisher per hour)' },
    { key: 'trip_duration', label: 'Trip Duration', unit: 'hours', maxValue: 8, description: 'Average trip duration in hours' },
    { key: 'mean_catch_kg', label: 'Mean Catch', unit: 'kg', maxValue: 100, description: 'Average catch per trip in kilograms' },
    { key: 'mean_price_kg', label: 'Price per kg', unit: 'MZN/kg', maxValue: 500, description: 'Average price per kilogram' }
  ];

  const currentMetric = metrics.find(m => m.key === selectedMetric) || metrics[0];

  // Memoize filtered data based on selected ranges
  const transformedData = useMemo(
    () =>
      FILTERED_DATA.filter(d =>
        selectedRanges.some(
          range =>
            d.avgTimeHours >= range.min &&
            (range.max === Infinity ? true : d.avgTimeHours < range.max)
        )
      ),
    [selectedRanges]
  );

  // Memoize tooltip function
  const getTooltipContent = (info) => {
    if (!info.object) return null;

    if (info.layer.id === 'grid-layer') {
      return `Count: ${info.object.points.length}`;
    }

    if (info.layer.id === 'geojson-layer') {
      const props = info.object.properties;
      const value = props[selectedMetric];
      const formattedValue = typeof value === 'number'
        ? (value % 1 === 0 ? value.toLocaleString() : value.toFixed(2))
        : value;

      return `${props.region.charAt(0).toUpperCase() + props.region.slice(1)}
${currentMetric.label}: ${formattedValue} ${currentMetric.unit}`;
    }

    return null;
  };

  // Memoize layers
  const layers = useMemo(() => {
    const filteredData = transformedData;
    const metric = metrics.find(m => m.key === selectedMetric) || metrics[0];

    console.log('Map rendering with metric:', selectedMetric, 'Max:', metric.maxValue);

    return [
      new GeoJsonLayer({
        id: 'geojson-layer',
        data: geoIndicators,
        pickable: true,
        stroked: true,
        filled: true,
        getFillColor: (feature) => {
          const value = feature.properties[selectedMetric];
          if (value === undefined || value === null) {
            console.warn('Missing value for', selectedMetric, 'in', feature.properties.region);
            return [200, 200, 200, 100]; // Gray for missing data
          }

          // Normalize value between 0 and 1 based on metric's max value
          const normalized = Math.min(Math.max(value / metric.maxValue, 0), 1);

          // Map normalized value to YlGnBu color scale (6 color steps)
          const colorIndex = Math.min(Math.floor(normalized * COLOR_RANGE.length), COLOR_RANGE.length - 1);
          const color = COLOR_RANGE[colorIndex];

          return [...color, 180]; // Add alpha channel
        },
        getLineColor: [255, 255, 255, 120],
        lineWidthMinPixels: 2,
        updateTriggers: {
          getFillColor: [selectedMetric]
        }
      })
    ];
  }, [transformedData, selectedRanges, selectedMetric]);

  if (!MAPBOX_TOKEN) {
    console.error('Mapbox token is missing. Please check your environment variables.');
    return (
      <div className="alert alert-danger m-3">
        <h4 className="alert-heading">Map Error</h4>
        <p>Mapbox token is missing. Please check that:</p>
        <ol>
          <li>The VITE_MAPBOX_TOKEN environment variable is set in your .env file</li>
          <li>Your development server has been restarted to load the updated variables</li>
        </ol>
      </div>
    );
  }

  return (
    <div className="position-relative h-100">
      {/* Control Panel */}
      {showControlPanel && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            width: '320px',
            zIndex: 1,
            ...SHARED_STYLES.glassPanel(theme),
            padding: '16px',
          }}
        >
          <h3
            style={{
              margin: '0 0 16px 0',
              ...SHARED_STYLES.text.heading(theme),
              fontSize: '16px',
              fontWeight: 600,
            }}
          >
            Geographic Indicators
          </h3>

          {/* Metric Selector */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px',
                color: theme === 'dark' ? '#94a3b8' : '#475569',
              }}
            >
              Select Metric
            </label>
            <select
              className="form-select form-select-sm"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              style={{
                backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                color: theme === 'dark' ? '#e2e8f0' : '#1e293b',
                border: theme === 'dark' ? '1px solid rgba(51, 65, 85, 0.5)' : '1px solid #cbd5e1',
                fontSize: '13px',
              }}
            >
              {metrics.map((metric) => (
                <option key={metric.key} value={metric.key}>
                  {metric.label} ({metric.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Metric Description */}
          <div
            style={{
              fontSize: '12px',
              color: theme === 'dark' ? '#cbd5e1' : '#64748b',
              backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
              padding: '8px 10px',
              borderRadius: '4px',
              marginBottom: '16px',
              lineHeight: '1.4',
            }}
          >
            {currentMetric.description}
          </div>

          {/* Color Scale Legend */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px',
                color: theme === 'dark' ? '#94a3b8' : '#475569',
              }}
            >
              Color Scale
            </label>
            <div
              style={{
                height: '8px',
                borderRadius: '4px',
                background: `linear-gradient(to right,
                  rgb(${COLOR_RANGE[0].join(',')}),
                  rgb(${COLOR_RANGE[1].join(',')}),
                  rgb(${COLOR_RANGE[2].join(',')}),
                  rgb(${COLOR_RANGE[3].join(',')}),
                  rgb(${COLOR_RANGE[4].join(',')}),
                  rgb(${COLOR_RANGE[5].join(',')})
                )`,
                marginBottom: '8px',
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: theme === 'dark' ? '#94a3b8' : '#64748b',
              }}
            >
              <span>0 {currentMetric.unit}</span>
              <span>{currentMetric.maxValue.toLocaleString()} {currentMetric.unit}</span>
            </div>
          </div>

          {/* Toggle Button */}
          <button
            className="btn btn-sm w-100 mt-3"
            style={{
              backgroundColor: theme === 'dark' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)',
              color: theme === 'dark' ? '#cbd5e1' : '#475569',
              border: 'none',
              fontSize: '12px',
            }}
            onClick={() => setShowControlPanel(false)}
          >
            Hide Panel
          </button>
        </div>
      )}

      {/* Show Panel Button (when hidden) */}
      {!showControlPanel && (
        <button
          className="btn btn-sm position-absolute"
          style={{
            top: 20,
            left: 20,
            zIndex: 1,
            backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            color: theme === 'dark' ? '#e2e8f0' : '#1e293b',
            border: theme === 'dark' ? '1px solid rgba(51, 65, 85, 0.5)' : '1px solid #cbd5e1',
            backdropFilter: 'blur(10px)',
          }}
          onClick={() => setShowControlPanel(true)}
        >
          Show Controls
        </button>
      )}

      <DeckGL
        initialViewState={viewState}
        controller={true}
        layers={layers}
        // onViewStateChange={handleViewStateChange}
        getTooltip={getTooltipContent}
      >
        <MapGL
          key={`${theme}-${isSatellite}`}
          mapStyle={
            isSatellite
              ? 'mapbox://styles/mapbox/satellite-v9'
              : theme === 'dark'
                ? 'mapbox://styles/mapbox/dark-v11'
                : 'mapbox://styles/mapbox/light-v11'
          }
          mapboxAccessToken={MAPBOX_TOKEN}
          onError={console.error}
          reuseMaps
          attributionControl={false}
          renderWorldCopies={false}
          antialias={true}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </DeckGL>
    </div>
  );
});

export default Map;
