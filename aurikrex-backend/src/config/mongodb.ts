import { MongoClient, Db, MongoClientOptions } from 'mongodb';
import { config } from 'dotenv';
import { log } from '../utils/logger.js';

// Load environment variables
config();

interface MongoDBConfig {
  uri: string;
  dbName: string;
  options: MongoClientOptions;
}

class MongoDB {
  private static instance: MongoDB | null = null;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;

  private constructor() {}

  public static getInstance(): MongoDB {
    if (!MongoDB.instance) {
      MongoDB.instance = new MongoDB();
    }
    return MongoDB.instance;
  }

  private getConfig(): MongoDBConfig {
    const uri = process.env.MONGO_URI;
    
    if (!uri) {
      const errorMsg = 'MONGO_URI environment variable is not set. Please check your .env file.';
      console.error('❌ Configuration Error:', errorMsg);
      console.error('💡 Hint: Copy .env.example to .env and update the MONGO_URI value');
      throw new Error(errorMsg);
    }

    // Validate URI format
    if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
      const errorMsg = 'MONGO_URI must start with mongodb:// or mongodb+srv://';
      console.error('❌ Configuration Error:', errorMsg);
      console.error('💡 Current URI format:', uri.substring(0, 20) + '...');
      throw new Error(errorMsg);
    }

    // Extract database name from URI or use default
    const dbName = process.env.MONGO_DB_NAME || 'aurikrex-academy';

    const options: MongoClientOptions = {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 30000,  // Increased to 30s for MongoDB Atlas reliability
      socketTimeoutMS: 45000,
      retryWrites: true,
      retryReads: true,
    };

