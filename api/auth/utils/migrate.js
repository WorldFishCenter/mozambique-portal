/**
 * Database Migration Script
 * Sets up authentication collections and indexes
 */

const { MongoClient } = require('mongodb');
const { setupDatabase, getDatabaseHealth } = require('../models');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

/**
 * Run database migration
 */
async function runMigration() {
  let client;
  
  try {
    console.log('Starting authentication database migration...');
    
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    
    console.log('Connecting to MongoDB...');
    client = await MongoClient.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    const db = client.db('mozambique-dev');
    console.log('Connected to database: mozambique-dev');
    
    // Setup authentication database
    const models = await setupDatabase(db);
    
    // Verify setup
    const health = await getDatabaseHealth(db);
    console.log('Database health check:', health);
    
    // Test basic operations
    console.log('Testing basic model operations...');
    
    // Test user validation
    const userValidation = models.User.validateUserData({
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPassword123'
    });
    console.log('User validation test:', userValidation.isValid ? 'PASSED' : 'FAILED');
    
    // Test session token generation
    const sessionToken = models.Session.generateToken();
    console.log('Session token generation test:', sessionToken ? 'PASSED' : 'FAILED');
    
    // Test password reset token generation
    const resetToken = models.PasswordReset.generateUrlSafeToken();
    console.log('Reset token generation test:', resetToken ? 'PASSED' : 'FAILED');
    
    console.log('✅ Authentication database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('Database connection closed');
    }
  }
}

/**
 * Rollback migration (for development)
 */
async function rollbackMigration() {
  let client;
  
  try {
    console.log('Starting authentication database rollback...');
    
    const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    
    client = await MongoClient.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    const db = client.db('mozambique-dev');
    
    // Drop authentication collections
    const collections = ['users', 'user_sessions', 'password_resets'];
    
    for (const collectionName of collections) {
      try {
        await db.collection(collectionName).drop();
        console.log(`Dropped collection: ${collectionName}`);
      } catch (error) {
        if (error.code === 26) {
          console.log(`Collection ${collectionName} does not exist, skipping...`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('✅ Authentication database rollback completed successfully!');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'up':
      runMigration();
      break;
    case 'down':
      rollbackMigration();
      break;
    default:
      console.log('Usage: node migrate.js [up|down]');
      console.log('  up   - Run migration (setup database)');
      console.log('  down - Rollback migration (drop collections)');
      process.exit(1);
  }
}

module.exports = {
  runMigration,
  rollbackMigration,
};