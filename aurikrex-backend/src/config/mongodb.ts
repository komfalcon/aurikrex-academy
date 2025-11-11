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
      throw new Error('MONGO_URI environment variable is not set');
    }

    // Extract database name from URI or use default
    const dbName = process.env.MONGO_DB_NAME || 'aurikrex-academy';

    const options: MongoClientOptions = {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
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

      log.info('🔌 Connecting to MongoDB Atlas...', {
        dbName: config.dbName,
        // Don't log the full URI for security
        uriPrefix: config.uri.substring(0, 20) + '...'
      });

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
      
      log.error('❌ MongoDB connection failed', {
        error: error instanceof Error ? error.message : String(error),
        attempt: this.reconnectAttempts
      });

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        log.info(`🔄 Retrying connection in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.connect();
      }

      throw new Error(`Failed to connect to MongoDB after ${this.maxReconnectAttempts} attempts`);
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