    return { uri, dbName, options };
  }

  public async connect(): Promise<void> {
    if (this.connectionStatus === 'connected' && this.client && this.db) {
      log.info('✅ MongoDB already connected');
      return;
    }

    if (this.connectionStatus === 'connecting') {
      log.info('⏳ MongoDB connection in progress...');
      return;
    }

    try {
      this.connectionStatus = 'connecting';
      const config = this.getConfig();

      // Extract host information for better diagnostics (without exposing credentials)
      let hostInfo = 'MongoDB';
      try {
        const url = new URL(config.uri.replace('mongodb+srv://', 'https://').replace('mongodb://', 'http://'));
        hostInfo = url.hostname;
      } catch (e) {
        // Ignore URL parsing errors
      }

      log.info('🔌 Connecting to MongoDB Atlas...', {
        dbName: config.dbName,
        host: hostInfo,
        attempt: this.reconnectAttempts + 1,
        maxAttempts: this.maxReconnectAttempts,
        timeout: `${config.options.serverSelectionTimeoutMS}ms`
      });

      console.log(`🔌 Attempting MongoDB connection (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);
      console.log(`  Database: ${config.dbName}`);
      console.log(`  Host: ${hostInfo}`);
      console.log(`  Timeout: ${config.options.serverSelectionTimeoutMS}ms`);

      this.client = new MongoClient(config.uri, config.options);
      await this.client.connect();

      // Verify connection
      await this.client.db('admin').command({ ping: 1 });
      
      this.db = this.client.db(config.dbName);
      this.connectionStatus = 'connected';
      this.reconnectAttempts = 0;

      log.info('✅ MongoDB Atlas connected successfully', {
        dbName: config.dbName,
        collections: await this.db.listCollections().toArray().then(cols => cols.map(c => c.name))
      });

      // Setup cleanup handlers
      this.setupCleanup();
    } catch (error) {
      this.connectionStatus = 'error';
      this.reconnectAttempts++;
      
      // Enhanced error logging with more details
      const errorDetails: any = {
        message: error instanceof Error ? error.message : String(error),
        attempt: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts
      };

      // Add MongoDB-specific error details if available
      if (error && typeof error === 'object') {
        const mongoError = error as any;
        if (mongoError.code) errorDetails.code = mongoError.code;
        if (mongoError.codeName) errorDetails.codeName = mongoError.codeName;
        if (mongoError.cause) errorDetails.cause = mongoError.cause;
        if (mongoError.name) errorDetails.name = mongoError.name;
      }

      // Include stack trace for debugging
      if (error instanceof Error && error.stack) {
        errorDetails.stack = error.stack;
      }

      log.error('❌ MongoDB connection failed', errorDetails);

      // Also log to console for immediate visibility during development
      console.error('❌ MongoDB Connection Error Details:');
      console.error('  Message:', errorDetails.message);
      console.error('  Attempt:', `${errorDetails.attempt}/${errorDetails.maxAttempts}`);
      if (errorDetails.code) console.error('  Error Code:', errorDetails.code);
      if (errorDetails.codeName) console.error('  Error Name:', errorDetails.codeName);
      if (errorDetails.cause) console.error('  Root Cause:', errorDetails.cause);
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        log.info(`🔄 Retrying connection in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.connect();
      }

      // All retries exhausted - provide troubleshooting guidance
      console.error('\n' + '='.repeat(70));
      console.error('❌ MONGODB CONNECTION FAILED - All retry attempts exhausted');
      console.error('='.repeat(70));
      console.error('\n💡 Troubleshooting steps:');
      console.error('  1. Verify your .env file exists and contains MONGO_URI');
      console.error('  2. Check if MongoDB Atlas IP whitelist includes your current IP');
      console.error('  3. Verify MongoDB credentials are correct');
      console.error('  4. Ensure your network allows connections to MongoDB Atlas');
      console.error('  5. Check if MongoDB Atlas cluster is running');
      console.error('\n📝 Common error codes:');
      console.error('  - ENOTFOUND: DNS lookup failed (check connection string)');
      console.error('  - ETIMEDOUT: Connection timeout (check firewall/IP whitelist)');
      console.error('  - Authentication failed: Wrong username/password');
      console.error('='.repeat(70) + '\n');

      // Create a more informative final error message
      const finalErrorMsg = error instanceof Error 
        ? `Failed to connect to MongoDB after ${this.maxReconnectAttempts} attempts: ${error.message}`
        : `Failed to connect to MongoDB after ${this.maxReconnectAttempts} attempts`;
      
      throw new Error(finalErrorMsg);
    }
  }

  private setupCleanup(): void {
    const cleanup = async () => {
      log.info('🧹 Closing MongoDB connection...');
      try {
        if (this.client) {
          await this.client.close();
          this.connectionStatus = 'disconnected';
          log.info('✅ MongoDB connection closed successfully');
        }
      } catch (error) {
        log.error('❌ Error closing MongoDB connection', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  }

  public getDatabase(): Db {
    if (!this.db || this.connectionStatus !== 'connected') {
      throw new Error('MongoDB is not connected. Call connect() first.');
    }
    return this.db;
  }

  public async checkHealth(): Promise<{
    status: string;
    latency: number;
    collections: string[];
  }> {
    try {
      const start = Date.now();
      
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      await this.db.command({ ping: 1 });
      const latency = Date.now() - start;
      
      const collections = await this.db.listCollections().toArray();
      
      return {
        status: 'connected',
        latency,
        collections: collections.map(c => c.name)
      };
    } catch (error) {
      log.error('❌ MongoDB health check failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      return {
        status: 'error',
        latency: -1,
        collections: []
      };
    }
  }

  public isConnected(): boolean {
    return this.connectionStatus === 'connected' && this.client !== null && this.db !== null;
  }
}

// Export singleton instance
const mongoDBInstance = MongoDB.getInstance();

// Export database getter function
export const getDB = (): Db => {
  return mongoDBInstance.getDatabase();
};

// Export connection function
export const connectDB = async (): Promise<void> => {
  await mongoDBInstance.connect();
};

// Export health check
export const checkMongoHealth = async () => {
  return await mongoDBInstance.checkHealth();
};

export default mongoDBInstance;
