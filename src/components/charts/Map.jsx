/// <reference types="vite/client" />
import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { DeckGL } from '@deck.gl/react';
import { Map as MapGL } from 'react-map-gl';
// import { GridLayer } from '@deck.gl/aggregation-layers';
import { GeoJsonLayer } from '@deck.gl/layers';
import mapboxgl from 'mapbox-gl';
import { IconSatellite, IconMap } from '@tabler/icons-react';
import effortMapData from '../../data/effort-map.json';
import palmaAreaRaw from '../../data/palma_area.geojson?url';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  TIME_BREAKS,
  // COLOR_RANGE,
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

// Utility functions
// const calculateStats = data => {
//   const totalVisits = data.reduce((sum, d) => sum + (d.totalVisits || 0), 0);
//   const avgTime = data.reduce((sum, d) => sum + (d.avgTimeHours || 0), 0) / data.length;
//   const maxTime = Math.max(...data.map(d => d.avgTimeHours || 0));
//   const avgSpeed = data.reduce((sum, d) => sum + (d.avgSpeed || 0), 0) / data.length;

//   return {
//     totalVisits: totalVisits.toLocaleString(),
//     avgTime: avgTime.toFixed(1),
//     maxTime: maxTime.toFixed(1),
//     gridCells: data.length.toLocaleString(),
//     avgSpeed: avgSpeed.toFixed(1),
//   };
// };

// const getColorForValue = value => {
//   for (let i = TIME_BREAKS.length - 1; i >= 0; i--) {
//     const range = TIME_BREAKS[i];
//     if (value >= range.min && (range.max === Infinity ? true : value < range.max)) {
//       return i;
//     }
//   }
//   return 0;
// };

// Memoized components with prop types
/** @type {React.FC<{ theme: string, isSatellite: boolean, onToggle: () => void }>} */
// const MapStyleToggle = memo(({ theme, isSatellite, onToggle }) => (
//   <button
//     onClick={onToggle}
//     title={isSatellite ? 'Switch to standard view' : 'Switch to satellite view'}
//     style={{
//       position: 'absolute',
//       top: 20,
//       right: 20,
//       width: '40px',
//       height: '40px',
//       padding: '8px',
//       ...SHARED_STYLES.glassPanel(theme),
//       border: 'none',
//       cursor: 'pointer',
//       zIndex: 1,
//       display: 'flex',
//       alignItems: 'center',
//       justifyContent: 'center',
//       transition: SHARED_STYLES.transitions.default,
//       transform: 'none',
//       backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.7)' : 'rgba(255, 255, 255, 0.7)',
//     }}
//     onMouseEnter={e => {
//       e.currentTarget.style.transform = 'translateY(-1px)';
//       e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)';
//     }}
//     onMouseLeave={e => {
//       e.currentTarget.style.transform = 'none';
//       e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(31, 41, 55, 0.7)' : 'rgba(255, 255, 255, 0.7)';
//     }}
//   >
//     {isSatellite ? <IconMap size={24} stroke={1.5} /> : <IconSatellite size={24} stroke={1.5} />}
//   </button>
// ));

/** @type {React.FC<{ range: any, index: number, isSelected: boolean, colorRange: number[][], theme: string, onToggle: (range: any) => void }>} */
// const TimeRangeButton = memo(({ range, index, isSelected, colorRange, theme, onToggle }) => (
//   <div
//     onClick={() => onToggle(range)}
//     style={{
//       display: 'flex',
//       alignItems: 'center',
//       padding: '4px 8px',
//       cursor: 'pointer',
//       backgroundColor: isSelected
//         ? theme === 'dark'
//           ? 'rgba(59, 130, 246, 0.15)'
//           : 'rgba(59, 130, 246, 0.1)'
//         : 'transparent',
//       borderRadius: '4px',
//       opacity: isSelected ? 1 : 0.6,
//       transition: SHARED_STYLES.transitions.default,
//     }}
//   >
//     <div
//       style={{
//         width: '10px',
//         height: '10px',
//         backgroundColor: `rgb(${colorRange[index].join(',')})`,
//         marginRight: '6px',
//         borderRadius: '2px',
//       }}
//     />
//     <span
//       style={{
//         fontSize: '12px',
//         color: theme === 'dark' ? '#ffffff' : '#000000',
//       }}
//     >
//       {range.label}
//     </span>
//   </div>
// ));

