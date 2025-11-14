import { MongoClient, ServerApiVersion } from 'mongodb';

const mongoUri = 'mongodb+srv://moparaji57_db_user:bcGb5OueuJ0LEPqW@cluster0.sknrqn8.mongodb.net/aurikrex-academy?retryWrites=true&w=majority';

console.log('🧪 MongoDB Alternative Connection Tests\n');
console.log('Testing various connection approaches...\n');

// Test 1: IPv4 only
console.log('Test 1: IPv4-only connection...');
try {
  const clientIPv4 = new MongoClient(mongoUri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: false,
      deprecationErrors: true,
    },
    family: 4, // Force IPv4 only
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 15000,
    retryWrites: true,
  });

  const startIPv4 = Date.now();
  await clientIPv4.connect();
  console.log(`✅ IPv4-only connection successful! (${Date.now() - startIPv4}ms)`);
  await clientIPv4.close();
} catch (err) {
  console.log(`⚠️  IPv4-only connection failed: ${err.message.substring(0, 100)}`);
}

// Test 2: Direct connection (non-SRV)
const directUri = 'mongodb://ac-wsdrggj-shard-00-02.sknrqn8.mongodb.net:27017,ac-wsdrggj-shard-00-01.sknrqn8.mongodb.net:27017/?authSource=admin';
const directUriWithAuth = `mongodb://moparaji57_db_user:bcGb5OueuJ0LEPqW@ac-wsdrggj-shard-00-02.sknrqn8.mongodb.net:27017,ac-wsdrggj-shard-00-01.sknrqn8.mongodb.net:27017/aurikrex-academy?authSource=admin&retryWrites=true`;

console.log('\nTest 2: Direct connection (non-SRV)...');
try {
  const clientDirect = new MongoClient(directUriWithAuth, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: false,
      deprecationErrors: true,
    },
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 15000,
    retryWrites: true,
  });

  const startDirect = Date.now();
  await clientDirect.connect();
  console.log(`✅ Direct connection successful! (${Date.now() - startDirect}ms)`);
  await clientDirect.close();
} catch (err) {
  console.log(`⚠️  Direct connection failed: ${err.message.substring(0, 100)}`);
}

// Test 3: Connection with longer timeout
console.log('\nTest 3: SRV with extended timeout (30s)...');
try {
  const clientLongTimeout = new MongoClient(mongoUri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: false,
      deprecationErrors: true,
    },
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 30000, // 30 seconds
    socketTimeoutMS: 45000,
    retryWrites: true,
  });

  const startLong = Date.now();
  await clientLongTimeout.connect();
  console.log(`✅ Extended timeout connection successful! (${Date.now() - startLong}ms)`);
  await clientLongTimeout.close();
} catch (err) {
  console.log(`⚠️  Extended timeout failed: ${err.message.substring(0, 100)}`);
}

console.log('\n' + '='.repeat(60));
console.log('Summary: All connection methods require IP whitelist');
console.log('Action: Add your IP to MongoDB Atlas Network Access');
console.log('='.repeat(60));
