const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Load environment variables, trying different .env files in order
const envFiles = ['.env.development', '.env.production', '.env'];
for (const envFile of envFiles) {
  const envPath = path.join(__dirname, '..', envFile);
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log(`Loaded environment from ${envFile}`);
    break;
  }
}

// MongoDB configuration
const MONGODB_URI = process.env.REACT_APP_MONGODB_URI || process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Error: Neither REACT_APP_MONGODB_URI nor MONGODB_URI environment variable is set');
  process.exit(1);
}

const DB_NAME = 'mozambique-dev';

// Define collections to export
const COLLECTIONS_TO_EXPORT = [
  {
    name: 'monthly-metrics',
    query: { type: { $ne: "metadata" } },  // Exclude metadata documents
    filename: 'monthly-metrics.json'
  },
  {
    name: 'sites-stats',
    query: {},
    filename: 'sites-stats.json'
  },
  {
    name: 'taxa-length',
    query: {},
    filename: 'taxa-length.json'
  },
  {
    name: 'taxa-sites',
    query: {},
    filename: 'taxa-sites.json'
  },
  {
    name: 'gear_habitat_metrics',
    query: { type: { $ne: "metadata" } },  // Exclude metadata documents
    filename: 'gear-habitat-metrics.json'
  },
  {
    name: 'surveys-gps',
    query: {},
    filename: 'surveys-gps.json'
  }
];

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

async function exportCollection(db, collectionConfig) {
  console.log(`Exporting ${collectionConfig.name} data...`);
  const collection = db.collection(collectionConfig.name);
  const data = await collection.find(collectionConfig.query).toArray();
  
  // Write the data file
  fs.writeFileSync(
    path.join(DATA_DIR, collectionConfig.filename),
    JSON.stringify(data, null, 2)
  );
  console.log(`Exported ${data.length} records from ${collectionConfig.name}`);
  return data.length;
}

async function exportData() {
  console.log('Using MongoDB URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//<username>:<password>@'));
  const client = new MongoClient(MONGODB_URI, {
    ssl: true,
    tls: true,
    tlsAllowInvalidCertificates: false,
    tlsAllowInvalidHostnames: false,
    retryWrites: true,
    w: 'majority',
    maxPoolSize: 1,
    minPoolSize: 1,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 30000,
    serverSelectionTimeoutMS: 30000
  });

  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    const db = client.db(DB_NAME);

    // Export all collections
    for (const collectionConfig of COLLECTIONS_TO_EXPORT) {
      await exportCollection(db, collectionConfig);
    }

    console.log('Data export completed successfully!');
  } catch (error) {
    console.error('Error exporting data:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run export if called directly
if (require.main === module) {
  exportData();
} 