// const labelStyle = (theme) => ({
//   color: theme === 'dark' ? '#94a3b8' : '#475569',
//   fontSize: '12px',
//   textTransform: /** @type {const} */ ('uppercase'),
//   letterSpacing: '0.05em',
//   marginBottom: '8px',
// });

/** @type {React.FC<{ theme: string, data: any[], colorRange: number[][], selectedRanges: any[], onRangeToggle: (range: any) => void }>} */
// const InfoPanel = memo(({ theme, data, colorRange, selectedRanges, onRangeToggle }) => {
//   const stats = useMemo(() => calculateStats(data), [data]);

//   return (
//     <div
//       style={{
//         position: 'absolute',
//         top: 20,
//         left: 20,
//         padding: '16px',
//         width: '380px',
//         zIndex: 1,
//         ...SHARED_STYLES.glassPanel(theme),
//       }}
//     >
//       <h3
//         style={{
//           margin: '0 0 16px 0',
//           ...SHARED_STYLES.text.heading(theme),
//         }}
//       >
//         Fishing Effort Distribution
//       </h3>

//       {/* Grid Info */}
//       <div
//         style={{
//           marginBottom: '20px',
//           padding: '8px 12px',
//           backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
//           borderRadius: '4px',
//           fontSize: '13px',
//         }}
//       >
//         <div style={{ marginBottom: '4px' }}>
//           <strong>Grid Resolution:</strong> 1 × 1 km
//         </div>
//         <div
//           style={{
//             color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
//             fontSize: '12px',
//             lineHeight: '1.4',
//           }}
//         >
//           Each cell represents a 1 square kilometer area where fishing activity has been recorded
//         </div>
//       </div>

//       {/* Color Scale Legend */}
//       <div style={{ marginBottom: '20px' }}>
//         <div style={labelStyle(theme)}>
//           AVERAGE TIME SPENT
//         </div>
//         <div
//           style={{
//             display: 'flex',
//             alignItems: 'center',
//             gap: '8px',
//             marginBottom: '8px',
//           }}
//         >
//           <div
//             style={{
//               height: '8px',
//               flex: 1,
//               background: `linear-gradient(to right, ${colorRange.map(c => `rgb(${c.join(',')})`).join(', ')})`,
//               borderRadius: '4px',
//             }}
//           />
//         </div>
//         <div
//           style={{
//             display: 'flex',
//             justifyContent: 'space-between',
//             color: theme === 'dark' ? '#94a3b8' : '#475569',
//             fontSize: '12px',
//           }}
//         >
//           <span>Fewer Hours</span>
//           <span>More Hours</span>
//         </div>
//       </div>

//       {/* Time Range Filters */}
//       <div style={{ marginBottom: '20px' }}>
//         <div style={labelStyle(theme)}>
//           TIME RANGES (select to filter)
//         </div>
//         <div
//           style={{
//             display: 'grid',
//             gridTemplateColumns: 'repeat(3, 1fr)',
//             gap: '4px',
//           }}
//         >
//           {TIME_BREAKS.map((range, i) => (
//             <TimeRangeButton
//               key={range.label}
//               range={range}
//               index={i}
//               isSelected={selectedRanges.some(r => r.min === range.min && r.max === range.max)}
//               colorRange={colorRange}
//               theme={theme}
//               onToggle={onRangeToggle}
//             />
//           ))}
//         </div>
//       </div>

//       {/* Statistics */}
//       <div
//         style={{
//           fontSize: '14px',
//           lineHeight: '1.6',
//           display: 'grid',
//           gap: '12px',
//         }}
//       >
//         <div>
//           <div style={labelStyle(theme)}>
//             ACTIVITY
//           </div>
//           <div>
//             <strong>{stats.totalVisits}</strong> total visits recorded
//           </div>
//           <div>
//             <strong>{stats.gridCells}</strong> active grid cells
//           </div>
//         </div>

//         <div>
//           <div style={labelStyle(theme)}>
//             TIME & SPEED
//           </div>
//           <div>
//             <strong>{stats.avgTime}h</strong> average time per visit
//           </div>
//           <div>
//             <strong>{stats.maxTime}h</strong> maximum time recorded
//           </div>
//           <div>
//             <strong>{stats.avgSpeed} km/h</strong> average speed
//           </div>
//         </div>

