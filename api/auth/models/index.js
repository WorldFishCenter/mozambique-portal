/**
 * Database Models Index
 * Initializes and exports all authentication models
 */

const User = require('./User');
const Session = require('./Session');
const PasswordReset = require('./PasswordReset');

/**
 * Initialize all authentication models
 * @param {Object} db - MongoDB database instance
 * @returns {Object} Initialized models
 */
function initializeModels(db) {
  const models = {
    User: new User(db),
    Session: new Session(db),
    PasswordReset: new PasswordReset(db),
  };

  console.log('Authentication models initialized successfully');
  return models;
}

/**
 * Setup database collections and indexes
 * @param {Object} db - MongoDB database instance
 * @returns {Promise<void>}
 */
async function setupDatabase(db) {
  try {
    console.log('Setting up authentication database...');
    
    // Initialize models (this will create indexes)
    const models = initializeModels(db);
    
    // Verify collections exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    
    console.log('Available collections:', collectionNames);
    
    // Create collections if they don't exist
    const requiredCollections = ['users', 'user_sessions', 'password_resets'];
    
    for (const collectionName of requiredCollections) {
      if (!collectionNames.includes(collectionName)) {
        await db.createCollection(collectionName);
        console.log(`Created collection: ${collectionName}`);
      }
    }
    
    console.log('Authentication database setup completed successfully');
    return models;
    
  } catch (error) {
    console.error('Error setting up authentication database:', error);
    throw error;
  }
}

/**
 * Cleanup expired data from all collections
 * @param {Object} models - Initialized models
 * @returns {Promise<Object>} Cleanup results
 */
async function cleanupExpiredData(models) {
  try {
    console.log('Starting cleanup of expired authentication data...');
    
    const results = await Promise.all([
      models.Session.cleanupExpired(),
      models.PasswordReset.cleanupExpired(),
    ]);
    
    const cleanupResults = {
      sessionsDeleted: results[0].deletedCount || 0,
      passwordResetsDeleted: results[1].deletedCount || 0,
      timestamp: new Date(),
    };
    
    console.log('Cleanup completed:', cleanupResults);
    return cleanupResults;
    
  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
}

/**
 * Get database health status
 * @param {Object} db - MongoDB database instance
 * @returns {Promise<Object>} Health status
 */
async function getDatabaseHealth(db) {
  try {
    const collections = await db.listCollections().toArray();
    const stats = await Promise.all([
      db.collection('users').countDocuments(),
      db.collection('user_sessions').countDocuments({ isActive: true }),
      db.collection('password_resets').countDocuments({ used: false }),
    ]);
    
    return {
      status: 'healthy',
      collections: collections.length,
      users: stats[0],
      activeSessions: stats[1],
      pendingResets: stats[2],
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date(),
    };
  }
}

module.exports = {
  User,
  Session,
  PasswordReset,
  initializeModels,
  setupDatabase,
  cleanupExpiredData,
  getDatabaseHealth,
};