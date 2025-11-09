import admin from "firebase-admin";
import { config } from "dotenv";
import { getErrorMessage } from "../utils/errors";

// Load environment variables from .env file (for local development)
// In production Cloud Functions, Firebase Admin SDK uses default credentials
config();

// Check if running in Firebase Functions environment
const isCloudFunctions = process.env.FUNCTION_NAME !== undefined;

// Define required environment variables with their validation rules (for non-Cloud Functions)
const requiredEnvVars = {
  FIREBASE_PROJECT_ID: {
    validate: (value: string) => value.length > 0,
    message: "Project ID cannot be empty"
  },
  FIREBASE_PRIVATE_KEY: {
    validate: (value: string) => value.includes("PRIVATE KEY"),
    message: "Private key appears to be invalid"
  },
  FIREBASE_CLIENT_EMAIL: {
    validate: (value: string) => value.includes("@") && value.includes("."),
    message: "Client email must be a valid email address"
  },
  FIREBASE_DATABASE_URL: {
    validate: (value: string) => value.startsWith("https://"),
    message: "Database URL must be a valid HTTPS URL"
  },
  FIREBASE_STORAGE_BUCKET: {
    validate: (value: string) => value.includes(".appspot.com"),
    message: "Storage bucket must be a valid Firebase storage bucket"
  }
} as const;

// Validate environment variables only if not running in Cloud Functions
if (!isCloudFunctions) {
  const errors: string[] = [];
  for (const [key, config] of Object.entries(requiredEnvVars)) {
    const value = process.env[key];
    if (!value) {
      errors.push(`Missing ${key}`);
    } else if (!config.validate(value)) {
      errors.push(`Invalid ${key}: ${config.message}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Firebase configuration errors:\n${errors.join("\n")}`);
  }

  // Environment variable validation passed
  console.log("✅ Firebase environment variables validated successfully");
} else {
  console.log("✅ Running in Cloud Functions - using default credentials");
}

// Custom error for Firebase initialization
class FirebaseInitializationError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'FirebaseInitializationError';
  }
}

// Service account interface with strict typing
interface FirebaseServiceAccount extends admin.ServiceAccount {
  projectId: string;
  privateKey: string;
  clientEmail: string;
}

// Connection status tracking
type ConnectionStatus = 'initializing' | 'connected' | 'disconnected' | 'error';

class FirebaseAdmin {
  private static instance: FirebaseAdmin | null = null;
  private app: admin.app.App;
  private _db: admin.firestore.Firestore | null = null;
  private _auth: admin.auth.Auth | null = null;
  private _storage: admin.storage.Storage | null = null;
  private status: ConnectionStatus = 'initializing';
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 1000; // ms

  private constructor() {
    try {
      // Initialize Firebase Admin SDK
      if (isCloudFunctions) {
        // In Cloud Functions, use default credentials
        this.app = admin.initializeApp();
      } else {
        // For local development, use service account
        const serviceAccount: FirebaseServiceAccount = {
          projectId: process.env.FIREBASE_PROJECT_ID!,
          privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        };

        this.app = this.initializeWithRetry({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: process.env.FIREBASE_DATABASE_URL,
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        });
      }

      // Set up cleanup handlers
      this.setupCleanup();
      
      console.log("✅ Firebase Admin SDK initialized successfully");
      this.status = 'connected';
    } catch (error) {
      this.status = 'error';
      console.error("❌ Firebase Admin SDK initialization failed:", getErrorMessage(error));
      throw new FirebaseInitializationError("Failed to initialize Firebase Admin SDK", error);
    }
  }

