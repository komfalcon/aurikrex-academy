import { MongoClient, ServerApiVersion } from 'mongodb';
import dns from 'dns/promises';

// IMPORTANT: Use MONGO_URI environment variable instead of hardcoding credentials
const mongoUri = process.env.MONGO_URI || '';

if (!mongoUri) {
  console.error('❌ MONGO_URI environment variable is not set');
  console.error('Set MONGO_URI before running this test');
  process.exit(1);
}

console.log('🧪 MongoDB Connection Test');
console.log('='.repeat(60));
console.log('URI:', mongoUri.replace(/:[^:]*@/, ':****@'));

// Extract cluster hostname from SRV URI for DNS testing
const clusterMatch = mongoUri.match(/mongodb\+srv:\/\/[^@]+@([^/?]+)/);
const clusterHostname = clusterMatch ? clusterMatch[1] : null;

// Test DNS resolution first
console.log('\n1️⃣ Testing DNS SRV resolution...');
if (clusterHostname) {
  try {
    const addresses = await dns.resolveSrv(`_mongodb._tcp.${clusterHostname}`);
    console.log('✅ DNS SRV resolution successful!');
    addresses.slice(0, 2).forEach((addr, i) => {
      console.log(`   Server ${i + 1}: ${addr.name}:${addr.port}`);
    });
  } catch (err) {
    console.error('⚠️  DNS SRV resolution failed:', err.message);
    console.log('   This is a known issue on some networks. Attempting direct connection...\n');
  }
} else {
  console.log('⚠️  Skipping DNS SRV test - Non-SRV URI format');
}

// Try MongoDB connection
console.log('\n2️⃣ Testing MongoDB connection...');
try {
  const client = new MongoClient(mongoUri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: false,
      deprecationErrors: true,
    },
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 15000,
    retryWrites: true,
    retryReads: true,
  });

  const start = Date.now();
  await client.connect();
  const connectTime = Date.now() - start;

  // Ping the database
  const pingStart = Date.now();
  await client.db('admin').command({ ping: 1 });
  const pingTime = Date.now() - pingStart;

  console.log('✅ MongoDB connection successful!');
  console.log(`   Connection time: ${connectTime}ms`);
  console.log(`   Ping latency: ${pingTime}ms`);

  // Get database info
  const adminDb = client.db('admin');
  const serverStatus = await adminDb.command({ serverStatus: 1 });
  console.log(`   Server: ${serverStatus.host}`);
  console.log(`   Version: ${serverStatus.version}`);
  console.log(`   Uptime: ${serverStatus.uptime}s`);

  // List collections in aurikrex-academy database
  const db = client.db('aurikrex-academy');
  const collections = await db.listCollections().toArray();
  console.log(`   Collections in 'aurikrex-academy': ${collections.length}`);
  if (collections.length > 0) {
    collections.slice(0, 5).forEach(col => {
      console.log(`     - ${col.name}`);
    });
    if (collections.length > 5) console.log(`     ... and ${collections.length - 5} more`);
  }

  await client.close();
  console.log('\n✅ All tests passed! MongoDB is accessible.');
  process.exit(0);
} catch (err) {
  console.error('❌ MongoDB connection failed:');
  if (err instanceof Error) {
    console.error(`   Error: ${err.message}`);
    if (err.cause) console.error(`   Cause: ${err.cause}`);
  }
  if (typeof err === 'object' && err !== null) {
    if (err.code) console.error(`   Code: ${err.code}`);
    if (err.codeName) console.error(`   Code Name: ${err.codeName}`);
  }
  
  console.log('\n💡 Troubleshooting:');
  console.log('   1. Check if MongoDB Atlas cluster is running');
  console.log('   2. Verify IP whitelist includes your current IP');
  console.log('   3. Confirm credentials in .env file');
  console.log('   4. Check network connectivity to MongoDB Atlas');
  
  process.exit(1);
}
