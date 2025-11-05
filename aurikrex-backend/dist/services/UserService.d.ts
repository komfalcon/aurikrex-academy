import { AuthUser, RegisterRequest } from '../types/auth.types.js';
export declare class UserService {
    private readonly usersCollection;
    /**
     * Registers a new user
     */
    register(data: RegisterRequest): Promise<AuthUser>;
    /**
     * Gets a user by their ID
     */
    getUserById(uid: string): Promise<AuthUser>;
    /**
     * Updates a user's profile
     */
    updateUser(uid: string, data: Partial<RegisterRequest>): Promise<AuthUser>;
    /**
     * Deletes a user and their profile
     */
    deleteUser(uid: string): Promise<void>;
    /**
     * Lists all users with pagination
     */
    listUsers(pageSize?: number, pageToken?: string): Promise<{
        users: AuthUser[];
        nextPageToken?: string;
    }>;
    /**
     * Creates a user profile in Firestore
     */
    private createUserProfile;
    /**
     * Updates a user's profile in Firestore
     */
    private updateUserProfile;
    /**
     * Gets a user's profile from Firestore
     */
    private getUserProfile;
    /**
     * Gets multiple user profiles from Firestore
     */
    private getUserProfiles;
    /**
     * Maps a Firebase user record to our AuthUser type
     */
    private mapUserToAuthUser;
    /**
     * Utility to chunk an array into smaller arrays
     */
    private chunkArray;
}
export declare const userService: UserService;
