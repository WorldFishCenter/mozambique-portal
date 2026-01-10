# Mozambique Fisheries Data Portal

A data-driven web application for visualizing and analyzing artisanal fisheries data from Mozambique's coastal regions, with a focus on Cabo Delgado province.

## Version 1.0.0 - Latest Updates

### New Features
- **Interactive Landing Sites Map**: Visualize fishing activity across Mozambique landing sites with heat-mapped catch metrics
- **CPUE Analysis**: Catch per Unit Effort visualization with monthly and seasonal patterns
- **RPUE Tracking**: Revenue per Unit Effort with multi-currency support (MZN, USD, EUR)
- **Gear & Habitat Metrics**: Treemap visualizations showing catch rates by gear type and habitat
- **Taxa Composition**: Interactive charts showing fish species distribution and length frequencies
- **Real-time Data Updates**: Live data visualization with automatic refresh capabilities

### Improvements
- **Responsive Design**: Mobile-optimized interface using Tabler UI framework
- **Dark/Light Theme Support**: Toggle between themes for comfortable viewing
- **Advanced Filtering**: Filter data by landing site (Mocímboa, Palma) or view aggregated statistics
- **Statistical Analysis**: Median-based calculations with percentage change indicators
- **Performance Optimized**: Efficient data caching and processing for smooth interactions

## Features

- **Interactive Map Visualization**
  - Deck.gl-powered map with Mapbox integration
  - Heat-map overlay showing fishing effort and catch rates
  - Landing site statistics and GPS coordinates
  - Sortable data tables with pagination

- **Catch & Revenue Analytics**
  - Time series charts with monthly and differenced views
  - Seasonal pattern analysis using radar charts
  - Percentage change tracking between periods
  - Multi-site comparison capabilities

- **Gear and Habitat Analysis**
  - Treemap visualizations of gear-habitat combinations
  - CPUE and RPUE metrics by fishing method
  - Color-coded performance indicators

- **Fish Taxa Analysis**
  - Species composition by landing site
  - Length-frequency distributions
  - Catch proportions and trends

- **User Experience**
  - Dark/Light theme toggle
  - Responsive design for all screen sizes
  - Interactive tooltips and legends
  - Export-ready visualizations
  - Multi-language support capabilities

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB Atlas account (for database access)
- Mapbox API token (for map visualization)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/WorldFishCenter/mozambique-portal.git
   cd mozambique-portal
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Create a `.env` file in the root directory with the required environment variables:
   ```
   VITE_MONGODB_URI=your_mongodb_connection_string
   VITE_MAPBOX_TOKEN=your_mapbox_token
   VITE_API_PORT=3001
   NODE_ENV=development
   ```

### Running the Application

#### Development Mode

To run both the frontend and backend servers simultaneously:

```bash
npm run dev
```

This will:
- Start the frontend Vite server (on port 3000)
- Start the backend Express server (on port 3001)
- Show output from both servers with color-coded logs

#### Running Separately

If you prefer to run the servers separately:

1. Start the backend API server:
   ```bash
   npm run start-api
   ```