  private initializeWithRetry(config: admin.AppOptions): admin.app.App {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxReconnectAttempts; attempt++) {
      try {
        return admin.initializeApp(config);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Firebase initialization attempt ${attempt} failed:`, getErrorMessage(error));
        
        if (attempt < this.maxReconnectAttempts) {
          console.log(`Retrying in ${this.reconnectDelay}ms...`);
          // Synchronous delay for initialization. Consider using an asynchronous delay (e.g., setTimeout with a Promise)
          // for better non-blocking behavior in a production environment, though for initialization it might be acceptable.
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, this.reconnectDelay);
        }
      }
    }
    
    throw lastError || new Error("Failed to initialize Firebase after multiple attempts");
  }

  private setupCleanup(): void {
    // Handle process termination
    const cleanup = async () => {
      console.log("🧹 Cleaning up Firebase connections...");
      try {
        if (this.app) {
          await this.app.delete();
          console.log("✅ Firebase connections closed successfully");
        }
      } catch (error) {
        console.error("❌ Error during Firebase cleanup:", getErrorMessage(error));
      }
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    // Removed 'exit' handler as it's synchronous and doesn't support async operations like app.delete()
  }

  private initializeService<T>(
    serviceInitializer: () => T,
    serviceName: string
  ): T {
    try {
      const service = serviceInitializer();
      console.log(`✅ ${serviceName} initialized`);
      return service;
    } catch (error) {
      this.status = 'error';
      console.error(`❌ ${serviceName} initialization failed:`, getErrorMessage(error));
      throw new FirebaseInitializationError(`Failed to initialize ${serviceName}`, error);
    }
  }

  public get db(): admin.firestore.Firestore {
    if (!this._db) {
      this._db = this.initializeService(
        () => this.app.firestore(),
        "Firestore"
      );
    }
    return this._db!;
  }

  public get auth(): admin.auth.Auth {
    if (!this._auth) {
      this._auth = this.initializeService(
        () => this.app.auth(),
        "Firebase Auth"
      );
    }
    return this._auth!;
  }

  public get storage(): admin.storage.Storage {
    if (!this._storage) {
      this._storage = this.initializeService(
        () => this.app.storage(),
        "Firebase Storage"
      );
    }
    return this._storage!;
  }

  public static getInstance(): FirebaseAdmin {
    if (!FirebaseAdmin.instance) {
      FirebaseAdmin.instance = new FirebaseAdmin();
    }
    return FirebaseAdmin.instance;
  }

  public async checkHealth(): Promise<{
    status: ConnectionStatus;
    services: {
      firestore: boolean;
      auth: boolean;
      storage: boolean;
    };
    latency: Record<string, number>;
  }> {
    const health = {
      status: this.status,
      services: {
        firestore: false,
        auth: false,
        storage: false
      },
      latency: {} as Record<string, number>
    };

    try {
      // Check Firestore
      const firestoreStart = Date.now();
      await this.db.listCollections();
      health.services.firestore = true;
      health.latency.firestore = Date.now() - firestoreStart;

      // Check Auth
      const authStart = Date.now();
      await this.auth.listUsers(1);
      health.services.auth = true;
      health.latency.auth = Date.now() - authStart;

      // Check Storage
      const storageStart = Date.now();
      await this.storage.bucket().exists();
      health.services.storage = true;
      health.latency.storage = Date.now() - storageStart;

      this.status = 'connected';
    } catch (error) {
      console.error("❌ Health check failed:", getErrorMessage(error));
      this.status = 'error';
    }

    return health;
  }

  public async reconnect(): Promise<boolean> {
    if (this.status === 'connected') return true;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      throw new Error("Maximum reconnection attempts reached");
    }

    try {
      this.reconnectAttempts++;
      this.status = 'initializing';
      
      // Reset service instances
      this._db = null;
      this._auth = null;
      this._storage = null;

      // Check connections
      const health = await this.checkHealth();
      return Object.values(health.services).every(status => status);
    } catch (error) {
      console.error(`❌ Reconnection attempt ${this.reconnectAttempts} failed:`, getErrorMessage(error));
      return false;
    }
  }
}

const firebase = FirebaseAdmin.getInstance();

// Export typed services with connection validation
export const db: admin.firestore.Firestore = firebase.db;
export const auth: admin.auth.Auth = firebase.auth;
export const storage: admin.storage.Storage = firebase.storage;

// Export health check function for monitoring
export const checkFirebaseHealth = () => firebase.checkHealth();

export default firebase;
