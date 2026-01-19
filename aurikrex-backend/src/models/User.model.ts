import { Collection, ObjectId, Filter, UpdateFilter } from 'mongodb';
import { getDB } from '../config/mongodb.js';
import { log } from '../utils/logger.js';
import bcrypt from 'bcryptjs';

// Supported OAuth providers - extensible for future providers like Apple
export type OAuthProvider = 'google' | 'microsoft' | 'github';

export interface UserDocument {
  _id?: ObjectId;
  email: string;
  password: string; // Hashed password (random for OAuth users)
  displayName?: string;
  username?: string;
  role: 'student' | 'instructor' | 'admin';
  disabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
  emailVerified: boolean;
  photoURL?: string;
  // OAuth provider fields for normalized user storage
  provider?: OAuthProvider;
  providerUserId?: string;
  preferences: {
    [key: string]: any;
  };
  progress: {
    completedLessons: number;
    totalTimeSpent: number;
  };
}

export class UserModel {
  private static collectionName = 'users';

  private static getCollection(): Collection<UserDocument> {
    return getDB().collection<UserDocument>(this.collectionName);
  }

  /**
   * Create a new user
   */
  static async create(userData: {
    email: string;
    password: string;
    displayName?: string;
    role?: 'student' | 'instructor' | 'admin';
  }): Promise<UserDocument> {
    try {
      const collection = this.getCollection();

      // Check if user already exists
      const existingUser = await collection.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error('Email already in use');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const now = new Date();
      const user: UserDocument = {
        email: userData.email,
        password: hashedPassword,
        displayName: userData.displayName || userData.email.split('@')[0],
        role: userData.role || 'student',
        disabled: false,
        createdAt: now,
        updatedAt: now,
        lastLogin: null,
        emailVerified: false,
        preferences: {},
        progress: {
          completedLessons: 0,
          totalTimeSpent: 0
        }
      };

      const result = await collection.insertOne(user);
      log.info('✅ User created successfully', { 
        userId: result.insertedId,
        email: userData.email 
      });

      return { ...user, _id: result.insertedId };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('E11000') && message.includes('username')) {
        throw new Error('Username already in use');
      }
      if (message.includes('E11000') && message.includes('email')) {
        throw new Error('Email already in use');
      }
      log.error('❌ Error creating user', { 
        error: message,
        email: userData.email 
      });
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  static async findById(userId: string | ObjectId): Promise<UserDocument | null> {
    try {
      const collection = this.getCollection();
      const _id = typeof userId === 'string' ? new ObjectId(userId) : userId;
      
      const user = await collection.findOne({ _id });
      
      if (user) {
        log.info('✅ User found by ID', { userId: _id.toString() });
      }
      
      return user;
    } catch (error) {
      log.error('❌ Error finding user by ID', { 
        error: error instanceof Error ? error.message : String(error),
        userId 
      });
      throw error;
    }
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<UserDocument | null> {
    try {
      const collection = this.getCollection();
      const user = await collection.findOne({ email });
      
      if (user) {
        log.info('✅ User found by email', { email });
      }
      
      return user;
    } catch (error) {
      log.error('❌ Error finding user by email', { 
        error: error instanceof Error ? error.message : String(error),
        email 
      });
      throw error;
    }
  }

  /**
   * Find user by username (case-insensitive)
   */
  static async findByUsername(username: string, excludeUserId?: string): Promise<UserDocument | null> {
    try {
      const collection = this.getCollection();
      const escapedUsername = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const usernamePattern = new RegExp(`^${escapedUsername}$`, 'i');
      const filter: Filter<UserDocument> = {
        username: { $regex: usernamePattern }
      };

      if (excludeUserId) {
        try {
          filter._id = { $ne: new ObjectId(excludeUserId) };
        } catch {
          log.warn('⚠️ Invalid excludeUserId provided for username lookup', { excludeUserId });
        }
      }

      const user = await collection.findOne(filter);

      if (user) {
        log.info('✅ User found by username', { username });
      }

      return user;
    } catch (error) {
      log.error('❌ Error finding user by username', { 
        error: error instanceof Error ? error.message : String(error),
        username 
      });
      throw error;
    }
  }

  /**
   * Update user
   */
  static async update(
    userId: string | ObjectId,
    updateData: Partial<UserDocument>
  ): Promise<UserDocument | null> {
    try {
      const collection = this.getCollection();
      const _id = typeof userId === 'string' ? new ObjectId(userId) : userId;

      // Hash password if being updated
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      const update: UpdateFilter<UserDocument> = {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      };

      const result = await collection.findOneAndUpdate(
        { _id },
        update,
        { returnDocument: 'after' }
      );

      if (result) {
        log.info('✅ User updated successfully', { userId: _id.toString() });
      }

      return result || null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('E11000') && message.includes('username')) {
        throw new Error('Username already in use');
      }
      log.error('❌ Error updating user', { 
        error: message,
        userId 
      });
      throw error;
    }
  }

  /**
   * Delete user
   */
  static async delete(userId: string | ObjectId): Promise<boolean> {
    try {
      const collection = this.getCollection();
      const _id = typeof userId === 'string' ? new ObjectId(userId) : userId;

      const result = await collection.deleteOne({ _id });
      
      if (result.deletedCount > 0) {
        log.info('✅ User deleted successfully', { userId: _id.toString() });
        return true;
      }
      
      return false;
    } catch (error) {
      log.error('❌ Error deleting user', { 
        error: error instanceof Error ? error.message : String(error),
        userId 
      });
      throw error;
    }
  }

  /**
   * List users with pagination
   */
  static async list(options: {
    page?: number;
    limit?: number;
    filter?: Filter<UserDocument>;
  } = {}): Promise<{ users: UserDocument[]; total: number; page: number; limit: number }> {
    try {
      const collection = this.getCollection();
      const page = options.page || 1;
      const limit = options.limit || 100;
      const skip = (page - 1) * limit;

      const filter = options.filter || {};

      const [users, total] = await Promise.all([
        collection.find(filter).skip(skip).limit(limit).toArray(),
        collection.countDocuments(filter)
      ]);

      log.info('✅ Users listed successfully', { 
        page, 
        limit, 
        total,
        returned: users.length 
      });

      return { users, total, page, limit };
    } catch (error) {
      log.error('❌ Error listing users', { 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Verify password
   */
  static async verifyPassword(email: string, password: string): Promise<UserDocument | null> {
    try {
      const user = await this.findByEmail(email);
      
      if (!user) {
        log.warn('⚠️ User not found during password verification', { email });
        return null;
      }

      const isValid = await bcrypt.compare(password, user.password);
      
      if (isValid) {
        log.info('✅ Password verified successfully', { email });
        
        // Update last login
        await this.update(user._id!, { lastLogin: new Date() });
        
        return user;
      }
      
      log.warn('⚠️ Invalid password attempt', { email });
      return null;
    } catch (error) {
      log.error('❌ Error verifying password', { 
        error: error instanceof Error ? error.message : String(error),
        email 
      });
      throw error;
    }
  }

  /**
   * Update user progress
   */
  static async updateProgress(
    userId: string | ObjectId,
    progressData: Partial<UserDocument['progress']>
  ): Promise<UserDocument | null> {
    try {
      const collection = this.getCollection();
      const _id = typeof userId === 'string' ? new ObjectId(userId) : userId;

      const updateFields: any = {
        updatedAt: new Date()
      };
      
      if (Object.keys(progressData).length > 0) {
        updateFields.progress = progressData;
      }

      const result = await collection.findOneAndUpdate(
        { _id },
        { $set: updateFields },
        { returnDocument: 'after' }
      );

      if (result) {
        log.info('✅ User progress updated', { userId: _id.toString() });
      }

      return result || null;
    } catch (error) {
      log.error('❌ Error updating user progress', { 
        error: error instanceof Error ? error.message : String(error),
        userId 
      });
      throw error;
    }
  }

  /**
   * Find user by OAuth provider and provider user ID
   */
  static async findByProvider(provider: OAuthProvider, providerUserId: string): Promise<UserDocument | null> {
    try {
      const collection = this.getCollection();
      const user = await collection.findOne({ provider, providerUserId });
      
      if (user) {
        log.info('✅ User found by OAuth provider', { provider, providerUserId });
      }
      
      return user;
    } catch (error) {
      log.error('❌ Error finding user by provider', { 
        error: error instanceof Error ? error.message : String(error),
        provider,
        providerUserId 
      });
      throw error;
    }
  }

  /**
   * Find or create user from OAuth provider
   * This normalizes users from different OAuth providers into a single user table
   */
  static async findOrCreateFromOAuth(oauthData: {
    provider: OAuthProvider;
    providerUserId: string;
    email: string;
    displayName?: string;
    photoURL?: string;
  }): Promise<UserDocument> {
    try {
      const collection = this.getCollection();
      const { provider, providerUserId, email, displayName, photoURL } = oauthData;

      // First, try to find user by provider + providerUserId
      let user = await this.findByProvider(provider, providerUserId);

      if (user) {
        // Update last login and any changed OAuth data
        const updateData: Partial<UserDocument> = {
          lastLogin: new Date(),
          updatedAt: new Date(),
        };
        if (displayName && displayName !== user.displayName) {
          updateData.displayName = displayName;
        }
        if (photoURL && photoURL !== user.photoURL) {
          updateData.photoURL = photoURL;
        }
        
        user = await this.update(user._id!, updateData);
        log.info('✅ Existing OAuth user updated', { email, provider });
        return user!;
      }

      // Check if user exists with same email (possibly from another provider)
      const existingEmailUser = await this.findByEmail(email);
      
      if (existingEmailUser) {
        // Link this provider to existing account if it's their first OAuth login
        // or if the account doesn't have a provider set yet
        if (!existingEmailUser.provider) {
          const updatedUser = await this.update(existingEmailUser._id!, {
            provider,
            providerUserId,
            emailVerified: true, // OAuth emails are verified
            photoURL: photoURL || existingEmailUser.photoURL,
            displayName: displayName || existingEmailUser.displayName,
            lastLogin: new Date(),
          });
          log.info('✅ Linked OAuth provider to existing user', { email, provider });
          return updatedUser!;
        }
        
        // User exists with different provider - allow login if email matches
        // This enables users who previously used one provider to use another
        log.info('✅ OAuth login for existing user with different provider', { email, provider });
        const updatedUser = await this.update(existingEmailUser._id!, {
          lastLogin: new Date(),
        });
        return updatedUser!;
      }

      // Create new user from OAuth data
      const now = new Date();
      // Generate random password for OAuth users (they authenticate via OAuth, not password)
      const randomPassword = await bcrypt.hash(
        Math.random().toString(36) + Date.now().toString(36),
        10
      );

      const newUser: UserDocument = {
        email,
        password: randomPassword,
        displayName: displayName || email.split('@')[0],
        role: 'student',
        disabled: false,
        createdAt: now,
        updatedAt: now,
        lastLogin: now,
        emailVerified: true, // OAuth emails are verified by the provider
        photoURL,
        provider,
        providerUserId,
        preferences: {},
        progress: {
          completedLessons: 0,
          totalTimeSpent: 0
        }
      };

      const result = await collection.insertOne(newUser);
      log.info('✅ New OAuth user created', { 
        userId: result.insertedId,
        email,
        provider 
      });

      return { ...newUser, _id: result.insertedId };
    } catch (error) {
      log.error('❌ Error in findOrCreateFromOAuth', { 
        error: error instanceof Error ? error.message : String(error),
        email: oauthData.email,
        provider: oauthData.provider 
      });
      throw error;
    }
  }

  /**
   * Create indexes for optimal performance
   */
  static async createIndexes(): Promise<void> {
    try {
      const collection = this.getCollection();
      
      await Promise.all([
        collection.createIndex({ email: 1 }, { unique: true }),
        collection.createIndex({ username: 1 }, { unique: true, sparse: true }),
        collection.createIndex({ role: 1 }),
        collection.createIndex({ createdAt: -1 }),
        collection.createIndex({ disabled: 1 }),
        // Index for OAuth provider lookups
        collection.createIndex({ provider: 1, providerUserId: 1 })
      ]);

      log.info('✅ User indexes created successfully');
    } catch (error) {
      log.error('❌ Error creating user indexes', { 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}
