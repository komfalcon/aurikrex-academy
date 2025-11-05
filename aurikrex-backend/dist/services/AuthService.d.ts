import { AuthUser, RegisterRequest } from '../types/auth.types.js';
export declare class AuthService {
    /**
     * Creates a new user in Firebase Authentication
     */
    createUser(data: RegisterRequest): Promise<AuthUser>;
    /**
     * Generates a custom token for the user
     */
    generateCustomToken(uid: string): Promise<string>;
    /**
     * Verifies an ID token and returns the decoded token
     */
    verifyIdToken(idToken: string): Promise<AuthUser>;
    /**
     * Updates a user's profile information
     */
    updateUser(uid: string, data: Partial<RegisterRequest>): Promise<AuthUser>;
    /**
     * Deletes a user from Firebase Authentication
     */
    deleteUser(uid: string): Promise<void>;
    /**
     * Gets a user by their UID
     */
    getUserById(uid: string): Promise<AuthUser>;
    /**
     * Gets a user by their email
     */
    getUserByEmail(email: string): Promise<AuthUser>;
    /**
     * Lists all users (paginated)
     */
    listUsers(maxResults?: number): Promise<AuthUser[]>;
    /**
     * Maps a Firebase UserRecord to our AuthUser type
     */
    private mapUserToAuthUser;
}
export declare const authService: AuthService;
