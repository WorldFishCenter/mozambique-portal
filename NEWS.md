# mozambique-portal 1.3.0

## New Features

### Interactive Map Control Panel
- **Geographic Indicators Panel**: New control panel for the map visualization
  - Dropdown selector to choose between 7 different metrics (Submissions, Fishers, CPUE, RPUE, Trip Duration, Mean Catch, Price per kg)
  - Dynamic metric descriptions that update based on selection
  - YlGnBu color scale legend showing value ranges
  - Glass-morphism design matching Tabler styling
  - Show/hide toggle for minimalist viewing experience
- **Dynamic Map Colors**: Map polygons now update colors based on selected metric
  - 6-step YlGnBu (Yellow-Green-Blue) color palette for clear visual distinction
  - Normalized color mapping based on metric-specific maximum values
  - Interactive tooltips displaying region name and selected metric value
- **Enhanced GeoJSON Data**:
  - New geo-indicators.geojson file with comprehensive regional statistics
  - 36,393 total submissions across Mocímboa (17,540) and Palma (18,853) regions
  - Complete polygon geometries with aggregated fishing metrics
---
# mozambique-portal 1.2.0

### Interactive Help System
- **InfoButton Component**: New reusable component providing contextual help for charts and tables
  - Instant-hover tooltips with no delay for better user experience
  - Semi-transparent design with backdrop blur effect (opacity: 0.9)
  - Full theme awareness supporting both light and dark modes
  - Custom positioning options (top, bottom, left, right, auto)
  - Consistent Tabler styling using card components
- **Chart Documentation**: Added info buttons to all chart and table headers
  - CPUE time series explanation in Catch dashboard
  - Catch rate heatmap explanation in Catch dashboard
  - RPUE time series explanation in Revenue dashboard
  - Revenue heatmap explanation in Revenue dashboard
  - Landing Sites Statistics table explanation in Home dashboard
  - Dynamic Fish Taxa Analysis explanation that changes based on active tab (Composition/Length)

## Improvements

