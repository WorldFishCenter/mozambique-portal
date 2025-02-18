const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

// Initialize express app
const app = express();

// MongoDB connection
let cachedDb = null;
const connectToDatabase = async () => {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    const MONGODB_URI = process.env.VITE_MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('VITE_MONGODB_URI is not defined');
    }

    console.log('Connecting to MongoDB...'); // Debug log

    const client = await MongoClient.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10
    });

    const db = client.db('mozambique-dev');
    cachedDb = db;
    
    console.log('Successfully connected to MongoDB'); // Debug log
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('Unable to connect to database');
  }
};

// Valid landing sites list
const VALID_LANDING_SITES = [
  'bwawani', 'chole', 'chwaka', 'fumba', 'jambiani', 'jasini',
  'kigombe', 'kizimkazi', 'kukuu', 'mangapwani', 'matemwe', 'mazizini',
  'mkinga', 'mkoani', 'mkokotoni', 'mkumbuu', 'moa', 'msuka',
  'mtangani', 'mvumoni_furaha', 'ndumbani', 'nungwi', 'other_site', 'sahare',
  'shumba_mjini', 'tanga', 'tongoni', 'wesha', 'wete'
];

// CORS configuration
const getCorsOrigins = () => {
  if (process.env.NODE_ENV === 'production') {
    const origins = [
      'https://worldfishcenter.github.io'
    ];
    
    // Add Vercel deployment URL if available
    if (process.env.VERCEL_URL) {
      origins.push(`https://${process.env.VERCEL_URL}`);
    }
    
    // Allow all Vercel preview deployments
    origins.push(/\.vercel\.app$/);
    
    return origins;
  }
  
  return 'http://localhost:3000'; // Development
};

const corsOptions = {
  origin: getCorsOrigins(),
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const collections = await db.listCollections().toArray();
    
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: {
        connected: true,
        collections: collections.length
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ 
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Service temporarily unavailable'
    });
  }
});

// CPUE data endpoint
app.get('/api/cpue', async (req, res) => {
  try {
    const { landingSites } = req.query;
    
    // Validate input
    let sites;
    try {
      sites = JSON.parse(landingSites);
      if (!Array.isArray(sites)) {
        return res.status(400).json({ 
          error: 'Invalid request',
          message: 'Landing sites must be an array'
        });
      }
    } catch (error) {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'Invalid landing sites format'
      });
    }
    
    // Validate landing sites
    const validSites = sites.filter(site => VALID_LANDING_SITES.includes(site));
    if (validSites.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'No valid landing sites provided'
      });
    }

    // Get database connection
    const db = await connectToDatabase();
    const collection = db.collection('monthly-cpue');

    // Execute query
    const data = await collection
      .find({ landing_site: { $in: validSites } })
      .sort({ month_date: 1 })
      .toArray();

    // Transform and validate data
    const transformedData = data.map(record => ({
      _id: record._id,
      landing_site: record.landing_site,
      month_date: record.month_date,
      cpue: typeof record.cpue === 'number' ? record.cpue : null,
      catch: typeof record.catch === 'number' ? record.catch : null
    }));
    
    res.json(transformedData);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

// Effort map data endpoint
app.get('/api/effort-map', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('effort-map');

    // Execute query
    const data = await collection.find({}).toArray();

    res.json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

// Export the Express API
module.exports = app;

// Start the server if this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  const server = app.listen(PORT, () => {
    console.log(`API Server running on http://localhost:${PORT}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please free up the port and try again.`);
      process.exit(1);
    } else {
      console.error('Server error:', error);
      process.exit(1);
    }
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
} 