2. Start the frontend (in a separate terminal):
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000`.

### Available Scripts

- `npm start` - Run frontend development server on port 3000
- `npm run start-api` - Run backend API server on port 3001
- `npm run dev` - Run both frontend and backend concurrently
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Check code for linting errors
- `npm run lint:fix` - Automatically fix linting errors
- `npm run format` - Format code using Prettier
- `npm run clean` - Remove all build artifacts and node_modules

## Project Structure

```
mozambique-portal/
├── api/                      # Backend Express server
│   └── server.js            # API routes and MongoDB connection
├── src/
│   ├── components/
│   │   ├── charts/          # Chart components
│   │   │   ├── GearMetricsHeatmap.jsx    # Treemap for gear metrics
│   │   │   ├── Map.jsx                    # Deck.gl map component
│   │   │   ├── SeasonalChart.jsx          # Radar chart for seasons
│   │   │   ├── TaxaLengthChart.jsx        # Length frequency charts
│   │   │   ├── TaxaProportionsChart.jsx   # Species composition
│   │   │   └── TimeSeriesChart.jsx        # Time series visualizations
│   │   ├── layout/          # Layout components
│   │   │   ├── Header.jsx
│   │   │   ├── Navigation.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── Layout.jsx
│   │   └── pages/           # Main page components
│   │       ├── Home.jsx                   # Landing sites map & table
│   │       ├── Catch.jsx                  # CPUE analysis
│   │       ├── Revenue.jsx                # RPUE analysis
│   │       ├── Composition.jsx            # Taxa analysis
│   │       └── About.jsx                  # Project information
│   ├── constants/           # Configuration constants
│   │   ├── districts.js
│   │   ├── landingSites.js
│   │   └── mapConfig.js
│   ├── data/               # Static JSON data files
│   │   ├── effort-map.json
│   │   ├── gear-habitat-metrics.json
│   │   ├── monthly-metrics.json
│   │   ├── sites-stats.json
│   │   ├── taxa-length.json
│   │   └── taxa-proportions.json
│   ├── hooks/              # Custom React hooks
│   │   ├── useTheme.js
│   │   └── useTooltip.js
│   ├── services/           # Data service layer
│   │   └── dataService.js
│   ├── styles/             # CSS files
│   │   └── charts.css
│   ├── utils/              # Utility functions
│   │   ├── chartConfigs.js
│   │   ├── dataUtils.js
│   │   └── performance.js
│   ├── App.jsx             # Main application component
│   └── index.jsx           # Application entry point
├── public/
│   ├── tabler/             # Tabler UI framework assets
│   └── manifest.json
├── package.json
├── vite.config.js          # Vite configuration
└── vercel.json             # Vercel deployment configuration
```

## Data Architecture

### Data Sources

The application uses a combination of:
1. **MongoDB Atlas**: Cloud database storing time-series fisheries data
2. **Static JSON Files**: Pre-processed analytical datasets for performance
3. **REST API**: Express.js backend serving data endpoints

### Key Metrics

- **CPUE (Catch Per Unit Effort)**: Measured in kg/fisher/hour
- **RPUE (Revenue Per Unit Effort)**: Measured in MZN/fisher/hour (convertible to USD, EUR)
- **Trip Duration**: Average fishing trip length in hours
- **Price per kg**: Market value of catch in local currency
- **Landing Site Statistics**: Aggregated metrics by geographic location

### API Endpoints

- `GET /api/health` - Health check and database status
- `GET /api/cpue` - Fetch CPUE data by landing sites
- `GET /api/effort-map` - Retrieve effort mapping data

## Deployment

### Vercel Deployment (Recommended)

This application is optimized for deployment on Vercel:

1. **Connect Repository**:
   - Import the project in Vercel Dashboard
   - Connect to your GitHub repository

2. **Configure Environment Variables**:
   ```
   VITE_MONGODB_URI=your_mongodb_connection_string
   VITE_MAPBOX_TOKEN=your_mapbox_token
   NODE_ENV=production
   ```

3. **Build Settings** (auto-configured via `vercel.json`):
   - Build Command: `CI=false npm run build`
   - Output Directory: `build`
   - Install Command: `npm install --legacy-peer-deps`

4. **Deploy**:
   - Push to main branch for automatic deployment
   - Preview deployments for pull requests

The application uses:
- Vercel Serverless Functions for the backend API
- Vite build for optimized frontend assets
- Environment variables for secure configuration
- Automatic HTTPS and CDN distribution

### Alternative Deployment

The application can also be deployed to:
- **Netlify**: Configure build settings similarly to Vercel
- **AWS Amplify**: Use similar environment variables and build commands
- **Docker**: Create a Dockerfile for containerized deployment
- **Self-hosted**: Build and serve with Node.js + nginx

## Technology Stack

### Frontend
- **React 18.2** - UI framework
- **React Router 6** - Client-side routing
- **ApexCharts 3.45** - Interactive data visualizations
- **Deck.gl 8.9** - WebGL-powered map visualizations
- **Mapbox GL 2.15** - Base map tiles and controls
- **Tabler UI 1.4** - Modern UI component framework
- **TanStack Table 8** - Advanced table functionality
- **Vite 5.1** - Fast build tool and dev server

### Backend
- **Express 4.21** - Web application framework
- **MongoDB 6.13** - NoSQL database driver
- **CORS 2.8** - Cross-origin resource sharing
- **dotenv 16.4** - Environment variable management

### Development Tools
- **ESLint 8** - Code linting
- **Prettier 3** - Code formatting
- **Nodemon 3** - Auto-reload for development
- **Concurrently 8** - Run multiple processes

## Data Visualization Components

### Interactive Maps
- Heat-map layers showing fishing effort density
- Popup tooltips with site-specific statistics
- Zoom and pan controls
- Responsive viewport sizing

### Time Series Charts
- Line charts with smooth animations
- Monthly and differenced view modes
- Null value handling
- Responsive tooltips

### Seasonal Analysis
- Radar charts showing monthly patterns
- Median value calculations
- Comparative visualizations

### Treemap Visualizations
- Hierarchical data display
- Color-coded intensity
- Interactive legends
- Filterable by metric type

## Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow the existing code style
- Run `npm run lint:fix` before committing
- Use meaningful commit messages
- Add comments for complex logic
- Update documentation as needed

## License

This project is open source and available under the MIT License.

## Acknowledgments

- **WorldFish Center** - Project leadership and data collection
- **Peskas.timor Team** - Data processing pipeline and methodology
- **Local Enumerators** - On-the-ground data collection in Mozambique
- **Fishers and Communities** - Participation and data sharing

## Support

For questions, issues, or feature requests:
- Open an issue on GitHub
- Contact the WorldFish data team
- Visit the [WorldFish Center website](https://www.worldfishcenter.org)

## Roadmap

Future enhancements planned:
- [ ] Multi-language support (Portuguese, local languages)
- [ ] Export functionality for charts and data
- [ ] User authentication and personalized dashboards
- [ ] Advanced filtering and comparison tools
- [ ] Real-time data streaming from field devices
- [ ] Mobile application companion
- [ ] PDF report generation
- [ ] Integration with regional fisheries databases

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Maintainer**: WorldFish Center
