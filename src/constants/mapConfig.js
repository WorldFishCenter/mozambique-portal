// Time breaks for the map visualization
export const TIME_BREAKS = [
  { min: 0, max: 0.5, label: '0-0.5h' },
  { min: 0.5, max: 1, label: '0.5-1h' },
  { min: 1, max: 2, label: '1-2h' },
  { min: 2, max: 3, label: '2-3h' },
  { min: 3, max: 5, label: '3-5h' },
  { min: 5, max: Infinity, label: '>5h' },
];

// YlGnBu color scale
export const COLOR_RANGE = [
  [255, 255, 217], // 0-0.5h
  [237, 248, 177], // 0.5-1h
  [199, 233, 180], // 1-2h
  [127, 205, 187], // 2-3h
  [65, 182, 196], // 3-5h
  [29, 145, 192], // >5h
];

// Initial map view state
export const INITIAL_VIEW_STATE = {
  longitude: 32.58, // Maputo longitude
  latitude: -25.97, // Maputo latitude
  zoom: 8, // Reduced zoom level for better overview
  pitch: 45, // Add tilt to see 3D
  bearing: 10, // Slight rotation for better perspective
};

// Grid layer settings
export const GRID_LAYER_SETTINGS = {
  cellSize: 1000,
  opacity: 0.3,
  elevationAggregation: 'MEAN',
  elevationScale: 100,
  elevationRange: [0, 200],
  material: {
    ambient: 0.64,
    diffuse: 0.6,
    shininess: 32,
    specularColor: [51, 51, 51],
  },
};

// Shared style constants
export const SHARED_STYLES = {
  glassPanel: theme => ({
    backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.75)' : 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    borderRadius: '8px',
  }),
  text: {
    label: theme => ({
      color: theme === 'dark' ? '#9ca3af' : '#6b7280',
      fontSize: '12px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    }),
    heading: theme => ({
      color: theme === 'dark' ? '#ffffff' : '#000000',
      fontSize: '20px',
      fontWeight: 600,
    }),
  },
  transitions: {
    default: 'all 0.2s ease',
  },
};
