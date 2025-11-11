import { auth } from '../config/firebase.js';
import { AuthUser, RegisterRequest } from '../types/auth.types.js';
import { UserRecord } from 'firebase-admin/auth';
import { getErrorMessage } from '../utils/errors.js';

export class AuthService {
  /**
   * Creates a new user in Firebase Authentication
   */
  public async createUser(data: RegisterRequest): Promise<AuthUser> {
    try {
      const userRecord = await auth.createUser({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        disabled: false,
      });

      // Set custom claims for user role
      const role = data.role || 'student';
      await auth.setCustomUserClaims(userRecord.uid, { role });

      // Update user record with custom fields
      const updatedUser = await auth.getUser(userRecord.uid);
      return this.mapUserToAuthUser(updatedUser);
    } catch (error) {
      console.error('Error creating user:', getErrorMessage(error));
      throw error;
    }
  }

  /**
   * Generates a custom token for the user
   */
  public async generateCustomToken(uid: string): Promise<string> {
    try {
      return await auth.createCustomToken(uid);
    } catch (error) {
      console.error('Error generating custom token:', getErrorMessage(error));
      throw error;
    }
  }

  /**
   * Verifies an ID token and returns the decoded token
   */
  public async verifyIdToken(idToken: string): Promise<AuthUser> {
    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const user = await auth.getUser(decodedToken.uid);
      return this.mapUserToAuthUser(user);
    } catch (error) {
      console.error('Error verifying ID token:', getErrorMessage(error));
      throw error;
    }
  }

  /**
   * Updates a user's profile information
   */
  public async updateUser(uid: string, data: Partial<RegisterRequest>): Promise<AuthUser> {
    try {
      const userRecord = await auth.updateUser(uid, {
        email: data.email,
        password: data.password,
        displayName: data.displayName,
      });

      if (data.role) {
        await auth.setCustomUserClaims(uid, { role: data.role });
      }

      return this.mapUserToAuthUser(userRecord);
    } catch (error) {
      console.error('Error updating user:', getErrorMessage(error));
      throw error;
    }
  }

  /**
   * Deletes a user from Firebase Authentication
   */
  public async deleteUser(uid: string): Promise<void> {
    try {
      await auth.deleteUser(uid);
    } catch (error) {
      console.error('Error deleting user:', getErrorMessage(error));
      throw error;
    }
  }

  /**
   * Gets a user by their UID
   */
  public async getUserById(uid: string): Promise<AuthUser> {
    try {
      const user = await auth.getUser(uid);
      return this.mapUserToAuthUser(user);
    } catch (error) {
      console.error('Error getting user:', getErrorMessage(error));
      throw error;
    }
  }

  /**
   * Gets a user by their email
   */
  public async getUserByEmail(email: string): Promise<AuthUser> {
    try {
      const user = await auth.getUserByEmail(email);
      return this.mapUserToAuthUser(user);
    } catch (error) {
      console.error('Error getting user by email:', getErrorMessage(error));
      throw error;
    }
  }

  /**
   * Lists all users (paginated)
   */
  public async listUsers(maxResults = 1000): Promise<AuthUser[]> {
    try {
      const listUsersResult = await auth.listUsers(maxResults);
      return listUsersResult.users.map(user => this.mapUserToAuthUser(user));
    } catch (error) {
      console.error('Error listing users:', getErrorMessage(error));
      throw error;
    }
  }

  /**
   * Maps a Firebase UserRecord to our AuthUser type
   */
  private mapUserToAuthUser(user: UserRecord): AuthUser {
    const customClaims = user.customClaims || {};
    return {
      ...user,
      role: customClaims.role || 'student',
      createdAt: new Date(user.metadata.creationTime || Date.now()),
      lastLogin: new Date(user.metadata.lastSignInTime || Date.now())
    };
  }
}

// Export a singleton instance
export const authService = new AuthService();