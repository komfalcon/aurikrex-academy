import { UserModel, UserDocument } from '../models/User.model.js';
import { AuthUser, RegisterRequest } from '../types/auth.types.js';
import { validateSchema } from '../utils/validation.js';
import { registerSchema } from '../utils/schemas.js';
import { withErrorHandling, AuthError } from '../utils/errors.js';
import { getErrorMessage } from '../utils/errors.js';
import { generateTokenPair, TokenPayload } from '../utils/jwt.js';

export class UserService {
  /**
   * Registers a new user
   */
  public async register(data: RegisterRequest): Promise<{ user: AuthUser; tokens: { accessToken: string; refreshToken: string } }> {
    return withErrorHandling(async () => {
      // Validate input
      validateSchema(data, registerSchema);

      try {
        console.log('🔐 Registering new user:', data.email);

        // Create user in MongoDB
        const userDoc = await UserModel.create({
          email: data.email,
          password: data.password,
          displayName: data.displayName,
          role: data.role || 'student'
        });

        console.log('✅ User created in database:', userDoc._id?.toString());

        // Convert to AuthUser format
        const authUser = this.mapDocumentToAuthUser(userDoc);

        // Generate JWT tokens
        const tokenPayload: TokenPayload = {
          userId: userDoc._id!.toString(),
          email: userDoc.email,
          role: userDoc.role
        };
        const tokens = generateTokenPair(tokenPayload);

        console.log('✅ User registered successfully:', authUser.email);

        return { user: authUser, tokens };
      } catch (error) {
        console.error('❌ Error registering user:', getErrorMessage(error));
        if (error instanceof Error && error.message.includes('already in use')) {
          throw new AuthError('Email already in use', 'email-already-exists', 409);
        }
        throw error;
      }
    });
  }

  /**
   * Login user with email and password
   */
  public async login(email: string, password: string): Promise<{ user: AuthUser; tokens: { accessToken: string; refreshToken: string } }> {
    return withErrorHandling(async () => {
      try {
        console.log('🔐 User login attempt:', email);

        // Verify credentials
        const userDoc = await UserModel.verifyPassword(email, password);
        
        if (!userDoc) {
          console.warn('⚠️ Invalid credentials for:', email);
          throw new AuthError('Invalid email or password', 'invalid-credentials', 401);
        }

        if (userDoc.disabled) {
          console.warn('⚠️ Account disabled:', email);
          throw new AuthError('Account has been disabled', 'account-disabled', 403);
        }

        console.log('✅ Credentials verified for:', email);

        // Convert to AuthUser format
        const authUser = this.mapDocumentToAuthUser(userDoc);

        // Generate JWT tokens
        const tokenPayload: TokenPayload = {
          userId: userDoc._id!.toString(),
          email: userDoc.email,
          role: userDoc.role
        };
        const tokens = generateTokenPair(tokenPayload);

        console.log('✅ User logged in successfully:', email);

        return { user: authUser, tokens };
      } catch (error) {
        console.error('❌ Login error:', getErrorMessage(error));
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
        console.log('🔍 Fetching user by ID:', uid);

        const userDoc = await UserModel.findById(uid);
        
        if (!userDoc) {
          throw new AuthError('User not found', 'user-not-found', 404);
        }

        console.log('✅ User found:', userDoc.email);

        return this.mapDocumentToAuthUser(userDoc);
      } catch (error) {
        console.error(`❌ Error getting user ${uid}:`, getErrorMessage(error));
        throw error;
      }
    });
  }

  /**
   * Gets a user by their email
   */
  public async getUserByEmail(email: string): Promise<AuthUser | null> {
    return withErrorHandling(async () => {
      try {
        console.log('🔍 Fetching user by email:', email);

        const userDoc = await UserModel.findByEmail(email);
        
        if (!userDoc) {
          return null;
        }

        console.log('✅ User found by email:', userDoc.email);

        return this.mapDocumentToAuthUser(userDoc);
      } catch (error) {
        console.error(`❌ Error getting user by email ${email}:`, getErrorMessage(error));
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
        console.log('📝 Updating user:', uid);

        const updateData: Partial<UserDocument> = {};
        if (data.email) updateData.email = data.email;
        if (data.password) updateData.password = data.password;
        if (data.displayName) updateData.displayName = data.displayName;
        if (data.role) updateData.role = data.role;

        const updatedUser = await UserModel.update(uid, updateData);

        if (!updatedUser) {
          throw new AuthError('User not found', 'user-not-found', 404);
        }

        console.log('✅ User updated successfully:', updatedUser.email);

        return this.mapDocumentToAuthUser(updatedUser);
      } catch (error) {
        console.error(`❌ Error updating user ${uid}:`, getErrorMessage(error));
        throw error;
      }
    });
  }

  /**
   * Deletes a user
   */
  public async deleteUser(uid: string): Promise<void> {
    return withErrorHandling(async () => {
      try {
        console.log('🗑️ Deleting user:', uid);

        const deleted = await UserModel.delete(uid);
        
        if (!deleted) {
          throw new AuthError('User not found', 'user-not-found', 404);
        }

        console.log('✅ User deleted successfully:', uid);
      } catch (error) {
        console.error(`❌ Error deleting user ${uid}:`, getErrorMessage(error));
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
        const page = pageToken ? parseInt(pageToken) : 1;
        console.log('📋 Listing users, page:', page);

        const result = await UserModel.list({
          page,
          limit: pageSize
        });

        const users = result.users.map(doc => this.mapDocumentToAuthUser(doc));
        const nextPageToken = result.page * result.limit < result.total 
          ? (result.page + 1).toString() 
          : undefined;

        console.log(`✅ Listed ${users.length} users out of ${result.total} total`);

        return {
          users,
          nextPageToken
        };
      } catch (error) {
        console.error('❌ Error listing users:', getErrorMessage(error));
        throw error;
      }
    });
  }

  /**
   * Update user progress
   */
  public async updateUserProgress(
    uid: string,
    progress: { completedLessons: number; totalTimeSpent: number }
  ): Promise<void> {
    return withErrorHandling(async () => {
      try {
        console.log('📊 Updating user progress:', uid);

        await UserModel.updateProgress(uid, progress);

        console.log('✅ User progress updated:', uid);
      } catch (error) {
        console.error(`❌ Error updating user progress ${uid}:`, getErrorMessage(error));
        throw error;
      }
    });
  }

  /**
   * Maps a MongoDB UserDocument to AuthUser type
   */
  private mapDocumentToAuthUser(doc: UserDocument): AuthUser {
    return {
      uid: doc._id!.toString(),
      email: doc.email || '',
      displayName: doc.displayName,
      emailVerified: doc.emailVerified,
      disabled: doc.disabled,
      photoURL: doc.photoURL,
      role: doc.role,
      createdAt: doc.createdAt,
      lastLogin: doc.lastLogin || doc.createdAt,
      customClaims: {
        role: doc.role
      },
      metadata: {
        creationTime: doc.createdAt.toISOString(),
        lastSignInTime: doc.lastLogin?.toISOString() || doc.createdAt.toISOString(),
        toJSON: () => ({
          creationTime: doc.createdAt.toISOString(),
          lastSignInTime: doc.lastLogin?.toISOString() || doc.createdAt.toISOString(),
          lastRefreshTime: null
        })
      },
      providerData: [],
      tokensValidAfterTime: doc.createdAt.toISOString()
    };
  }
}

// Export singleton instance
export const userService = new UserService();