//         <div
//           style={{
//             marginTop: '8px',
//             paddingTop: '12px',
//             borderTop:
//               theme === 'dark'
//                 ? '1px solid rgba(156, 163, 175, 0.2)'
//                 : '1px solid rgba(107, 114, 128, 0.2)',
//             color: theme === 'dark' ? '#94a3b8' : '#475569',
//             fontSize: '12px',
//           }}
//         >
//           ⌘ + Drag to rotate view
//         </div>
//       </div>
//     </div>
//   );
// });

/** @type {React.FC<{ theme: string }>} */
const Map = memo(({ theme }) => {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [selectedRanges, setSelectedRanges] = useState(TIME_BREAKS);
  const [isSatellite, setIsSatellite] = useState(true);
  const [palmaArea, setPalmaArea] = useState(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  // Load GeoJSON data
  useEffect(() => {
    fetch(palmaAreaRaw)
      .then(response => response.json())
      .then(data => setPalmaArea(data))
      .catch(error => console.error('Error loading GeoJSON:', error));
  }, []);

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

  // Memoize handlers
  // const handleRangeToggle = useCallback(range => {
  //   setSelectedRanges(current => {
  //     const isSelected = current.some(r => r.min === range.min && r.max === range.max);
  //     if (isSelected) {
  //       return current.length === 1
  //         ? current
  //         : current.filter(r => r.min !== range.min || r.max !== range.max);
  //     }
  //     return [...current, range];
  //   });
  // }, []);

  // const handleViewStateChange = useCallback(({ viewState }) => {
  //   setViewState(viewState);
  // }, []);

  // const handleMapStyleToggle = useCallback(() => {
  //   setIsSatellite(prev => !prev);
  // }, []);

  // Memoize tooltip function
  const getTooltipContent = (info) => {
    if (!info.object) return null;
    
    if (info.layer.id === 'grid-layer') {
      return `Count: ${info.object.points.length}`;
    }
    
    if (info.layer.id === 'geojson-layer') {
      const { ADM2_PT, n_observations } = info.object.properties;
      return `${ADM2_PT}: ${n_observations} observations`;
    }
    
    return null;
  };

  // Memoize layers
  const layers = useMemo(() => {
    const filteredData = transformedData;
    
    return [
      new GeoJsonLayer({
        id: 'geojson-layer',
        data: palmaArea,
        pickable: true,
        stroked: true,
        filled: true,
        getFillColor: (feature) => {
          const count = feature.properties.n_observations;
          // Color gradient from blue (low) to red (high)
          return [
            Math.min(255, (count / 400) * 255), // Red component
            20,  // Green component
            Math.max(0, 255 - (count / 400) * 255), // Blue component
            180  // Alpha
          ];
        },
        getLineColor: [255, 255, 255, 100],
        lineWidthMinPixels: 1
      }),
      // new GridLayer({
      //   id: 'grid-layer',
      //   data: filteredData,
      //   pickable: true,
      //   extruded: true,
      //   getPosition: d => d.position,
      //   getElevationWeight: d => d.avgTimeHours,
      //   colorRange: COLOR_RANGE,
      //   ...GRID_LAYER_SETTINGS,
      //   colorScaleType: 'ordinal',
      //   colorDomain: [0, 1, 2, 3, 4, 5],
      //   getColorWeight: d => (d ? getColorForValue(d.avgTimeHours) : 0),
      //   updateTriggers: {
      //     getColorWeight: [selectedRanges],
      //   },
      // })
    ].filter(Boolean);
  }, [transformedData, selectedRanges, palmaArea]);

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
{/*       
      <button 
        className="btn btn-sm position-absolute top-0 end-0 m-2 z-10"
        style={{
          backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.7)',
          color: theme === 'dark' ? '#e2e8f0' : '#334155',
          border: theme === 'dark' ? '1px solid rgba(51, 65, 85, 0.5)' : '1px solid rgba(203, 213, 225, 0.5)',
          zIndex: 10,
        }}
        onClick={() => setShowInfoPanel(!showInfoPanel)}
      >
        {showInfoPanel ? 'Hide Info' : 'Show Info'}
      </button>

      {showInfoPanel && (
        <InfoPanel
          theme={theme}
          data={transformedData}
          colorRange={COLOR_RANGE}
          selectedRanges={selectedRanges}
          onRangeToggle={handleRangeToggle}
        />
      )} */}

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
      {/* <MapStyleToggle theme={theme} isSatellite={isSatellite} onToggle={handleMapStyleToggle} /> */}
    </div>
  );
});

export default Map;
