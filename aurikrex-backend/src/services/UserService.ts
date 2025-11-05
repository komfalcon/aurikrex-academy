import { auth, db } from '../config/firebase.js';
import { AuthUser, RegisterRequest } from '../types/auth.types.js';
import { validateSchema } from '../utils/validation.js';
import { registerSchema } from '../utils/schemas.js';
import { withErrorHandling } from '../utils/errors.js';
import { getErrorMessage } from '../utils/errors.js';
import { UserRecord, UpdateRequest } from 'firebase-admin/auth';
import { AuthError } from '../utils/errors.js';
import { FieldPath } from 'firebase-admin/firestore';

export class UserService {
  private readonly usersCollection = 'users';

  /**
   * Registers a new user
   */
  public async register(data: RegisterRequest): Promise<AuthUser> {
    return withErrorHandling(async () => {
      // Validate input
      validateSchema(data, registerSchema);

      try {
        // Check if user exists
        const existingUser = await auth.getUserByEmail(data.email).catch(() => null);
        if (existingUser) {
          throw new AuthError('Email already in use', 'email-already-exists', 409);
        }

        // Create user in Firebase Auth
        const userRecord = await auth.createUser({
          email: data.email,
          password: data.password,
          displayName: data.displayName,
          disabled: false,
        });

        // Set custom claims for user role
        const role = data.role || 'student';
        await auth.setCustomUserClaims(userRecord.uid, { role });

        // Create user profile in Firestore
        await this.createUserProfile(userRecord, role);

        // Return complete user data
        return this.getUserById(userRecord.uid);
      } catch (error) {
        console.error('Error registering user:', getErrorMessage(error));
        throw error;
      }
    });
  }

  /**
   * Gets a user by their ID
   */
  public async getUserById(uid: string): Promise<AuthUser> {
    return withErrorHandling(async () => {
      try {
        const [userRecord, profile] = await Promise.all([
          auth.getUser(uid),
          this.getUserProfile(uid)
        ]);

        return this.mapUserToAuthUser(userRecord, profile);
      } catch (error) {
        console.error(`Error getting user ${uid}:`, getErrorMessage(error));
        throw error;
      }
    });
  }

  /**
   * Updates a user's profile
   */
  public async updateUser(uid: string, data: Partial<RegisterRequest>): Promise<AuthUser> {
    return withErrorHandling(async () => {
      try {
      const updates: UpdateRequest = {};
      if (data.email) updates.email = data.email;
      if (data.password) updates.password = data.password;
      if (data.displayName) updates.displayName = data.displayName;

      await auth.updateUser(uid, updates);

      if (data.role) {
        await auth.setCustomUserClaims(uid, { role: data.role });
        await this.updateUserProfile(uid, { role: data.role });
      }

      return this.getUserById(uid);
      } catch (error) {
        console.error(`Error updating user ${uid}:`, getErrorMessage(error));
        throw error;
      }
    });
  }

  /**
   * Deletes a user and their profile
   */
  public async deleteUser(uid: string): Promise<void> {
    return withErrorHandling(async () => {
      try {
        await Promise.all([
          auth.deleteUser(uid),
          db.collection(this.usersCollection).doc(uid).delete()
        ]);
      } catch (error) {
        console.error(`Error deleting user ${uid}:`, getErrorMessage(error));
        throw error;
      }
    });
  }

  /**
   * Lists all users with pagination
   */
  public async listUsers(pageSize = 100, pageToken?: string): Promise<{
    users: AuthUser[];
    nextPageToken?: string;
  }> {
    return withErrorHandling(async () => {
      try {
        const result = await auth.listUsers(pageSize, pageToken);
        const userProfiles = await this.getUserProfiles(result.users.map(u => u.uid));

        const users = result.users.map(user => 
          this.mapUserToAuthUser(user, userProfiles.get(user.uid))
        );

        return {
          users,
          nextPageToken: result.pageToken
        };
      } catch (error) {
        console.error('Error listing users:', getErrorMessage(error));
        throw error;
      }
    });
  }

  /**
   * Creates a user profile in Firestore
   */
  private async createUserProfile(user: UserRecord, role: string): Promise<void> {
    const profile = {
      email: user.email,
      displayName: user.displayName,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null,
      preferences: {},
      progress: {
        completedLessons: 0,
        totalTimeSpent: 0
      }
    };

    await db.collection(this.usersCollection).doc(user.uid).set(profile);
  }

  /**
   * Updates a user's profile in Firestore
   */
  private async updateUserProfile(uid: string, data: Record<string, any>): Promise<void> {
    await db.collection(this.usersCollection).doc(uid).update({
      ...data,
      updatedAt: new Date()
    });
  }

  /**
   * Gets a user's profile from Firestore
   */
  private async getUserProfile(uid: string): Promise<Record<string, any> | null> {
    const doc = await db.collection(this.usersCollection).doc(uid).get();
    return doc.exists ? doc.data() || null : null;
  }

  /**
   * Gets multiple user profiles from Firestore
   */
  private async getUserProfiles(uids: string[]): Promise<Map<string, Record<string, any>>> {
    const profiles = new Map();
    const chunks = this.chunkArray(uids, 10); // Process in batches of 10

    for (const chunk of chunks) {
      const snapshot = await db.collection(this.usersCollection)
        .where(FieldPath.documentId(), 'in', chunk)
        .get();

      snapshot.docs.forEach(doc => {
        profiles.set(doc.id, doc.data());
      });
    }

    return profiles;
  }

  /**
   * Maps a Firebase user record to our AuthUser type
   */
  private mapUserToAuthUser(user: UserRecord, _profile?: Record<string, any> | null): AuthUser {
    const customClaims = user.customClaims || {};
    const authUser: AuthUser = {
      ...user,
      role: (customClaims.role || 'student') as AuthUser['role'],
      createdAt: new Date(user.metadata.creationTime || Date.now()),
      lastLogin: new Date(user.metadata.lastSignInTime || Date.now())
    };
    return authUser;
  }

  /**
   * Utility to chunk an array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Export singleton instance
export const userService = new UserService();