### Theme Support
- **Enhanced Dark Mode**: Improved theme awareness across all composition charts
  - TaxaProportionsChart now uses theme-aware color palettes (30 colors per theme)
  - TaxaLengthChart stroke colors adapt to current theme
  - Tooltip styling automatically switches between light and dark themes using ApexCharts built-in feature
  - Color palettes optimized for contrast: brighter colors in dark mode, deeper colors in light mode
  - Eliminated hardcoded colors that were invisible in dark mode (e.g., #1e293b)

### Data Visualization
- **Time Series Charts**: Enhanced date axis formatting
  - Improved x-axis label consistency with multi-line year display
  - Better handling of month-year formatting for clearer temporal navigation
  - January labels now display both month and year below the month name

### User Interface
- **Better Visual Hierarchy**: Info buttons positioned consistently in card headers
- **Accessibility**: Added aria-labels to info button for screen reader support
- **Professional Tooltips**: Custom React-based tooltips replace native browser 

## Bug Fixes

### Visual
- Fixed dark mode color contrast issues in Taxa Proportions chart
- Fixed stroke colors not adapting to theme in Taxa Length boxplot chart
- Fixed tooltip styling inconsistency between light and dark themes


### Dependencies
- Updated TypeScript definitions for Bootstrap 5 popover functionality

## Technical

### New Components
- `src/components/common/InfoButton.jsx`: Reusable info button with custom tooltip
- `src/types/bootstrap.d.ts`: TypeScript definitions for Bootstrap components

---

# mozambique-portal 1.0.0

## New Features

### Interactive Data Visualization
- **Landing Sites Map**: Interactive map visualization with Deck.gl showing fishing effort and catch rates across Mozambique landing sites (Mocímboa, Palma)
- **CPUE Dashboard**: Comprehensive Catch Per Unit Effort analysis with time series and seasonal patterns
- **RPUE Dashboard**: Revenue Per Unit Effort tracking with multi-currency support (MZN, USD, EUR)
- **Gear & Habitat Analysis**: Treemap visualizations displaying catch rates by gear type and habitat combinations
- **Taxa Composition**: Interactive charts showing fish species distribution and catch proportions by landing site
- **Length Frequency Analysis**: Detailed length-frequency distributions for different fish taxa

### User Interface
- **Modern Design**: Clean, professional interface using Tabler UI framework
- **Theme Toggle**: Dark and light mode support for comfortable viewing in different conditions
- **Responsive Layout**: Fully responsive design optimized for desktop, tablet, and mobile devices
- **Interactive Charts**: ApexCharts-powered visualizations with tooltips, zoom, and export capabilities
- **Landing Site Selector**: Dropdown filter to view data by specific landing site or aggregated across all sites
- **Currency Converter**: Real-time currency conversion for revenue metrics (MZN ↔ USD ↔ EUR)

### Data Analytics
- **Time Series Analysis**: Monthly view with trend lines and percentage change indicators
- **Differenced View**: Statistical differencing for time series data to identify patterns
- **Seasonal Patterns**: Radar charts showing monthly median values across the calendar year
- **Statistical Indicators**: Automatic calculation of medians, trends, and comparative metrics
- **Heat-mapped Tables**: Color-coded data tables showing performance intensity across metrics
- **Sortable & Paginated Tables**: Advanced table functionality with sorting, pagination, and expand/collapse

### Technical Infrastructure
- **MongoDB Integration**: Cloud database connection for real-time data access
- **REST API**: Express.js backend serving fisheries data endpoints
- **Data Caching**: Intelligent caching system to optimize performance
- **Static Data Files**: Pre-processed JSON datasets for fast initial load
- **Error Boundaries**: Comprehensive error handling with user-friendly messages
- **Performance Optimization**: Memoized components and efficient data processing

### Map Features
- **Base Map**: Mapbox-powered base map with satellite imagery option
- **GPS Coordinates**: Precise landing site locations with GPS coordinates
- **Heat Layers**: Visual representation of fishing effort intensity
- **Statistics Popup**: Click landing sites to view detailed statistics
- **Zoom Controls**: Pan, zoom, and rotate map controls
- **Responsive Viewport**: Automatically adjusts to screen size

### Chart Components
- **Time Series Chart**: Line charts with monthly/yearly aggregation and null value handling
- **Seasonal Radar Chart**: 12-month circular visualization of seasonal patterns
- **Gear Metrics Treemap**: Hierarchical visualization of gear-habitat performance (units removed from frames per user request)
- **Taxa Proportions Chart**: Stacked bar charts showing species composition
- **Taxa Length Chart**: Histogram visualization of fish length frequencies
- **Interactive Legends**: Click-to-filter legend functionality

## Improvements

### Performance
- Optimized rendering with React.memo for expensive components
- Efficient data processing with memoized calculations
- Lazy loading of chart components
- Reduced bundle size through code splitting
- Caching layer for API requests (5-minute TTL)
- Maximum cache size limits to prevent memory issues

### Data Quality
- Null value handling throughout the application
- Data validation on API endpoints
- Type checking for numeric values
- Date format standardization
- Filtering of invalid or missing data points
- Statistical validation (n > 0 checks)

### User Experience
- Loading spinners during data fetch operations
- Error messages with actionable information
- Smooth animations and transitions
- Consistent color schemes across visualizations
- Accessible color palettes for color-blind users
- Keyboard navigation support

### Code Quality
- Consistent code formatting with Prettier
- ESLint configuration for code quality
- Modular component architecture
- Separation of concerns (services, utils, components)
- Comprehensive error logging
- Type hints and JSDoc comments

### Deployment
- Vercel-optimized configuration with serverless functions
- Environment variable management
- CORS configuration for cross-origin requests
- Production build optimizations
- Automatic deployments on git push
- Preview deployments for pull requests

## API Endpoints

### Health Check
- `GET /api/health`: Server status and database connectivity check
  - Returns: Service status, timestamp, environment, collection count
  - Used for: Monitoring and debugging

### CPUE Data
- `GET /api/cpue?landingSites=[...]`: Fetch catch per unit effort data
  - Parameters: Array of landing site names
  - Returns: Monthly CPUE records sorted by date
  - Validation: Landing sites must be in valid sites list

### Effort Map
- `GET /api/effort-map`: Retrieve fishing effort spatial data
  - Returns: GPS coordinates with effort intensity values
  - Used for: Map heat layer visualization

## Data Files

### Static JSON Datasets
- `monthly-metrics.json` (28K lines): Time series of catch and revenue metrics
- `gear-habitat-metrics.json` (849 lines): Gear-habitat performance data
- `sites-stats.json`: Landing site summary statistics
- `effort-map.json`: GPS-tagged fishing effort data
- `taxa-length.json`: Fish length frequency distributions
- `taxa-proportions.json`: Species composition data
- `taxa-sites.json`: Taxa presence by landing site
- `palma_area.geojson`: Geographic boundary data for Palma region

## Configuration

### Landing Sites
- Mocímboa da Praia
- Palma

### Metrics Tracked
- CPUE: Catch per unit effort (kg/fisher/hour)
- RPUE: Revenue per unit effort (MZN/fisher/hour)
- Trip Duration: Average fishing trip length (hours)
- Price per kg: Market value (MZN)
- Mean Catch: Average catch size (kg)
- Mean Catch Price: Average catch value (MZN)

### Currencies Supported
- MZN (Mozambican Metical) - Base currency
- USD (US Dollar) - Exchange rate: 0.016
- EUR (Euro) - Exchange rate: 0.015

## Dependencies

### Core
- React 18.2.0
- React Router DOM 6.22.1
- Express 4.21.2
- MongoDB 6.13.0

### Visualization
- ApexCharts 3.45.2
- Deck.gl 8.9.32
- Mapbox GL 2.15.0
- React ApexCharts 1.4.1

### UI Framework
- @tabler/core 1.4.0
- @tabler/icons-react 3.36.1
- @tanstack/react-table 8.21.2

### Build Tools
- Vite 5.1.4
- @vitejs/plugin-react 4.2.1
- Concurrently 8.2.2
- Nodemon 3.0.3

## Environment Variables

Required:
- `VITE_MONGODB_URI`: MongoDB Atlas connection string
- `VITE_MAPBOX_TOKEN`: Mapbox API access token
- `VITE_API_PORT`: Backend API port (default: 3001)
- `NODE_ENV`: Environment mode (development/production)

Optional:
- `PORT`: Custom port for backend server
- `VERCEL_URL`: Automatic in Vercel deployments

## Known Issues

None reported in this release.

## Breaking Changes

None - initial release.

## Migration Guide

Not applicable - initial release.

## Contributors

- WorldFish Center Data Team
- Peskas.timor Development Team
- Local Enumerators in Mozambique

## Acknowledgments

Special thanks to the fishing communities of Mocímboa da Praia and Palma for their participation and data contributions that make this platform possible.

---

**Release Date**: January 2026  
**Git Tag**: v1.0.0  
**Build**: Production-ready

