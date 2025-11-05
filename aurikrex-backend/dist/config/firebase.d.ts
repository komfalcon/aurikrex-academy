import admin from "firebase-admin";
type ConnectionStatus = 'initializing' | 'connected' | 'disconnected' | 'error';
declare class FirebaseAdmin {
    private static instance;
    private app;
    private _db;
    private _auth;
    private _storage;
    private status;
    private reconnectAttempts;
    private readonly maxReconnectAttempts;
    private readonly reconnectDelay;
    private constructor();
    private initializeWithRetry;
    private setupCleanup;
    private initializeService;
    get db(): admin.firestore.Firestore;
    get auth(): admin.auth.Auth;
    get storage(): admin.storage.Storage;
    static getInstance(): FirebaseAdmin;
    checkHealth(): Promise<{
        status: ConnectionStatus;
        services: {
            firestore: boolean;
            auth: boolean;
            storage: boolean;
        };
        latency: Record<string, number>;
    }>;
    reconnect(): Promise<boolean>;
}
declare const firebase: FirebaseAdmin;
export declare const db: admin.firestore.Firestore;
export declare const auth: admin.auth.Auth;
export declare const storage: admin.storage.Storage;
export declare const checkFirebaseHealth: () => Promise<{
    status: ConnectionStatus;
    services: {
        firestore: boolean;
        auth: boolean;
        storage: boolean;
    };
    latency: Record<string, number>;
}>;
export default firebase;
