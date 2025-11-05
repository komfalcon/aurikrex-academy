import admin from "firebase-admin";
import { config } from "dotenv";
import { getErrorMessage } from "../utils/errors.js";
// Load environment variables from .env file
config();
// Define required environment variables with their validation rules
const requiredEnvVars = {
    FIREBASE_PROJECT_ID: {
        validate: (value) => value.length > 0,
        message: "Project ID cannot be empty"
    },
    FIREBASE_PRIVATE_KEY: {
        validate: (value) => value.includes("PRIVATE KEY"),
        message: "Private key appears to be invalid"
    },
    FIREBASE_CLIENT_EMAIL: {
        validate: (value) => value.includes("@") && value.includes("."),
        message: "Client email must be a valid email address"
    },
    FIREBASE_DATABASE_URL: {
        validate: (value) => value.startsWith("https://"),
        message: "Database URL must be a valid HTTPS URL"
    },
    FIREBASE_STORAGE_BUCKET: {
        validate: (value) => value.includes(".appspot.com"),
        message: "Storage bucket must be a valid Firebase storage bucket"
    }
};
// Validate environment variables
const errors = [];
for (const [key, config] of Object.entries(requiredEnvVars)) {
    const value = process.env[key];
    if (!value) {
        errors.push(`Missing ${key}`);
    }
    else if (!config.validate(value)) {
        errors.push(`Invalid ${key}: ${config.message}`);
    }
}
if (errors.length > 0) {
    throw new Error(`Firebase configuration errors:\n${errors.join("\n")}`);
}
// Environment variable validation passed
console.log("✅ Firebase environment variables validated successfully");
// Custom error for Firebase initialization
class FirebaseInitializationError extends Error {
    cause;
    constructor(message, cause) {
        super(message);
        this.cause = cause;
        this.name = 'FirebaseInitializationError';
    }
}
class FirebaseAdmin {
    static instance = null;
    app;
    _db = null;
    _auth = null;
    _storage = null;
    status = 'initializing';
    reconnectAttempts = 0;
    maxReconnectAttempts = 5;
    reconnectDelay = 1000; // ms
    constructor() {
        // Create service account with validated environment variables
        const serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        };
        try {
            // Initialize Firebase Admin SDK with retry logic
            this.app = this.initializeWithRetry({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: process.env.FIREBASE_DATABASE_URL,
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            });
            // Set up cleanup handlers
            this.setupCleanup();
            console.log("✅ Firebase Admin SDK initialized successfully");
            this.status = 'connected';
        }
        catch (error) {
            this.status = 'error';
            console.error("❌ Firebase Admin SDK initialization failed:", getErrorMessage(error));
            throw new FirebaseInitializationError("Failed to initialize Firebase Admin SDK", error);
        }
    }
    initializeWithRetry(config) {
        let lastError = null;
        for (let attempt = 1; attempt <= this.maxReconnectAttempts; attempt++) {
            try {
                return admin.initializeApp(config);
            }
            catch (error) {
                lastError = error;
                console.warn(`Firebase initialization attempt ${attempt} failed:`, getErrorMessage(error));
                if (attempt < this.maxReconnectAttempts) {
                    console.log(`Retrying in ${this.reconnectDelay}ms...`);
                    // Synchronous delay for initialization
                    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, this.reconnectDelay);
                }
            }
        }
        throw lastError || new Error("Failed to initialize Firebase after multiple attempts");
    }
    setupCleanup() {
        // Handle process termination
        const cleanup = async () => {
            console.log("🧹 Cleaning up Firebase connections...");
            try {
                if (this.app) {
                    await this.app.delete();
                    console.log("✅ Firebase connections closed successfully");
                }
            }
            catch (error) {
                console.error("❌ Error during Firebase cleanup:", getErrorMessage(error));
            }
        };
        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);
        process.on('exit', cleanup);
    }
    initializeService(serviceInitializer, serviceName) {
        try {
            const service = serviceInitializer();
            console.log(`✅ ${serviceName} initialized`);
            return service;
        }
        catch (error) {
            this.status = 'error';
            console.error(`❌ ${serviceName} initialization failed:`, getErrorMessage(error));
            throw new FirebaseInitializationError(`Failed to initialize ${serviceName}`, error);
        }
    }
    get db() {
        if (!this._db) {
            this._db = this.initializeService(() => this.app.firestore(), "Firestore");
        }
        return this._db;
    }
    get auth() {
        if (!this._auth) {
            this._auth = this.initializeService(() => this.app.auth(), "Firebase Auth");
        }
        return this._auth;
    }
    get storage() {
        if (!this._storage) {
            this._storage = this.initializeService(() => this.app.storage(), "Firebase Storage");
        }
        return this._storage;
    }
    static getInstance() {
        if (!FirebaseAdmin.instance) {
            FirebaseAdmin.instance = new FirebaseAdmin();
        }
        return FirebaseAdmin.instance;
    }
    async checkHealth() {
        const health = {
            status: this.status,
            services: {
                firestore: false,
                auth: false,
                storage: false
            },
            latency: {}
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
        }
        catch (error) {
            console.error("❌ Health check failed:", getErrorMessage(error));
            this.status = 'error';
        }
        return health;
    }
    async reconnect() {
        if (this.status === 'connected')
            return true;
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
        }
        catch (error) {
            console.error(`❌ Reconnection attempt ${this.reconnectAttempts} failed:`, getErrorMessage(error));
            return false;
        }
    }
}
const firebase = FirebaseAdmin.getInstance();
// Export typed services with connection validation
export const db = firebase.db;
export const auth = firebase.auth;
export const storage = firebase.storage;
// Export health check function for monitoring
export const checkFirebaseHealth = () => firebase.checkHealth();
export default firebase;
//# sourceMappingURL=firebase.js.map