/**
 * MongoDB Connection Test Script
 * 
 * This script tests your MongoDB Atlas connection and helps diagnose issues.
 * 
 * Usage:
 *   node test-mongo-connection.js
 * 
 * Prerequisites:
 *   - .env file must exist with MONGO_URI set
 *   - mongodb package must be installed
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.MONGO_DB_NAME || 'aurikrex-academy';

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     MongoDB Atlas Connection Test                         ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Step 1: Check if MONGO_URI is set
console.log('📋 Step 1: Checking environment configuration...');
if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not set in .env file');
  console.error('\n💡 Solution:');
  console.error('   1. Make sure .env file exists in aurikrex-backend/');
  console.error('   2. Copy from .env.example if needed: cp .env.example .env');
  console.error('   3. Set MONGO_URI with your MongoDB Atlas credentials');
  console.error('\n📖 See MONGODB_TROUBLESHOOTING.md for detailed help\n');
  process.exit(1);
}

// Mask credentials in output
const maskCredentials = (uri) => {
  try {
    const url = new URL(uri.replace('mongodb+srv://', 'https://').replace('mongodb://', 'http://'));
    const username = url.username || 'unknown';
    const host = url.hostname;
    return {
      username,
      host,
      masked: `mongodb+srv://${username}:****@${host}/...`
    };
  } catch (e) {
    return {
      username: 'unknown',
      host: 'unknown',
      masked: 'Invalid URI format'
    };
  }
};

const uriInfo = maskCredentials(MONGO_URI);
console.log('✅ MONGO_URI is set');
console.log(`   URI: ${uriInfo.masked}`);
console.log(`   Database: ${DB_NAME}`);
console.log(`   Username: ${uriInfo.username}`);
console.log(`   Host: ${uriInfo.host}\n`);

// Step 2: Test connection
console.log('📋 Step 2: Testing MongoDB connection...');
console.log('⏳ Attempting to connect (timeout: 10 seconds)...\n');

const client = new MongoClient(MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
});

async function testConnection() {
  const startTime = Date.now();
  
  try {
    // Connect to MongoDB
    await client.connect();
    const connectTime = Date.now() - startTime;
    console.log(`✅ Connected successfully in ${connectTime}ms\n`);
    
    // Step 3: Test ping
    console.log('📋 Step 3: Testing database ping...');
    const pingStart = Date.now();
    await client.db('admin').command({ ping: 1 });
    const pingTime = Date.now() - pingStart;
    console.log(`✅ Ping successful (${pingTime}ms)\n`);
    
    // Step 4: List databases
    console.log('📋 Step 4: Listing available databases...');
    const adminDb = client.db().admin();
    const { databases } = await adminDb.listDatabases();
    console.log(`✅ Found ${databases.length} database(s):`);
    databases.forEach(db => {
      const marker = db.name === DB_NAME ? '→' : ' ';
      console.log(`   ${marker} ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    // Step 5: Check target database
    console.log(`\n📋 Step 5: Checking target database "${DB_NAME}"...`);
    const targetDb = client.db(DB_NAME);
    const collections = await targetDb.listCollections().toArray();
    console.log(`✅ Database exists with ${collections.length} collection(s):`);
    if (collections.length > 0) {
      collections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
    } else {
      console.log('   (No collections yet - will be created when you add data)');
    }
    
    // Success summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  🎉 CONNECTION TEST PASSED                                ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('\n✅ Your MongoDB connection is working correctly!');
    console.log('✅ You can now run: npm run dev\n');
    
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`❌ Connection failed after ${elapsed}ms\n`);
    
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  ❌ CONNECTION TEST FAILED                                ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    console.error('Error Details:');
    console.error(`   Type: ${error.name}`);
    console.error(`   Message: ${error.message}\n`);
    
    // Provide specific troubleshooting advice based on error type
    if (error.message.includes('Server selection timed out')) {
      console.log('💡 This error usually means:');
      console.log('   1. Your IP address is not whitelisted in MongoDB Atlas');
      console.log('   2. Your firewall is blocking the connection');
      console.log('   3. VPN might be interfering\n');
      console.log('🔧 Quick fix:');
      console.log('   1. Go to https://cloud.mongodb.com/');
      console.log('   2. Select your project');
      console.log('   3. Go to Network Access');
      console.log('   4. Click "Add IP Address"');
      console.log('   5. Click "Add Current IP Address"\n');
      
    } else if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
      console.log('💡 This error means your credentials are incorrect\n');
      console.log('🔧 To reset your password:');
      console.log('   1. Go to https://cloud.mongodb.com/');
      console.log('   2. Select your project');
      console.log('   3. Go to Database Access');
      console.log('   4. Click Edit on your user');
      console.log('   5. Click "Edit Password"');
      console.log('   6. Generate or set a new password');
      console.log('   7. Update MONGO_URI in your .env file\n');
      console.log('⚠️  Remember: URL-encode special characters in your password!');
      console.log('   @ → %40, : → %3A, / → %2F, ? → %3F, # → %23\n');
      
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('💡 This error means the MongoDB host could not be found\n');
      console.log('🔧 Check:');
      console.log('   1. Your connection string format is correct');
      console.log('   2. The cluster hostname matches your MongoDB Atlas cluster');
      console.log('   3. Your DNS is working (try: ping 8.8.8.8)\n');
      
    } else {
      console.log('💡 Unknown error type\n');
    }
    
    console.log('📖 For detailed troubleshooting, see: MONGODB_TROUBLESHOOTING.md');
    console.log('🆘 Or visit: https://docs.atlas.mongodb.com/troubleshoot-connection/\n');
    
    process.exit(1);
    
  } finally {
    await client.close();
  }
}

// Run the test
testConnection().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
